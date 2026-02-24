// frontend/src/pages/LoginPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  UserPlus,
  ArrowRight,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import axios from "axios";
import { Turnstile } from "@marsidev/react-turnstile";
import { trackEvent } from "../lib/analytics";
import { useAuthStore } from "../stores/authStore";
import { getMe, login, verifyOtp } from "../api/auth";

type Mode = "login" | "signup";
type Status = "idle" | "loading" | "success" | "error";

type Step = "credentials" | "otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeTrack = (name: string, props?: Record<string, unknown>) => {
  try {
    trackEvent(name, props);
  } catch {}
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msgFromApi =
      (typeof err.response?.data === "string" ? err.response.data : undefined) ||
      (err.response?.data as any)?.detail ||
      (err.response?.data as any)?.message ||
      err.message;

    if (!err.response) return msgFromApi || "Network error. Please check the API server.";
    return msgFromApi || `Request failed (HTTP ${err.response.status}).`;
  }
  if (err instanceof Error) return err.message || "Login failed.";
  return "Login failed.";
}

type LocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

function buildPathname(from?: LocationState["from"]): string {
  if (!from?.pathname || typeof from.pathname !== "string") return "/dashboard";
  const search = typeof from.search === "string" ? from.search : "";
  const hash = typeof from.hash === "string" ? from.hash : "";
  return `${from.pathname}${search}${hash}`;
}

