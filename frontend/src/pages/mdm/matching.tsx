// src/pages/mdm/matching.tsx
import React, { useState } from 'react';
import {
  Search,
  Upload,
  Database,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Download,
  TrendingUp,
} from 'lucide-react';

interface MatchResult {
  source_record: Record<string, any>;
  target_record: Record<string, any>;
  similarity_score: number;
  column_scores: Record<string, number>;
  match_confidence: string;
  source_index: number;
  target_index: number;
}

interface MatchResponse {
  matches: MatchResult[];
  summary: {
    total_matches: number;
    source_rows: number;
    target_rows: number;
    match_rate: number;
    confidence_distribution: {
      high: number;
      medium: number;
      low: number;
    };
    avg_similarity: number;
    min_similarity: number;
    max_similarity: number;
  };
  execution_time: number;
  source_file: string;
  target_file: string;
}

const MDMMatching: React.FC = () => {
  const [sourceFile, setSourceFile] = useState('');
  const [targetFile, setTargetFile] = useState('');
  const [matchColumns, setMatchColumns] = useState('');
  const [threshold, setThreshold] = useState(85);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState('');

  const handleMatch = async () => {
    if (!sourceFile || !targetFile || !matchColumns) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const columns = matchColumns.split(',').map(col => col.trim());
      
      const response = await fetch('http://localhost:8000/api/v1/mdm/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_file_id: sourceFile,
          target_file_id: targetFile,
          match_columns: columns,
          threshold: threshold,
          limit: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Matching failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during matching');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const downloadResults = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mdm_matches_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Fuzzy Matching Engine
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Find matching records across datasets with AI-powered similarity detection
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source File */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Source File ID *
              </label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={sourceFile}
                  onChange={(e) => setSourceFile(e.target.value)}
                  placeholder="customers_2024.csv"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Target File */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Target File ID *
              </label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={targetFile}
                  onChange={(e) => setTargetFile(e.target.value)}
                  placeholder="customers_2025.csv"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Match Columns */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Match Columns (comma-separated) *
              </label>
              <input
                type="text"
                value={matchColumns}
                onChange={(e) => setMatchColumns(e.target.value)}
                placeholder="name, email, phone"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Similarity Threshold: {threshold}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleMatch}
            disabled={loading}
            className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Matches
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Matches</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {result.summary.total_matches}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Similarity</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {result.summary.avg_similarity.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Match Rate</span>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {result.summary.match_rate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Execution Time</span>
                  <Loader className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {result.execution_time.toFixed(2)}s
                </p>
              </div>
            </div>

            {/* Download Button */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={downloadResults}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Results (JSON)
              </button>
            </div>

            {/* Matches Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Matched Records ({result.matches.length})
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Source Record
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Target Record
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {result.matches.map((match, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-blue-600">
                            {match.similarity_score.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getConfidenceColor(match.match_confidence)}`}>
                            {match.match_confidence}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(match.source_record, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4">
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(match.target_record, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MDMMatching;
