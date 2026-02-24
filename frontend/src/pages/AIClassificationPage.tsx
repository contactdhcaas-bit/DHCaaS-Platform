// src/pages/AIClassificationPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Upload, Brain, AlertCircle, CheckCircle, Info, 
  Sparkles, Shield, TrendingUp, Eye, Check, X,
  Zap, Lock, MapPin, DollarSign, Clock, User,
  Building, BarChart3
} from 'lucide-react';

interface ClassificationResult {
  analysis_id: string;
  file_name: string;
  latency_ms: number;
  dataset_summary: {
    total_rows: number;
    total_columns: number;
    pii_columns: number;
    sensitive_columns: number;
    categories_detected: number;
    high_confidence_rate: number;
  };
  columns: Array<{
    name: string;
    data_type: string;
    ai_classification: {
      category: string;
      sensitivity: string;
      business_context: string;
      icon: string;
      confidence: number;
      recommendations: string[];
    };
  }>;
  classification_summary: {
    total_columns_classified: number;
    categories_breakdown: Record<string, number>;
    sensitivity_breakdown: Record<string, number>;
  };
}

const AIClassificationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [confirmedTags, setConfirmedTags] = useState<Record<string, boolean>>({});

  // Scanning animation effect
  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [scanning]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setLoading(true);
    setScanning(true);
    setScanProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate minimum 2 seconds for dramatic effect
      const [response] = await Promise.all([
        fetch('http://localhost:8000/api/v1/analysis/scan', {
          method: 'POST',
          body: formData,
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data);
      
      // Initialize all tags as unconfirmed
      const initialConfirmed: Record<string, boolean> = {};
      data.columns.forEach((col: any) => {
        initialConfirmed[col.name] = false;
      });
      setConfirmedTags(initialConfirmed);
      
    } catch (err) {
      setError('Failed to analyze file. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(false), 500);
    }
  };

  const toggleConfirmTag = (columnName: string) => {
    setConfirmedTags(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'PII/Sensitive': Lock,
      'Financial': DollarSign,
      'Location': MapPin,
      'Technical': Zap,
      'Temporal': Clock,
      'Contact': User,
      'Business': Building,
      'Metric': BarChart3,
    };
    return icons[category] || Info;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'PII/Sensitive': 'from-red-500 to-pink-600',
      'Financial': 'from-emerald-500 to-green-600',
      'Location': 'from-blue-500 to-cyan-600',
      'Technical': 'from-gray-500 to-slate-600',
      'Temporal': 'from-purple-500 to-indigo-600',
      'Contact': 'from-indigo-500 to-blue-600',
      'Business': 'from-teal-500 to-cyan-600',
      'Metric': 'from-amber-500 to-orange-600',
    };
    return colors[category] || 'from-slate-500 to-gray-600';
  };

  const getSensitivityBadge = (sensitivity: string) => {
    switch (sensitivity) {
      case 'High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Scanning Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* AI Brain Animation */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                <Brain className="w-16 h-16 text-purple-400 animate-bounce" />
              </div>
              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-purple-500 rounded-full -translate-x-1/2"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
                <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-pink-500 rounded-full -translate-x-1/2"></div>
              </div>
            </div>

            {/* Scanning Text */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                CLAIRE Competitor Engine
              </h2>
              <p className="text-purple-300 text-lg animate-pulse">
                Analyzing data patterns...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>

            {/* Matrix Effect */}
            <div className="font-mono text-green-400 text-xs space-y-1 opacity-50">
              <div className="animate-pulse">01001000 01100101 01101100 01101100 01101111</div>
              <div className="animate-pulse delay-100">Scanning schema patterns...</div>
              <div className="animate-pulse delay-200">Detecting PII signatures...</div>
              <div className="animate-pulse delay-300">Calculating confidence scores...</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white">
                  AI Classification
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg shadow-emerald-500/50">
                  NEW
                </span>
              </div>
              <p className="text-purple-200 mt-1">
                Smart data classification powered by CLAIRE AI competitor engine
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!results && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-purple-500/20">
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                dragActive
                  ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                  : 'border-purple-500/30 hover:border-purple-400/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <label className="flex flex-col items-center justify-center h-80 cursor-pointer group">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <span className="text-2xl font-bold text-white mb-2">
                  Drop your CSV/XLSX file here
                </span>
                <span className="text-purple-300">
                  or click to browse (max 50MB)
                </span>
                <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by advanced AI pattern recognition</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3 backdrop-blur-xl">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Results */}
        {results && !scanning && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-xl shadow-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-100 text-sm font-medium">Total Columns</div>
                  <Database className="w-5 h-5 text-blue-100" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {results.dataset_summary.total_columns}
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 shadow-xl shadow-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-red-100 text-sm font-medium">Sensitive Data</div>
                  <Shield className="w-5 h-5 text-red-100" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {results.dataset_summary.sensitive_columns}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl shadow-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-emerald-100 text-sm font-medium">AI Accuracy</div>
                  <TrendingUp className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {results.dataset_summary.high_confidence_rate.toFixed(0)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl shadow-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-purple-100 text-sm font-medium">Categories</div>
                  <Sparkles className="w-5 h-5 text-purple-100" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {results.dataset_summary.categories_detected}
                </div>
              </div>
            </div>

            {/* Analysis Complete Badge */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-white font-semibold">
                    Analysis Complete - {results.file_name}
                  </div>
                  <div className="text-emerald-300 text-sm">
                    Processed in {results.latency_ms}ms • {results.dataset_summary.total_rows.toLocaleString()} rows analyzed
                  </div>
                </div>
              </div>
            </div>

            {/* Column Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.columns.map((col, idx) => {
                const CategoryIcon = getCategoryIcon(col.ai_classification?.category);
                const isLowConfidence = col.ai_classification?.confidence < 0.8;
                const isConfirmed = confirmedTags[col.name];

                return (
                  <div
                    key={idx}
                    className={`relative bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
                      isLowConfidence && !isConfirmed
                        ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                        : isConfirmed
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                        : 'border-purple-500/20 hover:border-purple-500/40'
                    }`}
                  >
                    {/* Category Badge */}
                    <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${getCategoryColor(col.ai_classification?.category)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>

                    {/* Column Name */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {col.name}
                      </h3>
                      <span className="text-purple-300 text-xs">
                        {col.data_type}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="mb-4">
                      <div className="text-purple-400 text-xs mb-1">Category</div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${getCategoryColor(col.ai_classification?.category)} rounded-lg text-white text-sm font-medium`}>
                        {col.ai_classification?.category}
                      </div>
                    </div>

                    {/* Circular Confidence Meter */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-purple-400 text-xs mb-1">Confidence Score</div>
                        <div className="text-2xl font-bold text-white">
                          {(col.ai_classification?.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-slate-700"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - col.ai_classification?.confidence)}`}
                            className={isLowConfidence ? 'text-yellow-500' : 'text-emerald-500'}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Sensitivity Badge */}
                    <div className="mb-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getSensitivityBadge(col.ai_classification?.sensitivity)}`}>
                        {col.ai_classification?.sensitivity} Sensitivity
                      </span>
                    </div>

                    {/* Low Confidence Warning */}
                    {isLowConfidence && !isConfirmed && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400 text-xs">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">Review Required - Is this correct?</span>
                        </div>
                      </div>
                    )}

                    {/* Confirm Toggle */}
                    <button
                      onClick={() => toggleConfirmTag(col.name)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                        isConfirmed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirmed</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Confirm Tag</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResults(null);
                  setFile(null);
                  setConfirmedTags({});
                }}
                className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
              >
                Analyze Another File
              </button>
              <button
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/30"
              >
                Export Classification Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
    </svg>
  );
}

export default AIClassificationPage;
