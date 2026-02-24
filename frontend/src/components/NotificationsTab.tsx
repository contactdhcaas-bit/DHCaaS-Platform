import React, { useState } from "react";
import {
  Shield,
  Smartphone,
  Lock,
  Unlock,
  Trash2,
  CheckCircle,
  Copy,
  Download,
  X,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

type TrustedDevice = {
  id: string;
  name: string;
  lastUsed: string;
  browser: string;
};

const SecurityTab: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([
    {
      id: "dev_1",
      name: "Windows PC",
      lastUsed: "2 hours ago",
      browser: "Chrome 120",
    },
    {
      id: "dev_2",
      name: "iPhone 15 Pro",
      lastUsed: "Yesterday",
      browser: "Safari iOS",
    },
  ]);

  const handleEnable2FA = () => {
    setShow2FASetupModal(true);
    setSetupStep(1);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const codes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase()
    ).map(
      (code, i) =>
        `${i + 1}. ${code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    );

    setRecoveryCodes(codes);
    setSetupStep(3);
    setIsVerifying(false);
    toast.success("Code verified successfully!");
  };

  const handleComplete2FASetup = () => {
    setTwoFactorEnabled(true);
    setShow2FASetupModal(false);
    setSetupStep(1);
    setVerificationCode("");
    toast.success("Two-Factor Authentication enabled!");
  };

  const handleDisable2FA = () => {
    if (
      window.confirm("Are you sure you want to disable Two-Factor Authentication?")
    ) {
      setTwoFactorEnabled(false);
      toast.success("Two-Factor Authentication disabled");
    }
  };

  const handleRevokeDevice = (deviceId: string) => {
    if (
      window.confirm("Are you sure you want to revoke access for this device?")
    ) {
      setTrustedDevices(trustedDevices.filter((d) => d.id !== deviceId));
      toast.success("Device access revoked");
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast.success("Recovery codes copied to clipboard!");
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dhcaas-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-500" />
            Security Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage authentication and account security
          </p>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Smartphone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-sm text-slate-600">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          {twoFactorEnabled ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Enabled
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Disabled
            </span>
          )}
        </div>

        {!twoFactorEnabled ? (
          <button
            type="button"
            onClick={handleEnable2FA}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Enable 2FA
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisable2FA}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            Disable 2FA
          </button>
        )}
      </div>

      {/* Trusted Devices */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Monitor className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Trusted Devices</h3>
            <p className="text-sm text-slate-600">
              Devices where you're currently logged in
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {trustedDevices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-slate-600" />
                <div>
                  <h4 className="font-semibold text-slate-900">{device.name}</h4>
                  <p className="text-xs text-slate-500">
                    {device.browser} • Last used {device.lastUsed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevokeDevice(device.id)}
                className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900 mb-1">Security Best Practices</h4>
          <p className="text-sm text-amber-700">
            Enable 2FA to protect your account. Review trusted devices regularly and revoke
            access from devices you no longer use.
          </p>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {setupStep === 1 && "Setup Two-Factor Authentication"}
                {setupStep === 2 && "Verify Your Code"}
                {setupStep === 3 && "Save Recovery Codes"}
              </h3>
              <button
                type="button"
                onClick={() => setShow2FASetupModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Step 1: QR Code */}
            {setupStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center">
                  <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center">
                    <p className="text-sm text-slate-400">[QR Code Placeholder]</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Verify Code */}
            {setupStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit code from your authenticator app
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            )}

            {/* Step 3: Recovery Codes */}
            {setupStep === 3 && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-medium">
                    Save these recovery codes in a safe place. You'll need them to access your account if you lose your device.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-1 font-mono text-sm">
                    {recoveryCodes.map((code, idx) => (
                      <div key={idx} className="text-slate-700">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyRecoveryCodes}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={downloadRecoveryCodes}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleComplete2FASetup}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Complete Setup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;
