// src/pages/PricingPage.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Lock,
  Zap,
  BarChart3,
  XCircle,
} from "lucide-react";
import { trackEvent } from "../lib/analytics";

type Plan = {
  id: string;
  name: string;
  badge?: string;
  priceLabel: string;
  subtitle: string;
  cta: string;
  ctaTo: string;
  highlights: string[];
};

type Row = {
  label: string;
  starter: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
};

const safeTrack = (name: string, props?: Record<string, unknown>) => {
  try {
    trackEvent(name, props);
  } catch {
    // ignore analytics errors in UI
  }
};

const cell = (v: string | boolean) => {
  if (v === true) return <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Yes</span>;
  if (v === false) return <span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-slate-400" />No</span>;
  return <span>{v}</span>;
};

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const plans: Plan[] = useMemo(
    () => [
      {
        id: "starter",
        name: "Starter",
        priceLabel: "$0",
        subtitle: "For testing the workflow and producing sample reports.",
        cta: "Start free scan",
        ctaTo: "/upload",
        highlights: [
          "Upload CSV/Excel and generate sample reports",
          "Basic PII discovery (email, phone, ID patterns)",
          "Export PDF/CSV report",
        ],
      },
      {
        id: "business",
        name: "Business",
        badge: "Best value",
        priceLabel: billing === "annual" ? "$47 / mo" : "$57 / mo",
        subtitle: "For teams running continuous scans and governance workflows.",
        cta: "Request a demo",
        ctaTo: "/request-demo",
        highlights: [
          "Team access control and audit trails",
          "Incidents workflow and remediation tracking",
          "Dashboards and compliance scoring",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        priceLabel: "Custom (from $97 / mo)",
        subtitle: "For banks and regulated organizations with SLAs and advanced security.",
        cta: "Request a demo",
        ctaTo: "/request-demo",
        highlights: [
          "SLA, SSO, and advanced governance",
          "Private deployments and custom retention policies",
          "Dedicated onboarding and support",
        ],
      },
    ],
    [billing]
  );

  const comparison: Row[] = useMemo(
    () => [
      { label: "File scanning", starter: true, business: true, enterprise: true },
      { label: "PDF/CSV reporting", starter: true, business: true, enterprise: true },
      { label: "Compliance scoring", starter: "Basic", business: "Advanced", enterprise: "Advanced + Custom rules" },
      { label: "Incidents workflow", starter: false, business: true, enterprise: true },
      { label: "Team roles & permissions", starter: false, business: true, enterprise: true },
      { label: "Audit trails", starter: false, business: true, enterprise: true },
      { label: "SSO (SAML/OIDC)", starter: false, business: false, enterprise: true },
      { label: "SLA & priority support", starter: false, business: "Optional", enterprise: "Included" },
      { label: "Data residency / private deployment", starter: false, business: "Optional", enterprise: "Included" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* IMPORTANT: go to /landing (public), not / */}
          <button
            type="button"
            onClick={() => {
              safeTrack("navigation_click", { page: "pricing", to: "landing", placement: "header_logo" });
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
              <div className="text-xs text-slate-500">Enterprise-ready compliance scanning</div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Link
              to="/request-demo"
              onClick={() => safeTrack("request_demo_click", { page: "pricing", placement: "header_link" })}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold"
            >
              Request demo
            </Link>

            <button
              type="button"
              onClick={() => {
                safeTrack("login_click", { page: "pricing", placement: "header" });
                navigate("/login");
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                safeTrack("start_free_scan_click", { page: "pricing", placement: "header" });
                navigate("/upload");
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              Start free scan
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Pricing built for regulated teams
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Start with a pilot, scale into governance workflows, and upgrade to enterprise controls when needed.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => {
                safeTrack("billing_toggle", { page: "pricing", billing: "monthly" });
                setBilling("monthly");
              }}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                billing === "monthly" ? "bg-slate-900 text-white" : "text-slate-700 hover:text-slate-900",
              ].join(" ")}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => {
                safeTrack("billing_toggle", { page: "pricing", billing: "annual" });
                setBilling("annual");
              }}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                billing === "annual" ? "bg-slate-900 text-white" : "text-slate-700 hover:text-slate-900",
              ].join(" ")}
            >
              Annual (save)
            </button>
          </div>
        </div>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={[
                "rounded-3xl border p-7 bg-white shadow-sm hover:shadow-xl transition-all",
                p.badge ? "border-emerald-200 ring-2 ring-emerald-200" : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-xl font-black text-slate-900">{p.name}</div>
                {p.badge ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {p.badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 text-3xl font-black text-slate-900">{p.priceLabel}</div>
              <div className="mt-2 text-sm text-slate-600">{p.subtitle}</div>

              <button
                type="button"
                onClick={() => {
                  safeTrack(p.ctaTo === "/upload" ? "start_free_scan_click" : "request_demo_click", {
                    page: "pricing",
                    plan: p.id,
                    billing,
                    placement: "plan_card",
                  });
                  navigate(p.ctaTo);
                }}
                className={[
                  "mt-6 w-full px-5 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2 transition-all",
                  p.badge
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow hover:shadow-lg"
                    : "bg-slate-900 text-white hover:bg-slate-800",
                ].join(" ")}
              >
                {p.cta}
                <ArrowRight className="w-5 h-5" />
              </button>

              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-3xl border border-slate-200 bg-white p-8">
          <div className="flex items-start justify-between flex-col md:flex-row gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black text-slate-900">Compare plans</h2>
              <p className="mt-2 text-sm text-slate-600">
                Match governance and security requirements to choose the right plan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                safeTrack("start_free_scan_click", { page: "pricing", placement: "compare_section" });
                navigate("/upload");
              }}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 inline-flex items-center gap-2"
            >
              Run a free scan
              <Zap className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-3 pr-4 text-slate-500 font-semibold">Feature</th>
                  <th className="py-3 pr-4 text-slate-900 font-black">Starter</th>
                  <th className="py-3 pr-4 text-slate-900 font-black">Business</th>
                  <th className="py-3 text-slate-900 font-black">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparison.map((r) => (
                  <tr key={r.label}>
                    <td className="py-3 pr-4 text-slate-700 font-semibold">{r.label}</td>
                    <td className="py-3 pr-4 text-slate-700">{cell(r.starter)}</td>
                    <td className="py-3 pr-4 text-slate-700">{cell(r.business)}</td>
                    <td className="py-3 text-slate-700">{cell(r.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Security</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Built for compliance programs with auditability and enterprise governance controls.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Collaboration</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Assign owners, track incidents, and standardize remediation across teams.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Reporting</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Generate audit-ready PDF/CSV reports with evidence and clear remediation steps.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-slate-900 text-white p-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Want a bank-grade deployment and CNDP-ready governance?
            </h2>
            <p className="mt-3 text-white/80">
              Request a demo to review security, data retention, audit evidence, and onboarding.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  safeTrack("request_demo_click", { page: "pricing", placement: "final_cta" });
                  navigate("/request-demo");
                }}
                className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black inline-flex items-center justify-center gap-2"
              >
                Request a demo
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  safeTrack("start_free_scan_click", { page: "pricing", placement: "final_cta" });
                  navigate("/upload");
                }}
                className="px-6 py-3 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 inline-flex items-center justify-center gap-2"
              >
                Start free scan
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </div>
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

export default PricingPage;
