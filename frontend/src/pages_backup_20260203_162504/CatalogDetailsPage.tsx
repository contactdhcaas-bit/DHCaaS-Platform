// frontend/src/pages/CatalogDetailsPage.tsx

import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Database,
  ArrowLeft,
  FileText,
  Calendar,
  Tag,
  Shield,
  Activity,
  Edit2,
  Archive,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Globe,
} from "lucide-react";
import { api, Asset, UnifiedScanRow } from "../lib/api";
import { Modal } from "../components/ui/Modal";

// ─────────────────────────────────────────────
// Helpers for tag normalization (case-insensitive)
// ─────────────────────────────────────────────

function normalizeTagInput(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function addTagCaseInsensitive(tags: string[], newTag: string): string[] {
  const normalized = normalizeTagInput(newTag);
  if (!normalized) return tags;

  const lower = normalized.toLowerCase();
  const exists = tags.some((t) => t.trim().toLowerCase() === lower);
  if (exists) return tags;

  return [...tags, normalized];
}

function removeTagCaseInsensitive(tags: string[], tagToRemove: string): string[] {
  const lower = normalizeTagInput(tagToRemove).toLowerCase();
  return tags.filter((t) => t.trim().toLowerCase() !== lower);
}

function toNumberOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: any): string | null {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return null;
}

function normalizeStatus(raw: any): UnifiedScanRow["status"] {
  if (raw === "Healthy") return "Healthy";
  if (raw === "Unhealthy") return "Unhealthy";
  if (raw === "Compliant") return "Compliant";
  if (raw === "Non-Compliant") return "Non-Compliant";
  return "Unknown";
}

