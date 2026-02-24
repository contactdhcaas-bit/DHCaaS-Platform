// src/pages/ComplianceOverviewPage.tsx
import React from 'react';
import { ShieldAlert, CheckCircle2, FileText, Eye, BarChart3 } from 'lucide-react';



const ComplianceOverviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title & Description */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Compliance Overview
            </h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400">
            Monitor your data governance posture and ensure alignment with CNDP 09-08 and GDPR requirements
          </p>
        </div>
      </div>



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compliance Status Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                Compliance Framework Active
              </h2>
              <p className="text-green-800 dark:text-green-200 leading-relaxed">
                Your DHCaaS platform is configured to support CNDP 09-08 (Moroccan Data Protection Law) 
                and GDPR compliance requirements. All data processing activities are tracked and auditable.
              </p>
            </div>
          </div>
        </div>



        {/* Key Compliance Capabilities */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Key Compliance Capabilities
          </h2>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capability 1: Data Inventory */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Comprehensive Data Inventory
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Maintain a complete catalog of all data assets, including data sources, tables, columns, 
                    and data lineage. Essential for CNDP Article 25 (Data Processing Registry) compliance.
                  </p>
                </div>
              </div>
            </div>



            {/* Capability 2: PII Detection */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Automated PII Detection & Classification
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Automatically identify and classify personally identifiable information (PII) across 
                    all data sources. Supports data minimization principles required by GDPR Article 5(1)(c).
                  </p>
                </div>
              </div>
            </div>



            {/* Capability 3: Audit Reports */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Audit-Ready Reporting
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Generate comprehensive data quality and compliance reports with full traceability. 
                    Supports demonstrating accountability under GDPR Article 5(2) and CNDP Article 23.
                  </p>
                </div>
              </div>
            </div>



            {/* Capability 4: Data Governance Policies */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Policy Management & Enforcement
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Define and enforce data governance policies across your organization. Ensures consistent 
                    application of data protection measures as required by both CNDP and GDPR frameworks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Regulatory Framework Reference */}
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Regulatory Framework Alignment
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-1">
                CNDP Law 09-08 (Morocco)
              </h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                DHCaaS supports compliance with Morocco's Data Protection Law, including requirements for 
                data processing registries, security measures, and individual rights management.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                GDPR (European Union)
              </h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                The platform implements GDPR principles including lawfulness, fairness, transparency, 
                data minimization, accuracy, storage limitation, and integrity/confidentiality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default ComplianceOverviewPage;
