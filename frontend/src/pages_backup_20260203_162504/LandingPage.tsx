// src/pages/LandingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Lock,
  Zap,
  BarChart3,
  Globe,
  FileText,
  Users,
  Clock,
  Activity,
  AlertTriangle,
  Database,
  Download,
  Search,
  Menu,
  X,
  ChevronDown,
  Brain,
  TrendingUp,
  Building2,
  HeartPulse,
  Radio,
  Landmark,
  ShoppingCart,
  Factory,
  Facebook,
  Linkedin,
  Youtube,
  Instagram,
  Twitter,
  ExternalLink,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Plus,
  Minus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";

// Import assets
import logoImage from "../assets/logo.jpg";
import dataImage from "../assets/data.jpg";
import sourceImage from "../assets/source.jpg";

// ============================================================================
// ROUTE_MAP - Single Source of Truth
// ============================================================================

const ROUTE_MAP = {
  platform: [
    { key: "platform_home", label: "Platform", href: "/platform" },
    { key: "platform_ai", label: "DHC AI", href: "/platform/ai" },
    { key: "platform_security", label: "Security", href: "/platform/security" },
    { key: "platform_integrations", label: "Integrations", href: "/platform/integrations" },
  ],
  products: [
    { key: "products_home", label: "Products", href: "/products" },
    { key: "cloud_platform", label: "Cloud Platform", href: "/products/cloud-platform" },
    { key: "idmc", label: "Intelligent Data Management Cloud", href: "/products/idmc" },
    { key: "dhc_ai", label: "DHC AI", href: "/products/dhc-ai" },
    { key: "data_catalog", label: "Data Catalog", href: "/products/data-catalog" },
    { key: "data_integration", label: "Data Integration & Engineering", href: "/products/data-integration" },
    { key: "api_app_integration", label: "API & App Integration", href: "/products/api-app-integration" },
    { key: "data_quality", label: "Data Quality & Observability", href: "/products/data-quality" },
    { key: "mdm_360", label: "MDM & 360 Applications", href: "/products/mdm-360" },
    { key: "data_governance", label: "Data Governance, Access & Privacy", href: "/products/data-governance" },
    { key: "data_marketplace", label: "Data Marketplace", href: "/products/data-marketplace" },
  ],
  resources: [
    { key: "resources_home", label: "Resources", href: "/resources" },
    { key: "get_started", label: "Get Started", href: "/get-started" },
    { key: "demo_center", label: "Demo Center", href: "/demo-center" },
    { key: "free_data_integration", label: "Free Cloud Data Integration", href: "/free-data-integration" },
    { key: "request_demo", label: "Request Personal Demo", href: "/request-demo" },
    { key: "contact_sales", label: "Contact Sales", href: "/contact-sales" },
    { key: "pricing", label: "Pricing", href: "/pricing" },
    { key: "blog", label: "Blog", href: "/resources/blog" },
    { key: "events", label: "Events", href: "/resources/events" },
    { key: "community", label: "Community", href: "/resources/community" },
    { key: "docs", label: "Documentation", href: "/resources/docs" },
    { key: "university", label: "DHCaaS University", href: "/resources/university" },
    { key: "glossary", label: "Cloud Data Glossary", href: "/resources/glossary" },
    { key: "learn_etl", label: "Learn: ETL", href: "/resources/learn/etl" },
    { key: "learn_cloud_di", label: "Learn: Cloud Data Integration", href: "/resources/learn/cloud-data-integration" },
    { key: "learn_ipaas", label: "Learn: What is iPaaS?", href: "/resources/learn/ipaas" },
    { key: "learn_dwh", label: "Learn: Data Warehouse", href: "/resources/learn/data-warehouse" },
    { key: "learn_gov_fw", label: "Learn: Data Governance Framework", href: "/resources/learn/data-governance-framework" },
    { key: "learn_dq", label: "Learn: What is Data Quality?", href: "/resources/learn/data-quality" },
    { key: "learn_customer_360", label: "Learn: Customer 360", href: "/resources/learn/customer-360" },
    { key: "learn_app_integration", label: "Learn: Application Integration", href: "/resources/learn/application-integration" },
  ],
  company: [
    { key: "about", label: "About", href: "/company/about" },
    { key: "leadership", label: "Leadership", href: "/company/leadership" },
    { key: "news", label: "News", href: "/company/news" },
    { key: "careers", label: "Careers", href: "/company/careers" },
    { key: "privacy", label: "Privacy Policy", href: "/company/privacy" },
    { key: "terms", label: "Terms of Service", href: "/company/terms" },
    { key: "dpa", label: "Data Processing Agreement", href: "/company/dpa" },
    { key: "cookie", label: "Cookie Policy", href: "/company/cookie-policy" },
    { key: "security", label: "Security", href: "/company/security" },
    { key: "contact", label: "Contact", href: "/company/contact" },
  ],
  social: [
    { key: "facebook", label: "Facebook", href: "https://facebook.com/", icon: Facebook },
    { key: "linkedin", label: "LinkedIn", href: "https://linkedin.com/", icon: Linkedin },
    { key: "youtube", label: "YouTube", href: "https://youtube.com/", icon: Youtube },
    { key: "instagram", label: "Instagram", href: "https://instagram.com/", icon: Instagram },
    { key: "x", label: "X", href: "https://x.com/", icon: Twitter },
  ],
  languages: [
    { key: "en", label: "English", href: "/?lang=en", flag: "🇺🇸" },
    { key: "fr", label: "Français", href: "/?lang=fr", flag: "🇫🇷" },
    { key: "es", label: "Español", href: "/?lang=es", flag: "🇪🇸" },
    { key: "de", label: "Deutsch", href: "/?lang=de", flag: "🇩🇪" },
    { key: "it", label: "Italiano", href: "/?lang=it", flag: "🇮🇹" },
    { key: "pt", label: "Português", href: "/?lang=pt", flag: "🇧🇷" },
    { key: "ja", label: "日本語", href: "/?lang=ja", flag: "🇯🇵" },
  ],
} as const;

