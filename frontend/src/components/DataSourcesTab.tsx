import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Plus,
  Loader2,
  Trash2,
  Activity,
  X,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "../api/apiClient";

// Types
type ConnectionSummary = {
  id: string;
  name: string;
  database_name: string;
  status: string;
  is_default?: boolean;
  created_at?: string;
};

type ScanResult = {
  server_version: string;
  database_name: string;
  collections_count: number;
  objects_count: number;
  data_size_bytes: number;
  collections_list: string[];
};

// Helper: Format Bytes
function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Helper: Get Auth Token
const getAuthToken = (): string | null => {
  let token = localStorage.getItem("token");
  if (!token) {
    const raw = localStorage.getItem("dhc_auth_store");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token ?? null;
      } catch {}
    }
  }
  return token;
};

const DataSourcesTab: React.FC = () => {
  const navigate = useNavigate();

  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    void fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to access data sources.");
      navigate("/login");
      return;
    }

    setLoadingConnections(true);
    try {
      const response = await apiClient.get("/sources");
      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.warn("Backend /sources endpoint not available");
      setConnections([]);

      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (error?.response?.status !== 404) {
        toast.error("Could not load data sources");
      }
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this source?")) return;

    try {
      await apiClient.delete(`/sources/${id}`);
      toast.success("Source deleted");
      await fetchConnections();
    } catch (error: any) {
      toast.error("Failed to delete source");
    }
  };

  const handleScan = async (id: string) => {
    setIsScanning(id);
    setScanResult(null);

    try {
      const response = await apiClient.post(`/scan/${id}`, {});
      const data = response.data?.scan_summary?.details ?? response.data;

      setScanResult(data);
      setShowModal(true);
      toast.success("Scan completed successfully!");
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Scan failed";
      toast.error(String(msg));
    } finally {
      setIsScanning(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-6 h-6 text-indigo-500" />
            Data Sources
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your connected databases</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/settings/connect-mongo")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {loadingConnections ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No Data Sources</h3>
          <p className="text-slate-500 mb-4">Connect a database to start scanning your data.</p>
          <button
            type="button"
            onClick={() => navigate("/settings/connect-mongo")}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Connect MongoDB Now &rarr;
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className={[
                "flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition-all",
                conn.is_default ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-center gap-4">
                <div
                  className={[
                    "p-3 rounded-lg",
                    conn.is_default ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600",
                  ].join(" ")}
                >
                  <Database className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{conn.name}</h3>
                    {conn.is_default && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>MongoDB</span>
                    <span>•</span>
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {conn.database_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScan(conn.id)}
                  disabled={isScanning === conn.id}
                  className={[
                    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm",
                    isScanning === conn.id
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                  ].join(" ")}
                >
                  {isScanning === conn.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(conn.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan Result Modal */}
      {showModal && scanResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Scan Results
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Server Version</p>
                  <p className="text-lg font-bold text-slate-900">{scanResult.server_version}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Database</p>
                  <p className="text-lg font-bold text-slate-900">{scanResult.database_name}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs text-indigo-600 mb-1">Collections</p>
                  <p className="text-2xl font-bold text-indigo-700">{scanResult.collections_count}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1">Total Objects</p>
                  <p className="text-2xl font-bold text-emerald-700">{scanResult.objects_count}</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">Data Size</p>
                <p className="text-2xl font-bold text-purple-700">{formatBytes(scanResult.data_size_bytes)}</p>
              </div>

              {scanResult.collections_list && scanResult.collections_list.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Collections:</p>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.collections_list.map((col, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-mono"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourcesTab;