function mapRawScanToUnifiedRow(raw: any): UnifiedScanRow {
  const scanKind = raw?.scan_kind === "connectivity" ? "connectivity" : "metadata";

  const scannedAt =
    toStringOrNull(raw?.checked_at) ||
    toStringOrNull(raw?.created_at) ||
    toStringOrNull(raw?.updated_at) ||
    null;

  if (scanKind === "connectivity") {
    const method =
      toStringOrNull(raw?.details?.method) ||
      toStringOrNull(raw?.details?.probe) ||
      toStringOrNull(raw?.details?.type) ||
      "HTTP";

    return {
      id: String(raw?.id ?? raw?._id ?? raw?.scan_id ?? "unknown"),
      scan_type: "connectivity",
      scanned_at: scannedAt,
      status: normalizeStatus(raw?.status),
      latency_ms: toNumberOrNull(raw?.latency_ms),
      method,
      filename: null,
      completeness_pct: null,
      issue_count: null,
    };
  }

  // metadata / csv
  const totalRows = toNumberOrNull(raw?.total_rows);
  const piiExposure = toNumberOrNull(raw?.pii_total_exposure);
  const issueCount =
    piiExposure !== null
      ? piiExposure
      : Array.isArray(raw?.pii_columns_found)
      ? raw.pii_columns_found.length
      : null;

  const completenessPct =
    raw?.compliance_score !== undefined ? toNumberOrNull(raw?.compliance_score) : null;

  return {
    id: String(raw?.id ?? raw?._id ?? "unknown"),
    scan_type: "metadata",
    scanned_at: scannedAt,
    status: normalizeStatus(raw?.status),
    latency_ms: null,
    method: null,
    filename: toStringOrNull(raw?.filename),
    completeness_pct: completenessPct,
    issue_count: issueCount,
  };
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────

const DetailsSkeleton: React.FC = () => {
  const Card: React.FC = () => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="h-4 w-24 bg-gray-700 rounded mb-4 animate-pulse" />
      <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-gray-800 border border-gray-700 rounded-lg animate-pulse" />
          <div>
            <div className="h-8 w-64 bg-gray-800 border border-gray-700 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-gray-800 border border-gray-700 rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        <div className="h-10 w-28 bg-gray-800 border border-gray-700 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card />
        <Card />
        <Card />
        <Card />
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="h-6 w-24 bg-gray-700 rounded mb-4 animate-pulse" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="h-6 w-32 bg-gray-700 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────

const CatalogDetailsPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isEditingSensitivity, setIsEditingSensitivity] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmNextStatus, setConfirmNextStatus] = useState<"active" | "archived">("archived");

  const [lastConnectivityScan, setLastConnectivityScan] = useState<{
    status: "Healthy" | "Unhealthy";
    latency_ms: number;
    checked_at: string;
    target: string;
    scan_id: string;
  } | null>(null);

  // Fetch asset details
  const {
    data: asset,
    isLoading: assetLoading,
    isError: assetError,
  } = useQuery<Asset>({
    queryKey: ["asset", assetId],
    queryFn: () => api.getAsset(assetId!),
    enabled: !!assetId,
  });

  // Fetch mixed scans (raw) then map to unified rows
  const { data: unifiedScans, isLoading: scansLoading } = useQuery<UnifiedScanRow[]>({
    queryKey: ["asset-scans", assetId],
    queryFn: async () => {
      const raw = await api.getAssetScansRaw(assetId!);
      const rows = raw.map(mapRawScanToUnifiedRow);

      rows.sort((a, b) => {
        const da = a.scanned_at ? new Date(a.scanned_at).getTime() : 0;
        const db = b.scanned_at ? new Date(b.scanned_at).getTime() : 0;
        return db - da;
      });

      return rows;
    },
    enabled: !!assetId,
  });

  // Connectivity scan mutation
  const scanConnectivityMutation = useMutation({
    mutationFn: async () => {
      return await api.scanAssetConnectivity(assetId!);
    },
    onSuccess: (result) => {
      setLastConnectivityScan({
        status: result.status,
        latency_ms: result.latency_ms,
        checked_at: result.checked_at,
        target: result.target,
        scan_id: result.scan_id,
      });

      toast.success(`Scan completed: ${result.status} (${result.latency_ms}ms)`);
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({ queryKey: ["asset-scans", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (error as { message?: string })?.message ||
        "Scan failed";
      toast.error(message);
    },
  });

  // Update mutation (name, tags, sensitivity, status) with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({
      field,
      value,
    }: {
      field: keyof Pick<Asset, "tags" | "sensitivity" | "name" | "status">;
      value: Asset[keyof Asset];
    }) => {
      if (field === "tags") {
        return api.updateAsset(assetId!, { tags: value as string[] });
      }
      if (field === "sensitivity") {
        return api.updateAsset(assetId!, { sensitivity: value as Asset["sensitivity"] });
      }
      if (field === "status") {
        return api.updateAsset(assetId!, { status: value as Asset["status"] });
      }
      if (field === "name") {
        return api.updateAsset(assetId!, { name: value as string });
      }
      return api.updateAsset(assetId!, {});
    },
    onMutate: async ({ field, value }) => {
      await queryClient.cancelQueries({ queryKey: ["asset", assetId] });
      const previous = queryClient.getQueryData<Asset>(["asset", assetId]);

      if (previous) {
        const updated: Asset = { ...previous, [field]: value as never };
        queryClient.setQueryData(["asset", assetId], updated);
      }

      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["asset", assetId], context.previous);
      }
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to update asset";
      toast.error(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset updated successfully!");
      setIsEditingTags(false);
      setIsEditingSensitivity(false);
    },
  });

  // Archive/Unarchive with optimistic update + confirm modal
  const archiveMutation = useMutation({
    mutationFn: (status: "active" | "archived") => api.updateAsset(assetId!, { status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ["asset", assetId] });
      const previous = queryClient.getQueryData<Asset>(["asset", assetId]);
      if (previous) {
        queryClient.setQueryData<Asset>(["asset", assetId], { ...previous, status });
      }
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["asset", assetId], context.previous);
      }
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to update status";
      toast.error(message);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(data.status === "archived" ? "Asset archived" : "Asset restored");
    },
  });

  // Tags handlers
  const handleAddTag = () => {
    if (!asset) return;
    const nextTags = addTagCaseInsensitive(asset.tags, tagInput);
    if (nextTags === asset.tags) {
      toast.error("Tag already exists (case-insensitive).");
      return;
    }
    updateMutation.mutate({ field: "tags", value: nextTags });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!asset) return;
    const nextTags = removeTagCaseInsensitive(asset.tags, tag);
    updateMutation.mutate({ field: "tags", value: nextTags });
  };

  const handleUpdateSensitivity = (sensitivity: "low" | "medium" | "high") => {
    updateMutation.mutate({ field: "sensitivity", value: sensitivity });
  };

  const sensitivityColor = useMemo(() => {
    if (!asset) return "";
    return asset.sensitivity === "high"
      ? "text-danger-500 bg-danger-500/20"
      : asset.sensitivity === "medium"
      ? "text-warning-500 bg-warning-500/20"
      : "text-success-500 bg-success-500/20";
  }, [asset]);

  if (assetLoading) {
    return <DetailsSkeleton />;
  }

  if (assetError || !asset) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/catalog")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-danger-500 shrink-0" />
          <div>
            <div className="font-semibold text-danger-500">Asset not found</div>
            <div className="text-sm text-danger-500/80 mt-1">
              This asset may have been deleted or you don't have access to it.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextStatus: "active" | "archived" = asset.status === "active" ? "archived" : "active";

  const scans = unifiedScans ?? [];

  return (
    <div className="space-y-6">
      <Modal
        open={confirmOpen}
        title={nextStatus === "archived" ? "Archive asset?" : "Restore asset?"}
        description={
          nextStatus === "archived"
            ? "This will move the asset out of active catalog views. You can restore it later."
            : "This will restore the asset and make it active again."
        }
        cancelText="Cancel"
        confirmText={nextStatus === "archived" ? "Archive" : "Restore"}
        variant={nextStatus === "archived" ? "danger" : "default"}
        loading={archiveMutation.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          archiveMutation.mutate(confirmNextStatus);
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/catalog")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-brand-500" />
              {asset.name}
            </h1>
            <p className="text-gray-400 mt-1">Asset ID: {asset.id.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => scanConnectivityMutation.mutate()}
            disabled={scanConnectivityMutation.isPending || !assetId}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-500/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Run a quick connectivity scan"
            type="button"
          >
            {scanConnectivityMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Scan Now
              </>
            )}
          </button>

          <button
            onClick={() => {
              setConfirmNextStatus(nextStatus);
              setConfirmOpen(true);
            }}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            type="button"
          >
            <Archive className="w-4 h-4" />
            {asset.status === "active" ? "Archive" : "Restore"}
          </button>
        </div>
      </div>

      {/* Last Connectivity Scan */}
      {lastConnectivityScan && (
        <div
          className={`rounded-xl p-4 border ${
            lastConnectivityScan.status === "Healthy"
              ? "bg-success-500/10 border-success-500/30"
              : "bg-danger-500/10 border-danger-500/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold text-white">
                Last connectivity scan: {lastConnectivityScan.status}
              </div>
              <div className="text-gray-300 mt-1">
                Target: <span className="font-mono text-xs">{lastConnectivityScan.target}</span>
              </div>
              <div className="text-gray-400 mt-1">
                Latency: {lastConnectivityScan.latency_ms}ms •{" "}
                {new Date(lastConnectivityScan.checked_at).toLocaleString()}
              </div>
            </div>

            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["asset-scans", assetId] })}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Refresh history
            </button>
          </div>
        </div>
      )}

      {/* Asset Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
              Type
            </div>
          </div>
          <div className="text-2xl font-bold text-white capitalize">{asset.asset_type}</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
              Sensitivity
            </div>
          </div>
          {isEditingSensitivity ? (
            <div className="flex gap-2 flex-wrap">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleUpdateSensitivity(level)}
                  disabled={updateMutation.isPending}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    asset.sensitivity === level
                      ? "bg-brand-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  type="button"
                >
                  {level}
                </button>
              ))}
              <button
                onClick={() => setIsEditingSensitivity(false)}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold capitalize ${sensitivityColor.split(" ")[0]}`}>
                {asset.sensitivity}
              </span>
              <button
                onClick={() => setIsEditingSensitivity(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                type="button"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
              Status
            </div>
          </div>
          <div
            className={`text-2xl font-bold capitalize ${
              asset.status === "active" ? "text-success-500" : "text-gray-400"
            }`}
          >
            {asset.status}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
              Latest Score
            </div>
          </div>
          {asset.latest_scan_summary ? (
            <div
              className={`text-2xl font-bold ${
                asset.latest_scan_summary.compliance_score >= 80
                  ? "text-success-500"
                  : asset.latest_scan_summary.compliance_score >= 60
                  ? "text-warning-500"
                  : "text-danger-500"
              }`}
            >
              {asset.latest_scan_summary.compliance_score}%
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-500">—</div>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-brand-500" />
            <h2 className="text-xl font-bold text-white">Tags</h2>
          </div>
          {!isEditingTags && (
            <button
              onClick={() => setIsEditingTags(true)}
              className="text-brand-500 hover:text-brand-100 transition-colors flex items-center gap-2"
              type="button"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {asset.tags.map((tag) => (
            <div
              key={tag}
              className="px-3 py-1 bg-brand-500/15 text-brand-100 rounded-lg text-sm flex items-center gap-2 border border-brand-500/20"
            >
              {tag}
              {isEditingTags && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-brand-100/80 hover:text-danger-500 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {asset.tags.length === 0 && <span className="text-gray-500">No tags</span>}
        </div>

        {isEditingTags && (
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim() || updateMutation.isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-500/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              type="button"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsEditingTags(false);
                setTagInput("");
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              type="button"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-500" />
          Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Created At</div>
            <div className="text-white font-medium">{new Date(asset.created_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Last Updated</div>
            <div className="text-white font-medium">{new Date(asset.updated_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Owner</div>
            <div className="text-white font-medium">{asset.owner}</div>
          </div>
          {asset.source_id && (
            <div>
              <div className="text-gray-400 mb-1">Source ID</div>
              <div className="text-white font-medium font-mono text-xs">{asset.source_id}</div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Scan History */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-500" />
            Scan History
          </h2>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["asset-scans", assetId] })}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            type="button"
          >
            Refresh
          </button>
        </div>

        {scansLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <div>No scans found for this asset</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Latency (ms)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Completeness %
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Issue Count
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {scans.map((scan) => {
                  const isConnectivity = scan.scan_type === "connectivity";

                  const statusColor =
                    scan.status === "Healthy" || scan.status === "Compliant"
                      ? "text-success-500"
                      : scan.status === "Unhealthy" || scan.status === "Non-Compliant"
                      ? "text-danger-500"
                      : "text-gray-400";

                  return (
                    <tr key={scan.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-white">
                        <div className="flex items-center gap-2">
                          {isConnectivity ? (
                            <Globe className="w-4 h-4 text-brand-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-brand-500" />
                          )}
                          <span className="font-medium">
                            {isConnectivity ? "Connectivity" : "Metadata"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {(scan.status === "Healthy" || scan.status === "Compliant") && (
                            <CheckCircle2 className="w-4 h-4 text-success-500" />
                          )}
                          {(scan.status === "Unhealthy" || scan.status === "Non-Compliant") && (
                            <AlertCircle className="w-4 h-4 text-danger-500" />
                          )}
                          <span className={`font-semibold ${statusColor}`}>{scan.status}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-300">
                        {scan.latency_ms !== null && scan.latency_ms !== undefined
                          ? `${scan.latency_ms}`
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-300">{scan.method || "—"}</td>

                      <td className="px-6 py-4 text-sm text-gray-300">
                        {scan.completeness_pct !== null && scan.completeness_pct !== undefined
                          ? `${scan.completeness_pct}%`
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-300">
                        {scan.issue_count !== null && scan.issue_count !== undefined
                          ? `${scan.issue_count}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <Link to="/catalog" className="hover:text-white underline">
          Back to catalog
        </Link>
      </div>
    </div>
  );
};

export default CatalogDetailsPage;
