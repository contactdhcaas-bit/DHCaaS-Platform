// src/pages/MarketplacePage.tsx
import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  Shield,
  Award,
  TrendingUp,
  Users,
  Clock,
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  Database,
  BarChart3,
  Briefcase,
  Cpu,
  Tag,
  Filter,
} from 'lucide-react';

interface DataProduct {
  id: string;
  title: string;
  description: string;
  category: 'marketing' | 'finance' | 'operations' | 'ai-training';
  rating: number;
  reviews: number;
  certification: 'gold' | 'silver' | 'verified' | null;
  icon: any;
  iconColor: string;
  iconBg: string;
  owner: string;
  lastUpdated: Date;
  recordCount: number;
  downloads: number;
  price: 'free' | 'paid';
  tags: string[];
}

const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [requestReason, setRequestReason] = useState('');

  // Data products
  const dataProducts: DataProduct[] = [
    {
      id: '1',
      title: 'Customer 360 - Gold Version',
      description: 'Complete customer profiles with demographics, behavior, and transaction history. Perfect for marketing campaigns and personalization.',
      category: 'marketing',
      rating: 4.8,
      reviews: 156,
      certification: 'gold',
      icon: Users,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      owner: 'Marketing Team',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      recordCount: 2500000,
      downloads: 450,
      price: 'free',
      tags: ['Customer Data', 'Marketing', 'CRM'],
    },
    {
      id: '2',
      title: 'Financial Transaction Analytics',
      description: 'Anonymized transaction data with detailed financial metrics, fraud indicators, and risk scoring.',
      category: 'finance',
      rating: 4.9,
      reviews: 203,
      certification: 'gold',
      icon: TrendingUp,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
      owner: 'Finance Analytics',
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      recordCount: 5200000,
      downloads: 680,
      price: 'free',
      tags: ['Finance', 'Transactions', 'Analytics'],
    },
    {
      id: '3',
      title: 'Operations Performance Dataset',
      description: 'Real-time operational metrics including efficiency scores, resource utilization, and bottleneck analysis.',
      category: 'operations',
      rating: 4.7,
      reviews: 89,
      certification: 'verified',
      icon: BarChart3,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      owner: 'Operations Team',
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      recordCount: 1800000,
      downloads: 320,
      price: 'free',
      tags: ['Operations', 'KPIs', 'Performance'],
    },
    {
      id: '4',
      title: 'AI Training Set - Sentiment Analysis',
      description: 'Pre-labeled dataset with 10M+ text samples for sentiment classification. Includes multiple languages.',
      category: 'ai-training',
      rating: 5.0,
      reviews: 412,
      certification: 'gold',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      owner: 'AI Research Lab',
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      recordCount: 10000000,
      downloads: 1250,
      price: 'free',
      tags: ['AI', 'NLP', 'Machine Learning'],
    },
    {
      id: '5',
      title: 'Email Campaign Performance',
      description: 'Historical email campaign data with open rates, click-through rates, and conversion metrics.',
      category: 'marketing',
      rating: 4.6,
      reviews: 124,
      certification: 'silver',
      icon: Database,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/20',
      owner: 'Marketing Team',
      lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      recordCount: 850000,
      downloads: 280,
      price: 'free',
      tags: ['Email', 'Marketing', 'Campaigns'],
    },
    {
      id: '6',
      title: 'Sales Pipeline Analytics',
      description: 'End-to-end sales pipeline data with opportunity tracking, win rates, and revenue forecasting.',
      category: 'finance',
      rating: 4.7,
      reviews: 167,
      certification: 'verified',
      icon: Briefcase,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      owner: 'Sales Operations',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      recordCount: 420000,
      downloads: 390,
      price: 'free',
      tags: ['Sales', 'CRM', 'Revenue'],
    },
    {
      id: '7',
      title: 'Supply Chain Optimization Data',
      description: 'Logistics and supply chain data including inventory levels, shipping times, and vendor performance.',
      category: 'operations',
      rating: 4.8,
      reviews: 98,
      certification: 'gold',
      icon: TrendingUp,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/20',
      owner: 'Supply Chain Team',
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      recordCount: 1200000,
      downloads: 410,
      price: 'free',
      tags: ['Supply Chain', 'Logistics', 'Inventory'],
    },
    {
      id: '8',
      title: 'Computer Vision Training Set',
      description: 'Labeled image dataset with 5M+ images across 1000+ categories. Perfect for object detection models.',
      category: 'ai-training',
      rating: 4.9,
      reviews: 567,
      certification: 'gold',
      icon: Cpu,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      owner: 'AI Research Lab',
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      recordCount: 5000000,
      downloads: 890,
      price: 'free',
      tags: ['AI', 'Computer Vision', 'Images'],
    },
    {
      id: '9',
      title: 'Customer Support Tickets',
      description: 'Anonymized support ticket data with resolution times, satisfaction scores, and category classification.',
      category: 'operations',
      rating: 4.5,
      reviews: 76,
      certification: 'verified',
      icon: Users,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/20',
      owner: 'Customer Success',
      lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      recordCount: 680000,
      downloads: 210,
      price: 'free',
      tags: ['Support', 'Customer Service', 'Tickets'],
    },
  ];

  // Categories
  const categories = [
    { id: 'all', name: 'All', icon: Database, count: dataProducts.length },
    { id: 'marketing', name: 'Marketing', icon: Users, count: dataProducts.filter(p => p.category === 'marketing').length },
    { id: 'finance', name: 'Finance', icon: TrendingUp, count: dataProducts.filter(p => p.category === 'finance').length },
    { id: 'operations', name: 'Operations', icon: BarChart3, count: dataProducts.filter(p => p.category === 'operations').length },
    { id: 'ai-training', name: 'AI Training Sets', icon: Cpu, count: dataProducts.filter(p => p.category === 'ai-training').length },
  ];

  // Filter products
  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get certification badge
  const getCertificationBadge = (certification: DataProduct['certification']) => {
    if (!certification) return null;
    
    const badges = {
      gold: { text: 'Gold Standard', bg: 'bg-yellow-500/20', color: 'text-yellow-400', icon: Award },
      silver: { text: 'Silver', bg: 'bg-gray-500/20', color: 'text-gray-400', icon: Award },
      verified: { text: 'Verified', bg: 'bg-green-500/20', color: 'text-green-400', icon: Shield },
    };
    
    return badges[certification];
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Handle request access
  const handleRequestAccess = (product: DataProduct) => {
    setSelectedProduct(product);
    setShowRequestModal(true);
  };

  // Submit request
  const handleSubmitRequest = () => {
    console.log('Requesting access to:', selectedProduct?.title, 'Reason:', requestReason);
    setShowRequestModal(false);
    setSelectedProduct(null);
    setRequestReason('');
    alert('Access request submitted successfully! You will be notified once approved.');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-purple-900/10 border border-purple-500/30 rounded-2xl p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold mb-6">
              <ShoppingCart className="w-4 h-4" />
              Data Marketplace
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Quality Data Products
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Find datasets, reports, and APIs curated for your analytics needs
            </p>

            {/* Hero Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find data products, reports, or APIs..."
                className="w-full pl-16 pr-6 py-5 bg-[#0B1120] border-2 border-gray-700 rounded-2xl text-white text-lg placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all
                  ${isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
                    : 'bg-[#0B1120] text-gray-400 border border-gray-800 hover:border-purple-500/50 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400'}
                `}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {filteredProducts.length} Data Products
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {selectedCategory === 'all' ? 'All categories' : categories.find(c => c.id === selectedCategory)?.name}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const Icon = product.icon;
            const certBadge = getCertificationBadge(product.certification);
            const CertIcon = certBadge?.icon;

            return (
              <div
                key={product.id}
                className="group bg-[#0B1120] border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-900/20"
              >
                {/* Card Header */}
                <div className={`relative p-6 ${product.iconBg} border-b border-gray-800`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl ${product.iconBg} border border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${product.iconColor}`} />
                    </div>
                    
                    {certBadge && CertIcon && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${certBadge.bg} ${certBadge.color} rounded-full text-xs font-bold`}>
                        <CertIcon className="w-3.5 h-3.5" />
                        {certBadge.text}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {product.title}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-lg"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-800">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Records</div>
                      <div className="text-sm font-bold text-white">
                        {(product.recordCount / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Downloads</div>
                      <div className="text-sm font-bold text-white">
                        {product.downloads}
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {getRelativeTime(product.lastUpdated)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {product.owner}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleRequestAccess(product)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-purple-900/50"
                  >
                    <Download className="w-4 h-4" />
                    Request Access
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Request Access Modal */}
      {showRequestModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1120] border border-gray-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Request Data Access</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
                <div className={`w-12 h-12 rounded-lg ${selectedProduct.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {React.createElement(selectedProduct.icon, {
                    className: `w-6 h-6 ${selectedProduct.iconColor}`,
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedProduct.recordCount.toLocaleString()} records • By {selectedProduct.owner}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Why do you need this data? *
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Describe your use case and how you plan to use this data..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitRequest}
                  disabled={!requestReason.trim()}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Submit Request
                </button>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
