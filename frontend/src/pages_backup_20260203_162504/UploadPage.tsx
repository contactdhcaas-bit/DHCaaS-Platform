// src/pages/UploadPage.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Download,
  X,
  CheckCircle2,
  Loader2,
  Database,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type ScanResults = {
  jobId: string;
  totalFiles: number;
  incidentsFound: number;
  complianceScore: number;
  fileName: string;
  fileSize: string;
  processingTime: string;
  reportUrl: string;
  assetLinked?: boolean;
  assetId?: string;
};

const MAX_FILES = 5;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function makeJobId(): string {
  return `JOB-${Math.floor(Math.random() * 90000) + 10000}`;
}

function track(eventName: string, params: Record<string, unknown> = {}) {
  const w = window as any;
  try {
    if (typeof w.trackEvent === "function") {
      w.trackEvent(eventName, params);
      return;
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...params });
    }
  } catch {
    // no-op
  }
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "csv":
    case "xlsx":
    case "xls":
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    case "json":
      return <FileJson className="w-5 h-5 text-blue-400" />;
    case "sql":
      return <FileCode className="w-5 h-5 text-purple-400" />;
    default:
      return <FileText className="w-5 h-5 text-slate-400" />;
  }
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const scanTimerRef = useRef<number | null>(null);
  const scanStartRef = useRef<number | null>(null);

  const allowedExtensions = useMemo(
    () => new Set(["csv", "xlsx", "xls", "json", "sql"]),
    []
  );

  const clearScanTimer = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const addFilesWithLimit = useCallback(
    (incoming: File[]) => {
      const validFiles = incoming.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        return allowedExtensions.has(ext);
      });

      if (validFiles.length !== incoming.length) {
        toast.error("Some files were skipped (unsupported format).");
      }

      setFiles((prev) => {
        const combined = [...prev, ...validFiles];
        const sliced = combined.slice(0, MAX_FILES);
        if (combined.length > MAX_FILES) {
          toast.error(`Max ${MAX_FILES} files allowed.`);
        }
        return sliced;
      });
    },
    [allowedExtensions]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files || []);
      addFilesWithLimit(droppedFiles);
    },
    [addFilesWithLimit]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length) addFilesWithLimit(selected);
      e.target.value = "";
    },
    [addFilesWithLimit]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetToUpload = useCallback(() => {
    clearScanTimer();
    setScanResults(null);
    setScanProgress(0);
    setScanning(false);
    setFiles([]);
  }, [clearScanTimer]);

  const handleViewReport = useCallback(() => {
    if (!scanResults) return;

    track("report_view_click", { source: "upload", jobId: scanResults.jobId });

    navigate("/reports");
    toast.success("Report available in Reports page");
  }, [navigate, scanResults]);

  const handleViewAsset = useCallback(() => {
    if (!scanResults?.assetId) return;

    track("asset_view_click", { source: "upload", assetId: scanResults.assetId });

    navigate(`/catalog/${scanResults.assetId}`);
  }, [navigate, scanResults]);

  const handleDownloadPdf = useCallback(async () => {
    if (!scanResults) return;

    track("report_download_click", { source: "upload", jobId: scanResults.jobId });

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const url = `http://127.0.0.1:8000/api/reports/summary-report/pdf?token=${encodeURIComponent(
        token
      )}`;

      const link = document.createElement("a");
      link.href = url;
      link.download = `DHCaaS-Report-${scanResults.jobId}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF download started!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download PDF report.");
    }
  }, [scanResults]);

  const handleStartScan = useCallback(async () => {
    if (files.length === 0 || scanning) return;

    setScanning(true);
    setScanProgress(0);
    setScanResults(null);

    track("scan_start", { source: "upload", filesCount: files.length });

    scanStartRef.current = Date.now();

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        setScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", files[0]);

      clearScanTimer();
      scanTimerRef.current = window.setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next >= 90 ? 90 : next;
        });
      }, 400);

      const response = await fetch("http://localhost:8000/api/scans/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearScanTimer();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      setScanProgress(100);
      setScanning(false);

      const processingMs = scanStartRef.current ? Date.now() - scanStartRef.current : 3500;

      const scanId = data.id || makeJobId();

      // Auto-link asset from scan
      let assetLinked = false;
      let assetId: string | undefined;

      try {
        const linkResponse = await api.linkAssetFromScan(scanId);
        assetLinked = true;
        assetId = linkResponse.asset_id;

        if (linkResponse.created) {
          toast.success("Asset created and linked to catalog!");
        } else {
          toast.success("Asset updated in catalog!");
        }

        // Invalidate catalog queries
        await queryClient.invalidateQueries({ queryKey: ["assets"] });
      } catch (linkError) {
        console.error("Asset link failed:", linkError);
        toast("Asset auto-link failed (non-critical)", { icon: "⚠️" });
      }

      const results: ScanResults = {
        jobId: scanId,
        totalFiles: files.length,
        incidentsFound: data.pii_detected?.length || 0,
        complianceScore: data.score || 0,
        fileName: files[0]?.name ?? "unknown",
        fileSize: files[0] ? formatBytes(files[0].size) : "0 B",
        processingTime: `${(processingMs / 1000).toFixed(1)}s`,
        reportUrl: "#",
        assetLinked,
        assetId,
      };

      setScanResults(results);

      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      track("scan_complete", {
        source: "upload",
        jobId: results.jobId,
        complianceScore: results.complianceScore,
        incidentsFound: results.incidentsFound,
        assetLinked,
      });

      toast.success("Compliance scan completed!");
    } catch (error) {
      console.error("Scan error:", error);
      clearScanTimer();
      setScanning(false);
      setScanProgress(0);
      toast.error(error instanceof Error ? error.message : "Scan failed. Please try again.");
    }
  }, [clearScanTimer, files, scanning, queryClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-3 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl border border-violet-500/30">
                <UploadCloud className="w-7 h-7 text-violet-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Quick Scan</h1>
              <p className="text-slate-400 mt-1">Upload files to detect compliance risks and PII exposure</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {!scanResults ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Upload Zone */}
            <div
              className={[
                "relative group bg-white/5 backdrop-blur-md border-2 border-dashed rounded-3xl p-20 text-center transition-all duration-300 cursor-pointer overflow-hidden",
                dragActive
                  ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
                  : "border-violet-500/30 hover:border-violet-500/50 hover:bg-white/10",
              ].join(" ")}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-fuchsia-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <input
                id="file-upload"
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json,.sql"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileSelect}
              />

              <div className="relative z-0">
                {/* Upload Icon */}
                <div className="relative mb-8">
                  <div
                    className={[
                      "mx-auto w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300",
                      dragActive
                        ? "bg-violet-500/20 scale-110"
                        : "bg-white/10 group-hover:bg-violet-500/10 group-hover:scale-105",
                    ].join(" ")}
                  >
                    <UploadCloud
                      className={[
                        "w-12 h-12 transition-colors duration-300",
                        dragActive ? "text-violet-400 animate-bounce" : "text-slate-400 group-hover:text-violet-400",
                      ].join(" ")}
                    />
                  </div>

                  {/* Sparkle Effect */}
                  {dragActive && (
                    <Sparkles className="absolute top-0 right-1/3 w-6 h-6 text-violet-400 animate-pulse" />
                  )}
                </div>

                {/* Text */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {dragActive ? "Drop your files now!" : "Drag & drop your files here"}
                </h3>
                <p className="text-slate-400 mb-2">or click to browse</p>
                <p className="text-sm text-slate-500">
                  Supports <span className="text-violet-400 font-semibold">CSV, JSON, XLSX, SQL</span> • Max 100MB
                </p>

                {/* Supported Formats */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-400">CSV/XLSX</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <FileJson className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-400">JSON</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">SQL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-400" />
                  Selected Files ({files.length}/{MAX_FILES})
                </h4>

                <div className="space-y-3">
                  {files.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* File Icon */}
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file.name)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{file.name}</div>
                          <div className="text-sm text-slate-400">{formatBytes(file.size)}</div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeFile(i);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Progress Bar (shown during scan) */}
                      {scanning && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-2xl overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                            style={{ width: `${scanProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Start Scan Button */}
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="group relative w-full px-8 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Scanning... {Math.round(scanProgress)}%</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-6 h-6" />
                      <span>Start Compliance Scan</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div className="max-w-5xl mx-auto animate-in zoom-in duration-500">
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-violet-600/20 backdrop-blur-md border-b border-white/10 p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"></div>
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      </div>
                      Scan Completed Successfully
                    </h2>
                    <p className="text-slate-400 ml-14">Job ID: {scanResults.jobId}</p>
                    {scanResults.assetLinked && (
                      <p className="text-emerald-400 text-sm ml-14 mt-1 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Asset linked to catalog
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={resetToUpload}
                    className="px-5 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
                  >
                    Upload New File
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
                {/* Compliance Score */}
                <div className="bg-slate-900/50 backdrop-blur-md p-8 text-center group hover:bg-white/5 transition-all">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">
                    {scanResults.complianceScore}%
                  </div>
                  <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                    Compliance Score
                  </div>
                </div>

                {/* Risks Detected */}
                <div className="bg-slate-900/50 backdrop-blur-md p-8 text-center group hover:bg-white/5 transition-all">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-amber-400 mb-2">
                    {scanResults.incidentsFound}
                  </div>
                  <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                    Risks Detected
                  </div>
                </div>

                {/* Files Processed */}
                <div className="bg-slate-900/50 backdrop-blur-md p-8 text-center group hover:bg-white/5 transition-all">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-blue-400 mb-2">
                    {scanResults.totalFiles}
                  </div>
                  <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                    Files Processed
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-8 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Scan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Primary File</div>
                    <div className="text-white font-semibold truncate">{scanResults.fileName}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">File Size</div>
                    <div className="text-white font-semibold">{scanResults.fileSize}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Processing Time</div>
                    <div className="text-white font-semibold">{scanResults.processingTime}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-8 bg-slate-900/30 border-t border-white/10 flex flex-col sm:flex-row justify-center gap-4">
                {scanResults.assetLinked && scanResults.assetId && (
                  <button
                    type="button"
                    onClick={handleViewAsset}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Database className="w-5 h-5" />
                    View in Catalog
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleViewReport}
                  className="px-6 py-3.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  View Detailed Report
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2"
                  disabled={!scanResults}
                >
                  <Download className="w-5 h-5" />
                  Download PDF Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
