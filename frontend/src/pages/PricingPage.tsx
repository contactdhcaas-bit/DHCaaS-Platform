// src/pages/PricingPage.tsx
import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Zap, 
  Shield, 
  Crown,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

// ===== TYPES =====
interface PricingTier {
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  popular?: boolean;
  icon: React.ElementType;
  gradient: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// ===== MOCK DATA =====
const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: { monthly: 49, yearly: 490 },
    description: 'Perfect for small teams getting started with data governance',
    features: [
      'Up to 100K rows scanned/month',
      '5 data sources',
      'Basic anomaly detection',
      'Email alerts',
      'Weekly reports',
      '7-day data retention',
      'Community support',
    ],
    notIncluded: ['Advanced ML models', 'Custom integrations', 'SSO/SAML'],
    cta: 'Start Free Trial',
    icon: Zap,
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    name: 'Pro',
    price: { monthly: 199, yearly: 1990 },
    description: 'For growing teams that need advanced features and support',
    features: [
      'Up to 1M rows scanned/month',
      'Unlimited data sources',
      'Advanced ML anomaly detection',
      'Multi-channel alerts (Slack, PagerDuty)',
      'Real-time monitoring',
      '90-day data retention',
      'API access',
      'Custom compliance rules',
      'Priority support (24/7)',
      'Advanced analytics dashboard',
    ],
    cta: 'Start Free Trial',
    popular: true,
    icon: Shield,
    gradient: 'from-purple-600 to-blue-600',
  },
  {
    name: 'Enterprise',
    price: { monthly: 0, yearly: 0 },
    description: 'Custom solutions for organizations with complex requirements',
    features: [
      'Unlimited rows scanned',
      'Unlimited data sources',
      'Custom ML models',
      'White-label solution',
      'Dedicated infrastructure',
      'Unlimited data retention',
      'SSO/SAML authentication',
      'Custom integrations',
      'SLA guarantees (99.99%)',
      'Dedicated account manager',
      'On-premise deployment option',
      'Advanced security audits',
    ],
    cta: 'Contact Sales',
    icon: Crown,
    gradient: 'from-orange-600 to-red-600',
  },
];

const FAQS: FAQ[] = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate any charges or credits.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, AmEx), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Both Starter and Pro plans come with a 14-day free trial. No credit card required to start. You can explore all features during the trial period.',
  },
  {
    question: 'What happens if I exceed my row scan limit?',
    answer: 'We will notify you when you reach 80% of your limit. If you exceed it, we will automatically upgrade you to the next tier for that month, or you can contact us to discuss options.',
  },
  {
    question: 'Do you offer discounts for nonprofits or educational institutions?',
    answer: 'Yes! We offer a 50% discount for qualified nonprofits and educational institutions. Contact our sales team with your documentation to apply.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee on annual plans. If you are not satisfied within the first 30 days, we will refund your payment in full, no questions asked.',
  },
];

// ===== MAIN COMPONENT =====
const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const getPrice = (tier: PricingTier) => {
    if (tier.price.monthly === 0) return 'Custom';
    const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly;
    return billingCycle === 'monthly' ? `$${price}` : `$${Math.round(price / 12)}`;
  };

  const getSavings = () => {
    return '17% savings';
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
            </button>
            {billingCycle === 'yearly' && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-sm font-medium">
                {getSavings()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {PRICING_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative bg-gradient-to-br ${
                    tier.popular ? 'from-purple-900/40 to-blue-900/40' : 'from-white/5 to-white/5'
                  } border ${
                    tier.popular ? 'border-purple-500/50 scale-105 shadow-2xl shadow-purple-500/20' : 'border-white/10'
                  } rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 ${
                    tier.popular ? 'lg:-mt-4 lg:mb-4' : ''
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${tier.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{getPrice(tier)}</span>
                      {tier.price.monthly > 0 && (
                        <span className="text-gray-400">
                          /{billingCycle === 'monthly' ? 'month' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && tier.price.monthly > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${tier.price.yearly} billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 mb-8 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/50'
                        : 'bg-white/10 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-300 mb-3">What's included:</p>
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {tier.notIncluded && tier.notIncluded.length > 0 && (
                      <>
                        <div className="my-4 border-t border-white/10"></div>
                        <p className="text-sm font-semibold text-gray-500 mb-3">Not included:</p>
                        {tier.notIncluded.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-500">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/50 rounded-2xl p-12 text-center backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-400 mb-8">
            Our team is here to help you find the perfect plan for your needs.
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-semibold">
            Talk to Sales
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
