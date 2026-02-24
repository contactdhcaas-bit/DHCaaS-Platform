// src/pages/mdm/index.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Copy,
  Users,
  Star,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';

const MDMIndex: React.FC = () => {
  const features = [
    {
      name: 'Fuzzy Matching',
      description: 'Find matching records across different datasets using advanced similarity algorithms',
      icon: Search,
      href: '/mdm/matching',
      color: 'from-blue-500 to-blue-600',
      stats: 'Match with 85%+ accuracy',
      badge: 'Core Feature',
    },
    {
      name: 'Deduplication',
      description: 'Identify and merge duplicate records within your datasets automatically',
      icon: Copy,
      href: '/mdm/deduplication',
      color: 'from-purple-500 to-purple-600',
      stats: 'Remove duplicates instantly',
      badge: 'Automated',
    },
    {
      name: 'Customer 360',
      description: 'Create unified customer profiles by merging data from multiple sources',
      icon: Users,
      href: '/mdm/customer360',
      color: 'from-green-500 to-green-600',
      stats: 'Complete customer view',
      badge: 'Enterprise',
    },
    {
      name: 'Golden Records',
      description: 'View and manage your master data golden records - single source of truth',
      icon: Star,
      href: '/mdm/golden-records',
      color: 'from-yellow-500 to-yellow-600',
      stats: 'Master data registry',
      badge: 'Premium',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process millions of records in seconds with optimized algorithms',
    },
    {
      icon: Shield,
      title: 'Enterprise Grade',
      description: 'Compete with Informatica, Tamr, and Reltio MDM solutions',
    },
    {
      icon: TrendingUp,
      title: 'High Accuracy',
      description: 'Advanced fuzzy matching with 85%+ similarity thresholds',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-semibold mb-4 shadow-lg">
            <Star className="w-4 h-4" />
            NEW FEATURE
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Master Data Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Identity resolution, fuzzy matching, and Customer 360 capabilities
            to compete with Informatica IDMC and Tamr
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                to={feature.href}
                className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Stats & Arrow */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {feature.stats}
                  </span>
                  <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Choose DHCaaS MDM?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl text-white shadow-lg mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Competitive Info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">
                🚀 Compete with Industry Leaders
              </h3>
              <p className="text-blue-100 text-lg mb-4">
                Our MDM engine provides enterprise-grade identity resolution, fuzzy matching,
                and master data management capabilities - matching industry leaders like
                <strong className="text-white"> Informatica Customer 360</strong>,
                <strong className="text-white"> Tamr</strong>, and
                <strong className="text-white"> Reltio MDM</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
                  Fuzzy Matching
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
                  Identity Resolution
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
                  Golden Records
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
                  Customer 360
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDMIndex;
