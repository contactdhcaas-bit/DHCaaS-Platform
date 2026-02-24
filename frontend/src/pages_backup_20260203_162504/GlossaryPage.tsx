// src/pages/GlossaryPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Tag,
  Building2,
  ChevronRight,
  Plus,
  Edit,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Code,
  Shield,
} from 'lucide-react';

interface GlossaryTerm {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  domain: 'finance' | 'sales' | 'marketing' | 'operations' | 'it' | 'compliance';
  steward: string;
  status: 'approved' | 'draft' | 'review';
  relatedTerms: string[];
  examples?: string;
  lastUpdated: Date;
}

const GlossaryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  // Glossary terms
  const glossaryTerms: GlossaryTerm[] = [
    {
      id: '1',
      term: 'Annual Recurring Revenue',
      acronym: 'ARR',
      definition: 'The value of recurring revenue normalized to a one-year period. This metric is commonly used in subscription-based businesses to measure predictable and recurring revenue components.',
      domain: 'finance',
      steward: 'Sarah Jenkins',
      status: 'approved',
      relatedTerms: ['MRR', 'Churn Rate', 'Customer Lifetime Value'],
      examples: 'If a customer pays $1,200/year or $100/month, the ARR is $1,200.',
      lastUpdated: new Date('2024-01-15'),
    },
    {
      id: '2',
      term: 'Churn Rate',
      definition: 'The percentage of customers who stop using a product or service during a given time period. It is a critical metric for understanding customer retention and business health.',
      domain: 'sales',
      steward: 'Mike Chen',
      status: 'approved',
      relatedTerms: ['Customer Retention Rate', 'Net Revenue Retention', 'Customer Lifetime Value'],
      examples: 'If you start with 1,000 customers and lose 50 in a month, your monthly churn rate is 5%.',
      lastUpdated: new Date('2024-01-20'),
    },
    {
      id: '3',
      term: 'Customer Lifetime Value',
      acronym: 'CLV',
      definition: 'The total revenue a business can reasonably expect from a single customer account throughout their business relationship. It helps companies determine how much to invest in acquiring and retaining customers.',
      domain: 'marketing',
      steward: 'Emma Rodriguez',
      status: 'approved',
      relatedTerms: ['Customer Acquisition Cost', 'Churn Rate', 'Net Promoter Score'],
      examples: 'If a customer pays $50/month and stays for 24 months on average, CLV = $1,200.',
      lastUpdated: new Date('2024-01-18'),
    },
    {
      id: '4',
      term: 'Monthly Recurring Revenue',
      acronym: 'MRR',
      definition: 'The predictable revenue that a subscription-based business expects to receive every month. It is a normalized measure of a company\'s recurring revenue stream.',
      domain: 'finance',
      steward: 'Sarah Jenkins',
      status: 'approved',
      relatedTerms: ['ARR', 'Net New MRR', 'Expansion Revenue'],
      examples: 'If you have 100 customers paying $100/month, your MRR is $10,000.',
      lastUpdated: new Date('2024-01-22'),
    },
    {
      id: '5',
      term: 'Net Promoter Score',
      acronym: 'NPS',
      definition: 'A customer satisfaction metric that measures how likely customers are to recommend a company\'s product or service to others. Scores range from -100 to 100.',
      domain: 'marketing',
      steward: 'Emma Rodriguez',
      status: 'approved',
      relatedTerms: ['Customer Satisfaction Score', 'Customer Effort Score'],
      examples: 'NPS = % Promoters (9-10) - % Detractors (0-6)',
      lastUpdated: new Date('2024-01-25'),
    },
    {
      id: '6',
      term: 'Customer Acquisition Cost',
      acronym: 'CAC',
      definition: 'The total cost of acquiring a new customer, including marketing and sales expenses divided by the number of customers acquired in a given period.',
      domain: 'marketing',
      steward: 'Emma Rodriguez',
      status: 'approved',
      relatedTerms: ['Customer Lifetime Value', 'LTV:CAC Ratio', 'Payback Period'],
      examples: 'If you spend $10,000 on marketing and acquire 100 customers, CAC = $100.',
      lastUpdated: new Date('2024-01-12'),
    },
    {
      id: '7',
      term: 'Conversion Rate',
      definition: 'The percentage of users who take a desired action, such as making a purchase or signing up for a newsletter. It is a key performance indicator for marketing and sales effectiveness.',
      domain: 'sales',
      steward: 'Mike Chen',
      status: 'approved',
      relatedTerms: ['Click-Through Rate', 'Bounce Rate', 'Lead Conversion Rate'],
      examples: 'If 1,000 visitors result in 50 purchases, the conversion rate is 5%.',
      lastUpdated: new Date('2024-01-17'),
    },
    {
      id: '8',
      term: 'Operational Efficiency Ratio',
      acronym: 'OER',
      definition: 'A metric that measures the efficiency of operations by comparing operating expenses to revenue. Lower ratios indicate higher operational efficiency.',
      domain: 'operations',
      steward: 'David Park',
      status: 'approved',
      relatedTerms: ['Operating Margin', 'Productivity Rate', 'Cost per Unit'],
      examples: 'OER = Operating Expenses / Revenue. If expenses are $80K and revenue is $100K, OER = 0.8 or 80%.',
      lastUpdated: new Date('2024-01-19'),
    },
    {
      id: '9',
      term: 'Mean Time To Recovery',
      acronym: 'MTTR',
      definition: 'The average time it takes to restore a system or service to normal operation after a failure or incident. It is a critical metric for IT operations and reliability.',
      domain: 'it',
      steward: 'Alex Kumar',
      status: 'approved',
      relatedTerms: ['Mean Time Between Failures', 'Service Level Agreement', 'Uptime'],
      examples: 'If 10 incidents took a total of 50 hours to resolve, MTTR = 5 hours.',
      lastUpdated: new Date('2024-01-21'),
    },
    {
      id: '10',
      term: 'Data Retention Period',
      definition: 'The length of time that data must be stored before it can be deleted or archived, typically defined by legal, regulatory, or business requirements.',
      domain: 'compliance',
      steward: 'Linda Martinez',
      status: 'approved',
      relatedTerms: ['Data Lifecycle Management', 'GDPR Compliance', 'Archival Policy'],
      examples: 'GDPR requires customer data to be deleted after 7 years of inactivity.',
      lastUpdated: new Date('2024-01-16'),
    },
    {
      id: '11',
      term: 'Lead Velocity Rate',
      acronym: 'LVR',
      definition: 'The month-over-month growth rate of qualified leads in your sales pipeline. It is a leading indicator of future revenue growth.',
      domain: 'sales',
      steward: 'Mike Chen',
      status: 'draft',
      relatedTerms: ['Sales Pipeline', 'Qualified Lead', 'Sales Velocity'],
      examples: 'If you had 100 qualified leads last month and 120 this month, LVR = 20%.',
      lastUpdated: new Date('2024-01-28'),
    },
    {
      id: '12',
      term: 'Personally Identifiable Information',
      acronym: 'PII',
      definition: 'Any data that can be used to identify a specific individual, including names, email addresses, phone numbers, social security numbers, and biometric data.',
      domain: 'compliance',
      steward: 'Linda Martinez',
      status: 'approved',
      relatedTerms: ['Data Privacy', 'GDPR', 'Data Masking', 'Sensitive Data'],
      examples: 'Name, email, phone number, SSN, passport number are all PII.',
      lastUpdated: new Date('2024-01-14'),
    },
  ];

  // Domains configuration
  const domains = [
    { id: 'all', name: 'All Domains', icon: BookOpen, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    { id: 'finance', name: 'Finance', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'sales', name: 'Sales', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'marketing', name: 'Marketing', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'operations', name: 'Operations', icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'it', name: 'IT', icon: Code, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { id: 'compliance', name: 'Compliance', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/20' },
  ];

  // Alphabet for filtering
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Filter terms
  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch = 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.acronym && term.acronym.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLetter = 
        selectedLetter === 'all' || 
        term.term.charAt(0).toUpperCase() === selectedLetter;
      
      const matchesDomain = 
        selectedDomain === 'all' || 
        term.domain === selectedDomain;
      
      const matchesStatus = 
        selectedStatus === 'all' || 
        term.status === selectedStatus;
      
      return matchesSearch && matchesLetter && matchesDomain && matchesStatus;
    });
  }, [glossaryTerms, searchQuery, selectedLetter, selectedDomain, selectedStatus]);

  // Group by first letter
  const groupedTerms = useMemo(() => {
    const grouped: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach(term => {
      const letter = term.term.charAt(0).toUpperCase();
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(term);
    });
    return grouped;
  }, [filteredTerms]);

  // Get status badge
  const getStatusBadge = (status: GlossaryTerm['status']) => {
    const badges = {
      approved: { text: 'Approved', bg: 'bg-green-500/20', color: 'text-green-400', icon: CheckCircle2 },
      draft: { text: 'Draft', bg: 'bg-yellow-500/20', color: 'text-yellow-400', icon: Edit },
      review: { text: 'In Review', bg: 'bg-blue-500/20', color: 'text-blue-400', icon: Clock },
    };
    return badges[status];
  };

  // Get domain config
  const getDomainConfig = (domainId: string) => {
    return domains.find(d => d.id === domainId) || domains[0];
  };

  // Stats
  const stats = {
    totalTerms: glossaryTerms.length,
    approvedTerms: glossaryTerms.filter(t => t.status === 'approved').length,
    domains: new Set(glossaryTerms.map(t => t.domain)).size,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Business Glossary</h1>
            <p className="text-gray-400">Centralized dictionary of business terms and definitions</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            Add Term
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              <div className="text-2xl font-bold text-white">{stats.totalTerms}</div>
            </div>
            <div className="text-sm text-gray-400">Total Terms</div>
          </div>

          <div className="bg-[#0B1120] border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{stats.approvedTerms}</div>
            </div>
            <div className="text-sm text-gray-400">Approved</div>
          </div>

          <div className="bg-[#0B1120] border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <div className="text-2xl font-bold text-blue-400">{stats.domains}</div>
            </div>
            <div className="text-sm text-gray-400">Domains</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms, definitions, or acronyms..."
              className="w-full pl-12 pr-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            />
          </div>

          {/* Domain Filters */}
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => {
              const Icon = domain.icon;
              const isActive = selectedDomain === domain.id;
              
              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                    ${isActive 
                      ? `${domain.bg} ${domain.color} border border-current` 
                      : 'bg-gray-800/50 text-gray-400 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {domain.name}
                </button>
              );
            })}
          </div>

          {/* Alphabet Filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedLetter('all')}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${selectedLetter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }
              `}
            >
              All
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${selectedLetter === letter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                  }
                `}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="space-y-8">
          {Object.keys(groupedTerms).sort().map((letter) => (
            <div key={letter} className="space-y-4">
              {/* Letter Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{letter}</span>
                </div>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Terms */}
              <div className="grid grid-cols-1 gap-4">
                {groupedTerms[letter].map((term) => {
                  const statusBadge = getStatusBadge(term.status);
                  const StatusIcon = statusBadge.icon;
                  const domainConfig = getDomainConfig(term.domain);
                  const DomainIcon = domainConfig.icon;

                  return (
                    <div
                      key={term.id}
                      className="bg-[#0B1120] border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {term.term}
                            </h3>
                            {term.acronym && (
                              <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs font-bold rounded">
                                {term.acronym}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Domain */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${domainConfig.bg} ${domainConfig.color} text-xs font-bold rounded-lg`}>
                              <DomainIcon className="w-3.5 h-3.5" />
                              {domainConfig.name}
                            </span>

                            {/* Status */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${statusBadge.bg} ${statusBadge.color} text-xs font-bold rounded-lg`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusBadge.text}
                            </span>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                          <Edit className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                        </button>
                      </div>

                      {/* Definition */}
                      <div className="mb-4">
                        <p className="text-gray-300 leading-relaxed">
                          {term.definition}
                        </p>
                      </div>

                      {/* Examples */}
                      {term.examples && (
                        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border-l-4 border-purple-500">
                          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                            Example
                          </div>
                          <p className="text-sm text-gray-400">
                            {term.examples}
                          </p>
                        </div>
                      )}

                      {/* Related Terms */}
                      {term.relatedTerms.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Related Terms
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {term.relatedTerms.map((relatedTerm) => (
                              <button
                                key={relatedTerm}
                                className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                              >
                                {relatedTerm}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>Steward: <span className="text-gray-400 font-medium">{term.steward}</span></span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Updated {term.lastUpdated.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTerms.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No terms found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;
