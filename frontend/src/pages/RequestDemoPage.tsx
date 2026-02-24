// src/pages/RequestDemoPage.tsx
import React, { useState } from 'react';
import { 
  Calendar,
  Users,
  Zap,
  Shield,
  CheckCircle,
  Send,
  Building2,
  Mail,
  User,
  MessageSquare
} from 'lucide-react';

// ===== MAIN COMPONENT =====
const RequestDemoPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companySize: '',
    useCase: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo Request Submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Why Book a Demo */}
        <div className="relative p-8 lg:p-12 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"></div>
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              See DHCaaS in <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Action</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Book a personalized demo and discover how DHCaaS can transform your data governance strategy
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-12">
              {[
                {
                  icon: Calendar,
                  title: '30-Minute Personalized Demo',
                  description: 'See how DHCaaS works with your specific use cases',
                },
                {
                  icon: Users,
                  title: 'Talk to Data Experts',
                  description: 'Get answers from our team of data governance specialists',
                },
                {
                  icon: Zap,
                  title: 'Custom Solutions',
                  description: 'Learn about tailored features for your organization',
                },
                {
                  icon: Shield,
                  title: 'Security & Compliance Review',
                  description: 'Understand how we protect your most sensitive data',
                },
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                      <p className="text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <div className="border-t border-white/10 pt-8">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
                Trusted by industry leaders
              </p>
              <div className="flex flex-wrap gap-6 opacity-60">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">SOC 2 Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-gradient-to-br from-white/5 to-white/5 backdrop-blur-sm border-l border-white/10 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            {!submitted ? (
              <>
                <h2 className="text-3xl font-bold mb-2">Request a Demo</h2>
                <p className="text-gray-400 mb-8">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@company.com"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        placeholder="Acme Corporation"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Company Size */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Size *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#0B0F1A]">Select company size</option>
                        <option value="1-10" className="bg-[#0B0F1A]">1-10 employees</option>
                        <option value="11-50" className="bg-[#0B0F1A]">11-50 employees</option>
                        <option value="51-200" className="bg-[#0B0F1A]">51-200 employees</option>
                        <option value="201-1000" className="bg-[#0B0F1A]">201-1,000 employees</option>
                        <option value="1000+" className="bg-[#0B0F1A]">1,000+ employees</option>
                      </select>
                    </div>
                  </div>

                  {/* Use Case */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What's your primary use case? *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        name="useCase"
                        value={formData.useCase}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Tell us about your data governance challenges..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                      ></textarea>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-semibold"
                  >
                    <Send className="w-5 h-5" />
                    Request Demo
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to our Privacy Policy and Terms of Service
                  </p>
                </form>
              </>
            ) : (
              // Success Message
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Thank You!</h3>
                <p className="text-gray-400 mb-8">
                  Your demo request has been received. Our team will reach out to you within 24 hours to schedule a time that works best for you.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <p className="text-sm text-gray-400 mb-2">
                    In the meantime, check your inbox for:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Confirmation email
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Product overview guide
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Case studies from similar companies
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDemoPage;
