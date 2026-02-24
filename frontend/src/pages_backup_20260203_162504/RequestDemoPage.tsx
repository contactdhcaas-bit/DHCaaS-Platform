// src/pages/RequestDemoPage.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { trackEvent } from "../lib/analytics";

type FormState = {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeTrack = (name: string, props?: Record<string, unknown>) => {
  try {
    trackEvent(name, props);
  } catch {
    // Never block UI because of analytics
  }
};

const RequestDemoPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string>("");

  const isValid = useMemo(() => {
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const company = form.company.trim();

    if (!fullName) return false;
    if (!EMAIL_RE.test(email)) return false;
    if (!company) return false;

    return true;
  }, [form]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === "submitting") return;

    setError("");

    const baseParams = {
      page: "request_demo",
      placement: "request_demo_page",
      form_id: "request_demo_v1",
      form_name: "request_demo",
    };

    if (!isValid) {
      setError("Please fill in name, company, and a valid email.");
      safeTrack("demo_form_error", baseParams);
      return;
    }

    setStatus("submitting");

    // TODO: replace with real API call later (POST /leads)
    safeTrack("generate_lead", {
      ...baseParams,
      cta: "request_demo_submit",
      lead_source: "website",
    });

    safeTrack("demo_form_submit", {
      ...baseParams,
      cta: "request_demo_submit",
    });

    setStatus("success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* Brand -> public landing */}
          <button
            type="button"
            onClick={() => {
              safeTrack("navigation_click", {
                page: "request_demo",
                to: "landing",
                placement: "header_logo",
              });
              navigate("/landing");
            }}
            className="flex items-center gap-3"
            aria-label="Go to landing"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-slate-900">DHCaaS</div>
              <div className="text-xs text-slate-500">Request a demo</div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              onClick={() =>
                safeTrack("navigation_click", {
                  page: "request_demo",
                  to: "pricing",
                  placement: "header_link",
                })
              }
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold"
            >
              Back to pricing
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Request a demo
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Share a few details and receive a guided walkthrough of compliance scanning, incidents, and reporting.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-lg font-black text-slate-900">What you get</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                "A tailored demo for your industry and data sources",
                "Security & governance overview (audit trails, roles, retention)",
                "CNDP 09-08 & GDPR workflow mapping",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7">
          {status !== "success" ? (
            <>
              <h2 className="text-xl font-black text-slate-900">Tell us about your team</h2>
              <p className="mt-2 text-sm text-slate-600">Fields marked with * are required.</p>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="fullName">
                    Full name *
                  </label>
                  <input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="workEmail">
                    Work email *
                  </label>
                  <input
                    id="workEmail"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="name@company.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="company">
                    Company *
                  </label>
                  <input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Your organization"
                    autoComplete="organization"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="phone">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="+212 ..."
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="message">
                    Message (optional)
                  </label>
                  <textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200 min-h-[110px]"
                    placeholder="Tell us what you want to scan (databases, files, cloud storage...)"
                  />
                </div>

                {error ? <div className="text-sm text-red-600 font-semibold">{error}</div> : null}

                <button
                  type="submit"
                  disabled={!isValid || status === "submitting"}
                  className={[
                    "w-full px-6 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition-all",
                    !isValid || status === "submitting"
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow hover:shadow-lg",
                  ].join(" ")}
                >
                  {status === "submitting" ? "Submitting..." : "Request demo"}
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-500">
                  By submitting, you agree to be contacted about DHCaaS.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-700" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900">Request received</h2>
              <p className="mt-2 text-sm text-slate-600">Thanks — the team will contact you shortly.</p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    safeTrack("navigation_click", {
                      page: "request_demo",
                      to: "pricing",
                      placement: "success",
                    });
                    navigate("/pricing");
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800"
                >
                  Back to pricing
                </button>

                <button
                  type="button"
                  onClick={() => {
                    safeTrack("start_free_scan_click", {
                      page: "request_demo",
                      placement: "success",
                    });
                    navigate("/upload");
                  }}
                  className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black hover:bg-slate-50"
                >
                  Start free scan
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} DHCaaS. CNDP 09-08 & GDPR aligned.
        </div>
      </footer>
    </div>
  );
};

export default RequestDemoPage;