function getSafePathFromQuery(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/")) return null;
    if (decoded.startsWith("//")) return null;
    if (decoded.startsWith("/login")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function normalizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

const LoginPage: React.FC = () => {
  const [tab, setTab] = useState<Mode>("login");

  // 2-step flow
  const [step, setStep] = useState<Step>("credentials");
  const [tempToken, setTempToken] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  // Capture redirect target once (supports both: state.from and ?from=)
  const nextPathRef = useRef<string>("");
  const cameFromRedirectRef = useRef<boolean>(false);

  if (!nextPathRef.current) {
    const state = (location.state || {}) as LocationState;
    const fromState = buildPathname(state.from);

    const fromQueryRaw = searchParams.get("from");
    const fromQuery = getSafePathFromQuery(fromQueryRaw);

    const resolved = state.from?.pathname ? fromState : fromQuery || "/dashboard";
    cameFromRedirectRef.current = Boolean(state.from?.pathname) || Boolean(fromQuery);
    nextPathRef.current = resolved;
  }

  const nextPath = nextPathRef.current;
  const cameFromRedirect = cameFromRedirectRef.current;

  const effectiveToken = useMemo(() => {
    return (
      token ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("dhc_token") ||
      ""
    );
  }, [token]);

  // Auto-redirect only when we were sent here due to a protected redirect/401
  useEffect(() => {
    if (!cameFromRedirect) return;
    if (!effectiveToken) return;
    navigate(nextPath, { replace: true });
  }, [cameFromRedirect, effectiveToken, navigate, nextPath]);

  // Cleanup ?from= from URL after capturing it
  const cleanedFromRef = useRef(false);
  useEffect(() => {
    if (cleanedFromRef.current) return;
    const raw = searchParams.get("from");
    if (!raw) return;

    cleanedFromRef.current = true;
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("from");
        return sp;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  const isValidCredentials = useMemo(() => {
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) return false;
    if (password.length < 6) return false;
    if (tab === "signup" && !fullName.trim()) return false;
    return true;
  }, [tab, email, password, fullName]);

  const isValidOtp = useMemo(() => {
    return otpCode.length === 6 && /^\d{6}$/.test(otpCode) && Boolean(tempToken);
  }, [otpCode, tempToken]);

  const resetStatus = () => {
    setStatus("idle");
    setError("");
  };

  const resetOtpStep = () => {
    setStep("credentials");
    setTempToken("");
    setOtpCode("");
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    safeTrack("auth_submit", { page: "login", mode: tab, step: "credentials" });

    if (!isValidCredentials) {
      setStatus("error");
      setError("Please provide valid credentials. Password must be 6+ characters.");
      return;
    }

    // Keep your restriction
    if (tab === "signup") {
      setStatus("error");
      setError("Sign up is restricted. Please use Sign In.");
      return;
    }

    try {
      setStatus("loading");
      const cleanEmail = email.trim();

      const otpStart = await login({
        username: cleanEmail,
        password,
        turnstileToken: turnstileToken || "bypass-for-testing",
      });

      setTempToken(otpStart.temp_token);
      setStep("otp");
      setStatus("idle");
      setError("");
    } catch (err) {
      console.error("Login error:", err);
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    safeTrack("auth_submit", { page: "login", mode: tab, step: "otp" });

    if (!isValidOtp) {
      setStatus("error");
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      setStatus("loading");

      const tokenResponse = await verifyOtp(tempToken, otpCode);

      const accessToken = tokenResponse.access_token;

      // Keep these for compatibility (authStore will also sync them)
      localStorage.setItem("token", accessToken);
      localStorage.setItem("access_token", accessToken);

      setToken(accessToken);

      try {
        const me = await getMe();
        setUser(me ?? null);
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }

      setStatus("success");

      setTimeout(() => {
        navigate(nextPath, { replace: true });
      }, 500);
    } catch (err) {
      console.error("OTP verify error:", err);
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  const continueToApp = () => navigate(nextPath, { replace: true });

  const onGoogleClick = () => {
    setStatus("error");
    setError("Google login is currently disabled for security.");
  };

  const onGithubClick = () => {
    setStatus("error");
    setError("GitHub login is currently disabled for security.");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-100 flex items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-[#1F2937]/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-gray-800 shadow-xl">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/40">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">DataGuard AI</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">ENTERPRISE SECURITY</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1F2937] border border-gray-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />

          <div className="flex bg-[#111827] rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                resetStatus();
                resetOtpStep();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                tab === "login"
                  ? "bg-[#374151] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#374151]/50"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("signup");
                resetStatus();
                resetOtpStep();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                tab === "signup"
                  ? "bg-[#374151] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#374151]/50"
              }`}
            >
              Sign Up
            </button>
          </div>

          {status === "success" ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-400 mb-8">Secure connection established.</p>

              <button
                type="button"
                onClick={continueToApp}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-8 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {status === "error" && error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* STEP: Credentials */}
              {step === "credentials" && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  {tab === "signup" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <div className="relative group">
                        <UserPlus className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-12 pr-4 py-3.5 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-12 py-3.5 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center py-2">
                    <Turnstile
                      siteKey="1x00000000000000000000AA"
                      onSuccess={(t) => setTurnstileToken(t)}
                      onExpire={() => setTurnstileToken("")}
                      onError={() => setTurnstileToken("")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-bold text-base shadow-lg shadow-purple-900/20 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        {tab === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP: OTP */}
              {step === "otp" && (
                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200">
                      We sent a 6-digit verification code to your phone. Enter it to continue.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      OTP Code (6 digits)
                    </label>
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(normalizeOtpInput(e.target.value))}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.35em] px-4 py-4 bg-[#111827] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-bold text-base shadow-lg shadow-purple-900/20 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetStatus();
                      resetOtpStep();
                    }}
                    className="w-full bg-[#111827] hover:bg-gray-800 text-gray-300 py-3 px-4 rounded-xl border border-gray-700 transition-all"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}

              {/* Social buttons (keep as you had) */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#1F2937] px-4 text-xs uppercase text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <button
                  type="button"
                  onClick={onGithubClick}
                  className="flex items-center justify-center gap-3 bg-[#111827] hover:bg-gray-800 text-gray-300 py-3 px-4 rounded-xl border border-gray-700 transition-all"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">GitHub</span>
                </button>

                <button
                  type="button"
                  onClick={onGoogleClick}
                  className="flex items-center justify-center gap-3 bg-[#111827] hover:bg-gray-800 text-gray-300 py-3 px-4 rounded-xl border border-gray-700 transition-all"
                >
                  <span className="text-sm font-medium">Google</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>CNDP 09-08 • GDPR aligned</span>
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            © 2026 DataGuard AI. Protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
