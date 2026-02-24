import React, { useState } from "react";
import {
  Key,
  Plus,
  Loader2,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Copy,
  RotateCw,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle,
} from "lucide-react";
import { useApiKeys } from "../hooks/useApiKeys";

// Skeleton Component
const SkeletonLine: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const ApiKeysTab: React.FC = () => {
  const {
    apiKeys,
    isLoading,
    error,
    isCreating,
    revealedKeys,
    createApiKey,
    revokeApiKey,
    rotateApiKey,
    toggleRevealKey,
    copyKey,
    retry,
  } = useApiKeys();

  // Modal state
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  const handleGenerateApiKey = () => {
    setShowNewKeyModal(true);
    setNewKeyName("");
    setGeneratedKey("");
  };

  const handleCreateKey = async () => {
    const result = await createApiKey({ label: newKeyName });
    if (result) {
      setGeneratedKey(result.key);
    }
  };

  const handleCloseModal = () => {
    setShowNewKeyModal(false);
    setNewKeyName("");
    setGeneratedKey("");
  };

  const handleCopyGeneratedKey = () => {
    copyKey(generatedKey);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Key className="w-6 h-6 text-indigo-500" />
            API Keys
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage programmatic access to your DHCaaS workspace
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateApiKey}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <SkeletonLine className="h-5 w-32 mb-2" />
              <SkeletonLine className="h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load API Keys</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && apiKeys.length === 0 && (
        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No API Keys</h3>
          <p className="text-slate-500 mb-4">Create your first API key to access the DHCaaS API.</p>
          <button
            type="button"
            onClick={handleGenerateApiKey}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Create API Key &rarr;
          </button>
        </div>
      )}

      {/* API Keys List */}
      {!isLoading && !error && apiKeys.length > 0 && (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white border border-slate-200 rounded-xl px-5 py-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{key.label}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                        key.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : key.status === "expired"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {revealedKeys.has(key.id)
                        ? key.prefix + "•".repeat(20)
                        : key.prefix + "••••••••"}
                    </span>
                    {key.last_used && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used {key.last_used}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleRevealKey(key.id)}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  {revealedKeys.has(key.id) ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Reveal
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => copyKey(key.prefix + "••••••••")}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={() => rotateApiKey(key.id)}
                  className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <RotateCw className="w-3 h-3" />
                  Rotate
                </button>

                <button
                  type="button"
                  onClick={() => revokeApiKey(key.id)}
                  className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-500" />
                Create New API Key
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {!generatedKey ? (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  API keys allow external applications to access your DHCaaS workspace programmatically.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateKey}
                      disabled={isCreating || !newKeyName.trim()}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900 mb-1">API Key Created!</h4>
                      <p className="text-sm text-emerald-700">
                        Make sure to copy your API key now. You won't be able to see it again!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Your API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedKey}
                        readOnly
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCopyGeneratedKey}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysTab;