// ============================================================================
// Types
// ============================================================================

type Stat = { value: string; label: string; icon: LucideIcon };
type Feature = { title: string; description: string; icon: LucideIcon };
type Pillar = { title: string; description: string; icon: LucideIcon };
type UseCase = { industry: string; icon: LucideIcon; description: string };
type Step = { number: string; title: string; description: string; icon: LucideIcon };
type FAQ = { question: string; answer: string };

// ============================================================================
// Main Component
// ============================================================================

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [activeFeature, setActiveFeature] = useState(0);
  const [activePersona, setActivePersona] = useState<"security" | "compliance">("security");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Auth
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = Boolean(token);

  // ============================================================================
  // Data
  // ============================================================================

  const stats: Stat[] = useMemo(
    () => [
      { value: "1.2M+", label: "Files scanned", icon: FileCheck },
      { value: "94%", label: "Avg compliance score", icon: CheckCircle2 },
      { value: "47+", label: "Enterprise teams", icon: Users },
      { value: "99.9%", label: "Uptime SLA", icon: Activity },
    ],
    []
  );

  const securityFeatures = useMemo(
    () => [
      "Detect exposed PII (CNIE, emails, phone) in seconds",
      "Real-time incident alerts with severity scoring",
      "Audit-ready evidence for security reviews",
    ],
    []
  );

  const complianceFeatures = useMemo(
    () => [
      "CNDP 09-08 & GDPR-aligned reporting",
      "Exportable PDF/CSV reports with compliance scores",
      "Policy enforcement with trackable remediation",
    ],
    []
  );

  const rotatingFeatures: Feature[] = useMemo(
    () => [
      {
        title: "Automated PII Discovery",
        description: "Scan CSV/Excel files to detect CNIE, phone numbers, emails, and sensitive columns instantly.",
        icon: Search,
      },
      {
        title: "Compliance-Ready Reports",
        description: "Generate audit-grade PDF/CSV reports aligned with CNDP 09-08 and GDPR requirements.",
        icon: FileText,
      },
      {
        title: "AI-Powered Insights",
        description: "Get intelligent recommendations for remediation and risk reduction with DHC AI.",
        icon: Sparkles,
      },
    ],
    []
  );

  const platformPillars: Pillar[] = useMemo(
    () => [
      {
        title: "Discover",
        description: "Identify PII exposure, risky datasets, and compliance gaps across all uploaded files.",
        icon: Search,
      },
      {
        title: "Govern",
        description: "Assign incident owners, apply policies, track audit trails, and maintain evidence.",
        icon: Lock,
      },
      {
        title: "Report",
        description: "Export compliance-ready PDF/CSV reports with scores, violations, and remediation steps.",
        icon: BarChart3,
      },
      {
        title: "Scale",
        description: "Enterprise-grade architecture with team access control and high-volume scanning.",
        icon: Globe,
      },
    ],
    []
  );

  const howItWorksSteps: Step[] = useMemo(
    () => [
      {
        number: "01",
        title: "Upload or Connect",
        description: "Upload CSV/Excel files or connect to MongoDB data sources",
        icon: Database,
      },
      {
        number: "02",
        title: "Run Compliance Scan",
        description: "Automated PII detection with CNDP 09-08 rule engine",
        icon: Zap,
      },
      {
        number: "03",
        title: "Review Incidents",
        description: "Priority-ranked incidents with severity and remediation guidance",
        icon: AlertTriangle,
      },
      {
        number: "04",
        title: "Export Reports",
        description: "Download audit-ready PDF/CSV reports with compliance scores",
        icon: Download,
      },
    ],
    []
  );

  const useCases: UseCase[] = useMemo(
    () => [
      {
        industry: "Financial Services",
        icon: Building2,
        description: "Protect customer data and maintain regulatory compliance across banking operations",
      },
      {
        industry: "Healthcare & Life Sciences",
        icon: HeartPulse,
        description: "Secure patient records and ensure HIPAA/GDPR compliance in medical data systems",
      },
      {
        industry: "Telecom",
        icon: Radio,
        description: "Monitor subscriber data exposure and maintain telecom data protection standards",
      },
      {
        industry: "Government & Public Sector",
        icon: Landmark,
        description: "Standardize compliance reporting across agencies and protect citizen data",
      },
      {
        industry: "Retail & E-commerce",
        icon: ShoppingCart,
        description: "Secure customer purchase history and payment data in e-commerce platforms",
      },
      {
        industry: "Manufacturing",
        icon: Factory,
        description: "Protect supply chain data and ensure compliance in IoT and operational datasets",
      },
    ],
    []
  );

  const faqs: FAQ[] = useMemo(
    () => [
      {
        question: "How does DHCaaS differ from traditional DLP solutions?",
        answer: "DHCaaS focuses on compliance-ready scanning with audit-grade evidence generation, specifically designed for CSV/Excel data exports. Unlike traditional DLP that monitors network traffic, we provide on-demand file scanning with detailed compliance reports aligned to CNDP 09-08 and GDPR frameworks.",
      },
      {
        question: "What compliance frameworks does DHCaaS support?",
        answer: "We support CNDP 09-08 (Morocco), GDPR (EU), HIPAA (US healthcare), POPIA (South Africa), and custom compliance policies. Our rule engine is configurable to match your organization's specific data protection requirements.",
      },
      {
        question: "Can DHCaaS integrate with our existing data infrastructure?",
        answer: "Yes. DHCaaS offers direct MongoDB integration, REST API access, and CSV/Excel upload capabilities. We're adding support for MySQL, PostgreSQL, S3, and Azure Blob Storage in Q2 2026.",
      },
      {
        question: "How long does it take to deploy DHCaaS?",
        answer: "Cloud deployment takes less than 1 hour for initial setup. Enterprise customers typically complete full onboarding (including team training and custom rule configuration) within 1-2 weeks.",
      },
      {
        question: "What is the pricing model?",
        answer: "We offer usage-based pricing starting with a free tier (up to 100 scans/month). Enterprise plans include unlimited scans, dedicated support, custom SLAs, and on-premise deployment options. Visit our pricing page for detailed tiers.",
      },
      {
        question: "Do you offer on-premise deployment?",
        answer: "Yes. Enterprise customers can deploy DHCaaS on-premise or in their private cloud (AWS VPC, Azure VNet, GCP VPC). Contact our sales team for deployment architecture options.",
      },
      {
        question: "How does DHC AI improve over time?",
        answer: "DHC AI learns from your incident classifications and remediation patterns to improve PII detection accuracy and reduce false positives. The model is retrained monthly with anonymized patterns (never your actual data).",
      },
      {
        question: "What support and SLAs do you provide?",
        answer: "Free tier includes email support (48h response). Paid plans include priority email + chat support. Enterprise plans offer 24/7 support, dedicated CSM, 99.9% uptime SLA, and incident response guarantees.",
      },
      {
        question: "Is DHCaaS GDPR and CNDP 09-08 compliant?",
        answer: "Yes. DHCaaS is built compliance-first. We are GDPR-compliant (EU data residency available), CNDP 09-08 aligned, and undergo annual SOC 2 Type II audits. All scan data is encrypted at rest and in transit.",
      },
      {
        question: "Can we customize the compliance rules engine?",
        answer: "Enterprise customers can define custom PII patterns, adjust severity thresholds, and create organization-specific compliance policies. Our solution architects assist with rule customization during onboarding.",
      },
    ],
    []
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (rotatingFeatures.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % rotatingFeatures.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [rotatingFeatures.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/upload");
    } else {
      navigate("/login", { state: { from: "/upload" } });
    }
  };

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleKeyDown = (name: string, e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpenDropdown(null);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenDropdown(openDropdown === name ? null : name);
    }
  };

  const current = rotatingFeatures[activeFeature] ?? rotatingFeatures[0];
  const CurrentIcon = current?.icon ?? FileText;
  const activePersonaFeatures = activePersona === "security" ? securityFeatures : complianceFeatures;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      
      {/* ====================================================================== */}
      {/* NAVBAR */}
      {/* ====================================================================== */}
      
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3" aria-label="DHCaaS Home">
              <img src={logoImage} alt="DHCaaS Logo" className="w-10 h-10 rounded-xl shadow-lg" />
              <div className="text-left hidden sm:block">
                <div className="text-xl font-bold text-slate-900">DHCaaS</div>
                <div className="text-xs text-slate-500">Data Health Check as a Service</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              
              {/* Platform Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => toggleDropdown("platform", e)}
                  onKeyDown={(e) => handleKeyDown("platform", e)}
                  aria-expanded={openDropdown === "platform"}
                  aria-controls="platform-menu"
                  className="flex items-center gap-1 px-3 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                >
                  Platform
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === "platform" && (
                  <div
                    id="platform-menu"
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2"
                  >
                    {ROUTE_MAP.platform.map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        role="menuitem"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Products Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => toggleDropdown("products", e)}
                  onKeyDown={(e) => handleKeyDown("products", e)}
                  aria-expanded={openDropdown === "products"}
                  aria-controls="products-menu"
                  className="flex items-center gap-1 px-3 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                >
                  Products
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === "products" && (
                  <div
                    id="products-menu"
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2"
                  >
                    {ROUTE_MAP.products.map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        role="menuitem"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => toggleDropdown("resources", e)}
                  onKeyDown={(e) => handleKeyDown("resources", e)}
                  aria-expanded={openDropdown === "resources"}
                  aria-controls="resources-menu"
                  className="flex items-center gap-1 px-3 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                >
                  Resources
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === "resources" && (
                  <div
                    id="resources-menu"
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2"
                  >
                    {ROUTE_MAP.resources.slice(0, 10).map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        role="menuitem"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <Link
                to="/pricing"
                className="px-3 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
              >
                Pricing
              </Link>

              {/* Company Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => toggleDropdown("company", e)}
                  onKeyDown={(e) => handleKeyDown("company", e)}
                  aria-expanded={openDropdown === "company"}
                  aria-controls="company-menu"
                  className="flex items-center gap-1 px-3 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                >
                  Company
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === "company" && (
                  <div
                    id="company-menu"
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2"
                  >
                    {ROUTE_MAP.company.map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        role="menuitem"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:block px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Open Console
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="hidden md:block px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Get Started
                  </button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden p-2 text-slate-700 hover:text-slate-900"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-slate-200 pt-4">
              <div className="space-y-2">
                <Link
                  to="/platform"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  Platform
                </Link>
                <Link
                  to="/products"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  Products
                </Link>
                <Link
                  to="/resources"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  Resources
                </Link>
                <Link
                  to="/pricing"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  Pricing
                </Link>
                <Link
                  to="/company/about"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  Company
                </Link>
                <div className="pt-4 space-y-2">
                  {!isAuthenticated && (
                    <Link
                      to="/login"
                      className="block px-4 py-2.5 text-center bg-slate-100 rounded-xl text-slate-900 font-semibold"
                    >
                      Login
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="block w-full px-4 py-2.5 text-center bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl font-semibold"
                  >
                    {isAuthenticated ? "Open Console" : "Get Started"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ====================================================================== */}
      {/* HERO SECTION */}
      {/* ====================================================================== */}

      <header className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="lg:pr-10">
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered • CNDP 09-08 Ready
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Compliance-ready data scanning with audit-grade evidence
            </h1>

            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              Scan CSV/Excel files to detect CNIE/PII exposure, generate compliance reports,
              create incidents, and improve your security posture—all in one platform.
            </p>

            {/* Persona Toggle */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setActivePersona("security")}
                className={[
                  "px-4 py-2 rounded-xl font-semibold transition-all",
                  activePersona === "security"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => setActivePersona("compliance")}
                className={[
                  "px-4 py-2 rounded-xl font-semibold transition-all",
                  activePersona === "compliance"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                Compliance
              </button>
            </div>

            {/* Dynamic persona features */}
            <ul className="space-y-3 mb-8">
              {activePersonaFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-3"
              >
                {isAuthenticated ? "Start Free Scan" : "Get Started"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/request-demo")}
                className="py-4 px-8 rounded-2xl text-lg font-semibold border-2 border-slate-200 bg-white hover:bg-slate-50 hover:shadow-lg transition-all text-slate-900 inline-flex items-center justify-center gap-3"
              >
                Request Demo
                <Clock className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                Free tier available
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                Enterprise-ready
              </span>
            </div>
          </div>

          {/* Feature card */}
          <div className="relative">
            <div className="bg-gradient-to-br from-sky-400/15 to-purple-400/15 backdrop-blur-xl border border-sky-200/60 rounded-3xl p-8 lg:p-10 shadow-2xl">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/90 rounded-2xl p-5 text-center border border-slate-200 shadow-lg">
                  <div className="text-3xl font-bold text-sky-700 mb-1">94%</div>
                  <div className="text-xs font-semibold text-slate-700">Compliance</div>
                </div>
                <div className="bg-white/90 rounded-2xl p-5 text-center border border-slate-200 shadow-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">1.2M</div>
                  <div className="text-xs font-semibold text-slate-700">Files</div>
                </div>
                <div className="bg-white/90 rounded-2xl p-5 text-center border border-slate-200 shadow-lg">
                  <div className="text-3xl font-bold text-sky-600 mb-1">47+</div>
                  <div className="text-xs font-semibold text-slate-700">Teams</div>
                </div>
              </div>

              <div className="bg-white/85 rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center flex-shrink-0">
                    <CurrentIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-600 mb-1">Powered by DHC AI</div>
                    <div className="text-lg font-bold text-slate-900">{current.title}</div>
                    <div className="text-sm text-slate-600 mt-2">{current.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5">
                  {rotatingFeatures.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveFeature(idx)}
                      className={[
                        "h-2.5 rounded-full transition-all",
                        idx === activeFeature ? "w-10 bg-sky-600" : "w-2.5 bg-slate-300 hover:bg-slate-400",
                      ].join(" ")}
                      aria-label={`Select feature ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Continue in next message due to length... */}
      {/* ====================================================================== */}
      {/* STATS BAR */}
      {/* ====================================================================== */}

      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-shadow"
              >
                <Icon className="w-8 h-8 text-sky-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================== */}
      {/* TRUSTED BY */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Trusted by Leading Organizations
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Enterprises and SMBs across Morocco and MENA rely on DHCaaS for data compliance
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            "Financial Services Co.",
            "Healthcare Provider",
            "Telecom Operator",
            "Government Agency",
            "E-commerce Platform",
            "Manufacturing Corp.",
          ].map((name, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-8 h-8 text-sky-600" />
                </div>
                <div className="text-xs font-semibold text-slate-700">{name}</div>
                <div className="text-xs text-slate-500 mt-1">(Example)</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          * Customer names are illustrative examples. Actual customer references available upon request.
        </p>
      </section>

      {/* ====================================================================== */}
      {/* HOW IT WORKS */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How DHCaaS Works</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From upload to audit-ready report in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorksSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {step.number}
                </div>
                <div className="pt-4">
                  <Icon className="w-10 h-10 text-sky-600 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================== */}
      {/* PLATFORM OVERVIEW */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Complete Data Health Platform
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Four pillars of enterprise data compliance and governance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {platformPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 flex items-center justify-center mb-5 shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                <p className="text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================== */}
      {/* PRODUCTS SHOWCASE */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Products</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Enterprise data management platform with specialized products for every use case
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {ROUTE_MAP.products.slice(1).map((product) => (
            <Link
              key={product.key}
              to={product.href}
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7 text-sky-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
                {product.label}
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Explore All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* DATA INTEGRATION VISUAL */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={dataImage}
              alt="Intelligent Data Integration - Connect and transform data across cloud and on-premise sources"
              className="w-full rounded-3xl shadow-2xl border border-slate-200"
              loading="lazy"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Powered by DHC AI
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Intelligent Data Integration
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Connect, transform, and sync data across cloud and on-premise sources with
              enterprise-grade security. Support for MongoDB, MySQL, PostgreSQL, S3, Azure,
              and 100+ connectors.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Real-time data synchronization with zero downtime</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Automated schema detection and transformation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Compliance-aware data pipelines with audit trails</span>
              </li>
            </ul>
            <Link
              to="/products/data-integration"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Learn More
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* DATA SOURCES VISUAL */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Database className="w-4 h-4" />
              100+ Connectors
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Connect Any Data Source
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              MongoDB, MySQL, PostgreSQL, Oracle, SQL Server, Amazon S3, Azure Blob Storage,
              Google Cloud Storage, Snowflake, and 100+ pre-built connectors for seamless
              data integration.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Unified catalog for all data assets</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Automatic metadata extraction and lineage tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Enterprise security with role-based access control</span>
              </li>
            </ul>
            <Link
              to="/products/data-catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Explore Connectors
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div>
            <img
              src={sourceImage}
              alt="Connect Any Data Source - Unified catalog for MongoDB, MySQL, PostgreSQL, S3, and 100+ data sources"
              className="w-full rounded-3xl shadow-2xl border border-slate-200"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* DHC AI SECTION */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Brain className="w-4 h-4" />
            Powered by Artificial Intelligence
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Powered by DHC AI</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Intelligent automation for data compliance with predictive analytics and smart remediation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Sparkles,
              title: "Smart PII Detection",
              description: "AI-powered pattern recognition for CNIE, emails, phone numbers, and custom PII types with 98%+ accuracy",
            },
            {
              icon: Brain,
              title: "Predictive Risk Scoring",
              description: "Machine learning models assess data exposure risk and predict compliance violations before they occur",
            },
            {
              icon: Zap,
              title: "Auto-Remediation",
              description: "Intelligent workflow automation for incident response, policy enforcement, and data masking",
            },
            {
              icon: TrendingUp,
              title: "Compliance Insights",
              description: "Real-time dashboards with AI-driven recommendations for improving your compliance posture",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/products/dhc-ai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Learn More About DHC AI
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* SECURITY & COMPLIANCE */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Enterprise Security & Compliance
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Bank-grade security with compliance certifications you can trust
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Lock,
              title: "Access Control",
              description: "Role-based permissions (RBAC) with team hierarchies and SSO integration",
            },
            {
              icon: ShieldCheck,
              title: "Audit Trails",
              description: "Immutable audit logs with timestamp verification and compliance evidence export",
            },
            {
              icon: Download,
              title: "Data Export",
              description: "Exportable PDF/CSV reports with digital signatures for regulatory submission",
            },
            {
              icon: FileText,
              title: "CNDP 09-08 Ready",
              description: "Pre-configured templates for Morocco's data protection regulation compliance",
            },
            {
              icon: Globe,
              title: "GDPR Aligned",
              description: "EU data residency options with full GDPR compliance reporting capabilities",
            },
            {
              icon: Activity,
              title: "SOC 2 Type II",
              description: "Annual security audits with third-party attestation reports available",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all"
              >
                <Icon className="w-10 h-10 text-sky-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================== */}
      {/* USE CASES */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Industry Use Cases</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Trusted across industries for data compliance and governance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, idx) => {
            const Icon = useCase.icon;
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 flex items-center justify-center mb-5 shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{useCase.industry}</h3>
                <p className="text-slate-600 leading-relaxed">{useCase.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Continue in next message... */}
      {/* ====================================================================== */}
      {/* RESOURCES HUB */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Resources Hub</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to get started, learn, and grow with DHCaaS
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/get-started"
            className="group bg-gradient-to-br from-sky-600 to-sky-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Zap className="w-10 h-10 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Get Started</h3>
            <p className="text-sky-100 mb-4">
              Quick setup guide to start scanning in minutes
            </p>
            <div className="flex items-center gap-2 font-semibold">
              Start Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/demo-center"
            className="group bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Activity className="w-10 h-10 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Demo Center</h3>
            <p className="text-purple-100 mb-4">
              Interactive product demos and video walkthroughs
            </p>
            <div className="flex items-center gap-2 font-semibold">
              Watch Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/pricing"
            className="group bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <BarChart3 className="w-10 h-10 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Pricing</h3>
            <p className="text-slate-300 mb-4">
              Flexible plans from free tier to enterprise
            </p>
            <div className="flex items-center gap-2 font-semibold">
              View Plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Learn Guides */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Learn</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROUTE_MAP.resources
              .filter((r) => r.key.startsWith("learn_"))
              .map((guide) => (
                <Link
                  key={guide.key}
                  to={guide.href}
                  className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <BookOpen className="w-8 h-8 text-sky-600 mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
                    {guide.label.replace("Learn: ", "")}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
          </div>
        </div>

        {/* Community */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Community</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <Link
              to="/resources/docs"
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <FileText className="w-10 h-10 text-sky-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Documentation
              </h4>
            </Link>

            <Link
              to="/resources/university"
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <GraduationCap className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                DHCaaS University
              </h4>
            </Link>

            <Link
              to="/resources/blog"
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <BookOpen className="w-10 h-10 text-sky-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Blog
              </h4>
            </Link>

            <Link
              to="/resources/community"
              className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <MessageSquare className="w-10 h-10 text-sky-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Community Forum
              </h4>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* ABOUT DHCaaS */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-3xl p-10 lg:p-16 border border-slate-200 shadow-xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">About DHCaaS</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-sky-600 to-purple-600 mx-auto rounded-full" />
            </div>

            <div className="prose prose-lg max-w-none text-slate-700 space-y-6">
              <p className="text-lg leading-relaxed">
                <strong>DHCaaS (Data Health Check as a Service)</strong> was founded by a team
                of Moroccan data engineers and compliance specialists who recognized a critical
                gap in the market: organizations across MENA were struggling to achieve data
                compliance without expensive consulting engagements or complex enterprise
                software deployments.
              </p>

              <p className="text-lg leading-relaxed">
                Our mission is simple yet ambitious: <strong>Make data compliance accessible,
                automated, and audit-ready for every organization</strong>—from startups
                building their first product to Fortune 500 companies managing petabytes of
                customer data.
              </p>

              <p className="text-lg leading-relaxed">
                We built DHCaaS with a compliance-first mindset, aligning with Morocco's{" "}
                <strong>CNDP 09-08</strong> regulation and international standards like{" "}
                <strong>GDPR</strong> and <strong>HIPAA</strong>. Our platform combines
                intelligent PII detection, automated incident management, and audit-grade
                reporting—all powered by <strong>DHC AI</strong>.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-10 not-prose">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md text-center">
                  <MapPin className="w-8 h-8 text-sky-600 mx-auto mb-3" />
                  <dt className="text-sm font-semibold text-slate-600 mb-1">Headquarters</dt>
                  <dd className="text-lg font-bold text-slate-900">Casablanca, Morocco</dd>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md text-center">
                  <Activity className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <dt className="text-sm font-semibold text-slate-600 mb-1">Founded</dt>
                  <dd className="text-lg font-bold text-slate-900">2024</dd>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md text-center">
                  <Users className="w-8 h-8 text-sky-600 mx-auto mb-3" />
                  <dt className="text-sm font-semibold text-slate-600 mb-1">Team</dt>
                  <dd className="text-lg font-bold text-slate-900">15+ Experts</dd>
                </div>
              </div>

              <p className="text-lg leading-relaxed mt-8">
                Today, DHCaaS serves organizations across Morocco, MENA, and beyond—helping
                them discover PII exposure, maintain compliance, and build trust with their
                customers through transparent data practices.
              </p>
            </div>

            <div className="text-center mt-10">
              <Link
                to="/company/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Learn More About Our Story
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FAQ ACCORDION */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Answers to common questions about DHCaaS
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFAQ === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFAQ(isExpanded ? null : idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setExpandedFAQ(null);
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`faq-${idx}`}
                  id={`faq-btn-${idx}`}
                  className="w-full flex items-start justify-between gap-4 p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg font-bold text-slate-900 flex-1">
                    {faq.question}
                  </span>
                  {isExpanded ? (
                    <Minus className="w-6 h-6 text-sky-600 flex-shrink-0" />
                  ) : (
                    <Plus className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div
                    id={`faq-${idx}`}
                    role="region"
                    aria-labelledby={`faq-btn-${idx}`}
                    className="px-6 pb-6 text-slate-700 leading-relaxed"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-600 mt-10">
          Can't find your answer?{" "}
          <Link to="/company/contact" className="text-sky-600 font-semibold hover:underline">
            Contact our team
          </Link>
        </p>
      </section>

      {/* ====================================================================== */}
      {/* FINAL CTA */}
      {/* ====================================================================== */}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 to-purple-600/20" />
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Ready to Achieve Compliance?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Start scanning for PII exposure, generate audit-ready reports, and improve your
              compliance posture today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center justify-center gap-3"
              >
                {isAuthenticated ? "Start Free Scan" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/request-demo")}
                className="px-8 py-4 bg-slate-800 border-2 border-white text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all inline-flex items-center justify-center gap-3"
              >
                Request Demo
                <Clock className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FOOTER */}
      {/* ====================================================================== */}

      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoImage}
                  alt="DHCaaS Logo"
                  className="w-12 h-12 rounded-xl shadow-lg"
                />
                <div>
                  <div className="text-xl font-bold">DHCaaS</div>
                  <div className="text-sm text-slate-400">Data Health Check as a Service</div>
                </div>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Enterprise data compliance platform with AI-powered PII detection, automated
                incident management, and audit-ready reporting for CNDP 09-08 and GDPR.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:team@dhcaas.com" className="hover:text-white transition-colors">
                    team@dhcaas.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+212705576952" className="hover:text-white transition-colors">
                    +212 705 576 952
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Casablanca, Morocco</span>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-lg font-bold mb-4">Platform</h3>
              <ul className="space-y-2.5">
                {ROUTE_MAP.platform.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-bold mb-4">Products</h3>
              <ul className="space-y-2.5">
                {ROUTE_MAP.products.slice(0, 7).map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2.5">
                {ROUTE_MAP.company.slice(0, 7).map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social + Languages */}
          <div className="border-t border-slate-800 pt-8 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Social Media */}
              <div className="flex items-center gap-4">
                {ROUTE_MAP.social.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Icon className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                    </a>
                  );
                })}
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Globe className="w-5 h-5 text-slate-400" />
                {ROUTE_MAP.languages.map((lang) => (
                  <a
                    key={lang.key}
                    href={lang.href}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {lang.flag} {lang.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-500 text-sm mb-4">
              © {new Date().getFullYear()} DHCaaS. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
              <Link to="/company/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/company/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/company/cookie-policy" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <span>•</span>
              <Link to="/company/dpa" className="hover:text-white transition-colors">
                Data Processing Agreement
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
