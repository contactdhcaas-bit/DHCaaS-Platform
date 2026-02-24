// src/pages/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield,
  Zap,
  Lock,
  BarChart3,
  Code,
  Bell,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Slack,
  Globe,
  Clock,
  Users,
  Database,
  TrendingUp,
  Server,
  Activity,
  Scan,
  BookOpen,
  FileText,
  ShieldAlert,
  GitBranch,
  UploadCloud,
  Search,
  Eye,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';


// ===== TYPES =====
type PreviewMode = 'normal' | 'focus' | 'minimized';
type PreviewScene = 0 | 1 | 2;


// ===== MAIN COMPONENT =====
const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Preview interaction state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const [previewScene, setPreviewScene] = useState<PreviewScene>(0);


  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };


  // Preview control handlers
  const handleMinimize = () => {
    setPreviewMode('minimized');
  };

  const handleRestore = () => {
    setPreviewMode('normal');
  };

  const handleToggleFocus = () => {
    setPreviewMode(prev => prev === 'focus' ? 'normal' : 'focus');
  };

  const handleSwitchScene = () => {
    setPreviewScene(prev => ((prev + 1) % 3) as PreviewScene);
  };


  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">DHCaaS</span>
            </div>


            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors">
                Platform
              </button>
              <button onClick={() => scrollToSection('compliance')} className="text-gray-300 hover:text-white transition-colors">
                Compliance
              </button>
              <button onClick={() => scrollToSection('footer')} className="text-gray-300 hover:text-white transition-colors">
                Contact
              </button>
            </div>


            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/dashboard" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/scans/new" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-medium">
                Start Free Scan
              </Link>
            </div>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>


        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B0F1A] border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Platform
              </button>
              <button onClick={() => scrollToSection('compliance')} className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Compliance
              </button>
              <button onClick={() => scrollToSection('footer')} className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Contact
              </button>
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Link to="/dashboard" className="block w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Login
                </Link>
                <Link to="/scans/new" className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-medium">
                  Start Free Scan
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-purple-600/10 rounded-full blur-3xl"></div>


        <div className="relative max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className={`text-center max-w-4xl mx-auto mb-12 transition-opacity duration-300 ${
            previewMode === 'focus' ? 'opacity-40' : 'opacity-100'
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">CNDP 09-08 & GDPR Compliant Platform</span>
            </div>


            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Data Health Check
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                as a Service
              </span>
            </h1>


            <p className="text-lg text-gray-400 mb-3 max-w-2xl mx-auto">
              Automated PII detection, data quality scoring, and compliance monitoring 
              built specifically for MENA & EMEA organizations.
            </p>

            <p className="text-base text-purple-300/80 mb-8 max-w-2xl mx-auto font-medium">
              The only compliance-first platform designed for CNDP 09-08 (Morocco), 
              GDPR, and regional data protection requirements.
            </p>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/scans/new" className="group px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 font-semibold flex items-center gap-2">
                Start New Scan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/dashboard" className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-semibold backdrop-blur-sm">
                View Dashboard
              </Link>
            </div>


            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-green-500" />
                <span>TLS 1.3 Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span>CNDP 09-08 Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>GDPR Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-teal-500" />
                <span>Zero Data Retention</span>
              </div>
            </div>
          </div>


          {/* Dashboard Preview - Interactive */}
          {previewMode === 'minimized' ? (
            // Minimized Pill
            <div className="flex justify-center">
              <button
                onClick={handleRestore}
                className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              >
                <Maximize2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Dashboard preview minimized - Click to restore
                </span>
              </button>
            </div>
          ) : (
            // Full Preview
            <div className="relative flex flex-col items-center">
              {/* Focus Mode Label */}
              {previewMode === 'focus' && (
                <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg backdrop-blur-sm animate-pulse">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">
                    Focus Mode: {previewScene === 0 ? 'Executive Dashboard' : previewScene === 1 ? 'Scan Engine' : 'Compliance Snapshot'}
                  </span>
                </div>
              )}

              <div className={`relative transition-all duration-500 ${
                previewMode === 'focus' ? 'max-w-6xl scale-105' : 'max-w-5xl'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent z-10"></div>
                <div className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="bg-[#0D1117] rounded-xl overflow-hidden border border-white/5">
                    {/* Interactive Dashboard Header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161B22] border-b border-white/5">
                      <div className="flex gap-2">
                        {/* Red - Minimize */}
                        <button
                          onClick={handleMinimize}
                          aria-label="Minimize preview"
                          className="w-2.5 h-2.5 bg-red-500 rounded-full hover:bg-red-400 transition-colors cursor-pointer"
                        />
                        {/* Yellow - Switch Scene */}
                        <button
                          onClick={handleSwitchScene}
                          aria-label="Change preview scene"
                          className="w-2.5 h-2.5 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors cursor-pointer"
                        />
                        {/* Green - Focus */}
                        <button
                          onClick={handleToggleFocus}
                          aria-label="Toggle focus mode"
                          className="w-2.5 h-2.5 bg-green-500 rounded-full hover:bg-green-400 transition-colors cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 text-center text-xs text-gray-500">
                        dashboard.dhcaas.com
                      </div>
                    </div>


                    {/* Dynamic Dashboard Content - Scene Based */}
                    <div className="p-5 space-y-3 transition-all duration-300">
                      {/* Scene 0: Executive Dashboard (Default) */}
                      {previewScene === 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-28 bg-white/5 rounded animate-pulse"></div>
                            <div className="h-6 w-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded"></div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg"></div>
                            <div className="h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg"></div>
                            <div className="h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg"></div>
                          </div>
                          <div className="h-40 bg-white/5 rounded-lg border border-white/5"></div>
                        </>
                      )}

                      {/* Scene 1: Scan in Progress */}
                      {previewScene === 1 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Scan className="w-5 h-5 text-purple-400 animate-pulse" />
                              <span className="text-sm text-gray-400">Scanning customer_data.csv</span>
                            </div>
                            <span className="text-xs text-green-400">124,586 rows</span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Progress: 67%</span>
                              <span>~30s remaining</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all duration-1000" style={{width: '67%'}}></div>
                            </div>
                          </div>

                          {/* PII Counters */}
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Email Addresses</div>
                              <div className="text-xl font-bold text-red-400">1,247</div>
                            </div>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Phone Numbers</div>
                              <div className="text-xl font-bold text-amber-400">892</div>
                            </div>
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">SSN/IDs</div>
                              <div className="text-xl font-bold text-purple-400">156</div>
                            </div>
                          </div>

                          {/* Recent Findings */}
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/5">
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-xs text-gray-400">Critical: Unmasked email in column 'contact_info'</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/5">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-xs text-gray-400">Validated: Date formats conform to ISO-8601</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Scene 2: Compliance Snapshot */}
                      {previewScene === 2 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-5 h-5 text-green-400" />
                              <span className="text-sm text-gray-400">Compliance Dashboard</span>
                            </div>
                            <span className="text-xs text-green-400">Last updated: 2 min ago</span>
                          </div>

                          {/* Compliance Cards */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Data Quality Score */}
                            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-gray-400">Data Quality Score</span>
                              </div>
                              <div className="text-3xl font-bold text-green-400">87%</div>
                              <div className="text-xs text-gray-500 mt-1">↑ 3% from last scan</div>
                            </div>

                            {/* PII Issues */}
                            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-gray-400">PII Issues</span>
                              </div>
                              <div className="text-3xl font-bold text-amber-400">3</div>
                              <div className="text-xs text-gray-500 mt-1">Critical priority</div>
                            </div>
                          </div>

                          {/* Compliance Status */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-gray-400">CNDP 09-08 (Morocco)</span>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-gray-400">GDPR (EU)</span>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                          </div>

                          {/* Last Audit */}
                          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Last Audit Report</span>
                              <span className="text-xs text-purple-400">Feb 7, 2026</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
            <p className="text-gray-400">
              Four simple steps to enterprise-grade data governance
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl mb-4">
                <UploadCloud className="w-8 h-8 text-purple-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Data</h3>
              <p className="text-sm text-gray-400">
                Upload CSV or Excel files via web interface or API
              </p>
            </div>


            {/* Step 2 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Run Scan</h3>
              <p className="text-sm text-gray-400">
                Automated PII detection, quality checks, and compliance validation
              </p>
            </div>


            {/* Step 3 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 border border-green-500/30 rounded-2xl mb-4">
                <Eye className="w-8 h-8 text-green-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Review Results</h3>
              <p className="text-sm text-gray-400">
                Get PDF reports, explore catalog, and define business terms
              </p>
            </div>


            {/* Step 4 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600/20 border border-amber-500/30 rounded-2xl mb-4">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Monitor Compliance</h3>
              <p className="text-sm text-gray-400">
                Track CNDP & GDPR requirements in real-time dashboard
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Platform Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Complete Data Governance Platform
            </h2>
            <p className="text-lg text-gray-400">
              Everything you need for enterprise data quality and compliance
            </p>
          </div>


          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1 - New Scan Engine (Wide) */}
            <Link to="/scans/new" className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scan className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold">Scan Engine</h3>
              </div>
              <p className="text-gray-400 mb-6 text-sm">
                Upload files and instantly detect PII (email, phone, SSN), assess data quality, 
                and validate compliance rules.
              </p>
              {/* Mock Scan Preview */}
              <div className="relative h-44 bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-3">
                <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500">Analyzing 124,586 rows...</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full" style={{width: '67%'}}></div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-purple-300 font-medium group-hover:gap-3 transition-all">
                <span>Start New Scan</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 2 - Audit Reports (Tall) */}
            <Link to="/reports" className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Audit Reports</h3>
              </div>
              <p className="text-gray-400 mb-6 text-sm">
                Professional PDF reports with quality scores, PII findings, and compliance status.
              </p>
              <div className="space-y-2.5 mb-4">
                {['Quality Score: 87%', 'PII Fields: 12', 'Critical: 3', 'GDPR ✓'].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-black/20 rounded-lg border border-white/5 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span className="font-medium">{stat}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-300 font-medium group-hover:gap-3 transition-all">
                <span>View Reports</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 3 - Data Catalog (Small) */}
            <Link to="/catalog" className="md:col-span-1 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Data Catalog</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Centralized inventory with automated lineage tracking.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-300 font-medium group-hover:gap-3 transition-all">
                <span>Browse Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 4 - Business Glossary (Small with BETA) */}
            <Link to="/glossary" className="md:col-span-1 bg-gradient-to-br from-orange-900/20 to-amber-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Glossary</h3>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/90 text-white mt-0.5">
                    BETA
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Standardize business terms across your organization.
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-300 font-medium group-hover:gap-3 transition-all">
                <span>Open Glossary</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 5 - Compliance Overview (Wide) */}
            <Link to="/compliance-overview" className="md:col-span-2 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-pink-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold">Compliance Dashboard</h3>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Real-time monitoring for CNDP 09-08 (Morocco) and GDPR requirements with automated audit trails.
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-300 font-medium group-hover:gap-3 transition-all">
                <span>View Compliance</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 6 - API-First */}
            <Link to="/settings" className="md:col-span-1 bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Code className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold">Developer API</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                RESTful API with comprehensive SDKs.
              </p>
              <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 font-mono text-[10px] text-green-400 mb-3">
                <div>POST /api/v1/scan</div>
                <div className="text-gray-600">Authorization: Bearer $KEY</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium group-hover:gap-3 transition-all">
                <span>API Docs</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>


            {/* Card 7 - Instant Alerts */}
            <Link to="/incidents" className="md:col-span-1 bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold">Smart Alerts</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Multi-channel notifications for incidents.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                  <Slack className="w-5 h-5 text-purple-400" />
                </div>
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-300 font-medium group-hover:gap-3 transition-all">
                <span>View Incidents</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* Trust & Compliance Strip */}
      <section id="compliance" className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise Security & Compliance</h3>
            <p className="text-sm text-gray-400">Built for regulated industries and data-sensitive organizations</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <Lock className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-semibold mb-1">TLS 1.3</div>
              <div className="text-xs text-gray-500">End-to-end encryption</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-semibold mb-1">CNDP 09-08</div>
              <div className="text-xs text-gray-500">Morocco DPA ready</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-semibold mb-1">GDPR</div>
              <div className="text-xs text-gray-500">EU compliance aligned</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <Database className="w-8 h-8 text-teal-400 mx-auto mb-2" />
              <div className="text-sm font-semibold mb-1">Zero Retention</div>
              <div className="text-xs text-gray-500">Your data, your control</div>
            </div>
          </div>
        </div>
      </section>


      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                10M+
              </div>
              <p className="text-sm text-gray-400">Rows Scanned Daily</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <p className="text-sm text-gray-400">Uptime SLA</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                &lt;200ms
              </div>
              <p className="text-sm text-gray-400">Average API Response</p>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer id="footer" className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/scans/new" className="hover:text-white transition-colors">New Scan</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Reports</Link></li>
                <li><Link to="/catalog" className="hover:text-white transition-colors">Data Catalog</Link></li>
                <li><Link to="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              </ul>
            </div>


            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>


            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Status</a></li>
              </ul>
            </div>


            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><Link to="/compliance-overview" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>


            {/* Social */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>


          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">DHCaaS</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 Data Health Check as a Service. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default LandingPage;
