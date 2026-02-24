// src/pages/IncidentDetailsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Database,
  Lock,
  Server,
  Activity,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api, {
  BackendIncident,
  BackendIncidentStatus,
  BackendScan,
  IncidentResolutionCode,
  ResolveIncidentPayload,
} from "../lib/api";

type IncidentContext = {
  incident: BackendIncident;
  scan: BackendScan | null;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function severityStyle(severity?: string) {
  const s = (severity || "").toLowerCase();
  if (s === "high" || s === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (s === "medium") return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "low") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function statusStyle(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "resolved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "investigating") return "bg-purple-100 text-purple-700 border-purple-200";
  if (s === "open") return "bg-red-100 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

async function copyToClipboard(value: string, label: string) {
  if (!value) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
      return;
    }

    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);

    if (ok) toast.success(`${label} copied`);
    else toast.error("Copy failed");
  } catch {
    toast.error("Copy failed");
  }
}

function mapApiError(err: any): string {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const msg = detail || err?.message || "Request failed";

  if (status === 401) return "Session expired. Redirecting to login...";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Incident not found.";
  if (status === 409) return String(msg);
  if (status === 422) return String(msg);

  return String(msg);
}

function buildRecommendations(incident: BackendIncident, scan: BackendScan | null): string[] {
  const steps: string[] = [];

  if (scan?.pii_columns_found?.length) {
    steps.push("Mask or encrypt the identified PII columns (at rest and in logs).");
    steps.push("Restrict access to the dataset and review audit trails for unexpected access.");
    steps.push("Re-run a scan after remediation and attach the new report for evidence.");
  } else if (incident.type?.toLowerCase().includes("pii")) {
    steps.push("Identify the PII fields involved and apply masking/encryption.");
    steps.push("Verify that data is not logged in plaintext across services.");
  }

  if (scan?.pii_columns_found?.some((c) => c.toLowerCase().includes("password"))) {
    steps.push("Rotate credentials and ensure passwords are hashed (never stored in plain text).");
  }

  if (steps.length === 0) {
    steps.push("Review incident context and apply the appropriate remediation steps.");
  }

  return steps;
}

const RESOLUTION_CODES: { value: IncidentResolutionCode; label: string }[] = [
  { value: "Fixed", label: "Fixed" },
  { value: "Mitigated", label: "Mitigated" },
  { value: "False Positive", label: "False Positive" },
  { value: "Accepted Risk", label: "Accepted Risk" },
  { value: "Duplicate", label: "Duplicate" },
  { value: "Won't Fix", label: "Won't Fix" },
  { value: "Other", label: "Other" },
];

const MIN_RESOLUTION_NOTE_LEN = 30;

export default function IncidentDetailsPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();

  const [context, setContext] = useState<IncidentContext | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const [actionLoading, setActionLoading] = useState<null | "ack" | "resolve" | "reopen">(null);

  const [resolutionCode, setResolutionCode] = useState<IncidentResolutionCode>("Fixed");
  const [resolutionNote, setResolutionNote] = useState<string>("");

  const requestSeq = useRef(0);

  const incident = context?.incident ?? null;
  const scan = context?.scan ?? null;

  const status: BackendIncidentStatus | null = useMemo(() => incident?.status ?? null, [incident]);

  const isCritical = useMemo(() => {
    const s = (incident?.severity || "").toLowerCase();
    return s === "high" || s === "critical";
  }, [incident]);

  const recommendations = useMemo(() => {
    if (!incident) return [];
    return buildRecommendations(incident, scan);
  }, [incident, scan]);

  const score = scan?.compliance_score ?? null;
  const exposure = scan?.pii_total_exposure ?? null;
  const piiCols = scan?.pii_columns_found ?? [];

  const canAck = status === "open";
  const canResolve = status === "open" || status === "investigating";
  const canReopen = status === "resolved";

  const noteLen = resolutionNote.trim().length;

  const resolveDisabledReason = useMemo(() => {
    if (!canResolve) return "Resolve is only available for Open or Investigating incidents.";
    if (!resolutionCode) return "Resolution code is required.";
    if (noteLen < MIN_RESOLUTION_NOTE_LEN)
      return `Resolution note must be at least ${MIN_RESOLUTION_NOTE_LEN} characters.`;
    return "";
  }, [canResolve, resolutionCode, noteLen]);

  const fetchContext = async () => {
    if (!incidentId) return;

    const mySeq = ++requestSeq.current;

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const data = await api.getIncidentContext(incidentId);

      // Ignore out-of-order responses
      if (mySeq !== requestSeq.current) return;

      setContext(data);

      if (data?.incident?.resolution_code) {
        setResolutionCode(data.incident.resolution_code as IncidentResolutionCode);
      }
      if (data?.incident?.resolution_note) {
        setResolutionNote(data.incident.resolution_note);
      }
    } catch (err: any) {
      if (mySeq !== requestSeq.current) return;

      const statusCode = err?.response?.status;
      const msg = mapApiError(err);

      setContext(null);

      if (statusCode === 404) {
        setNotFound(true);
        setError(msg);
        return;
      }

      // For 401: api.ts interceptor will redirect; we only show a friendly message briefly
      setError(msg);

      // Keep toast for visibility, but rely on on-page error UI + retry
      toast.error(msg);
    } finally {
      if (mySeq !== requestSeq.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      setContext(null);
      setError("Missing incident id.");
      return;
    }

    void fetchContext();

    // Invalidate any in-flight response on unmount
    return () => {
      requestSeq.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const validateResolveInputs = (): { ok: boolean; payload?: ResolveIncidentPayload } => {
    const note = (resolutionNote || "").trim();

    if (!resolutionCode) {
      toast.error("Resolution code is required.");
      return { ok: false };
    }

    if (note.length < MIN_RESOLUTION_NOTE_LEN) {
      toast.error(`Resolution note must be at least ${MIN_RESOLUTION_NOTE_LEN} characters.`);
      return { ok: false };
    }

    return {
      ok: true,
      payload: {
        resolution_code: resolutionCode,
        resolution_note: note,
      },
    };
  };

  const runAction = async (kind: "ack" | "resolve" | "reopen") => {
    if (!incidentId) return;

    if (kind === "ack" && !canAck) {
      toast.error("This incident cannot be acknowledged from the current status.");
      return;
    }
    if (kind === "resolve" && !canResolve) {
      toast.error("This incident cannot be resolved from the current status.");
      return;
    }
    if (kind === "reopen" && !canReopen) {
      toast.error("This incident cannot be reopened from the current status.");
      return;
    }

    setActionLoading(kind);

    try {
      if (kind === "ack") {
        await api.acknowledgeIncident(incidentId);
      }

      if (kind === "resolve") {
        const v = validateResolveInputs();
        if (!v.ok || !v.payload) return;
        await api.resolveIncident(incidentId, v.payload);
      }

      if (kind === "reopen") {
        await api.reopenIncident(incidentId);
      }

      toast.success("Action completed.");
      await fetchContext();
    } catch (err: any) {
      const msg = mapApiError(err);
      toast.error(msg);
      setError(msg);
      // No navigate("/login") here; api.ts handles 401 globally. [web:727]
    } finally {
      setActionLoading(null);
    }
  };

  const goToScan = () => {
    const scanId = incident?.scan_id;
    if (!scanId) {
      toast.error("No scan is linked to this incident.");
      return;
    }
    navigate(`/jobs/${scanId}`);
  };

  const resolvedEvidence = useMemo(() => {
    if (!incident) return null;

    const code = (incident as any).resolution_code as string | undefined;
    const note = (incident as any).resolution_note as string | undefined;
    const by = (incident as any).resolved_by as string | undefined;
    const at = (incident as any).resolved_at as string | undefined;

    if (!code && !note && !by && !at) return null;
    return { code, note, by, at };
  }, [incident]);

  // --- LOADING UI ---
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="font-semibold">Loading incident...</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="h-6 w-2/3 bg-slate-100 rounded mb-4" />
          <div className="h-4 w-full bg-slate-100 rounded mb-2" />
          <div className="h-4 w-5/6 bg-slate-100 rounded mb-2" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // --- MISSING / NOT FOUND / ERROR UI ---
  if (!incidentId) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid link</h2>
          <p className="text-slate-600 mb-6">This page is missing an incident id.</p>
          <button
            onClick={() => navigate("/incidents")}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Incident not found</h2>
          <p className="text-slate-600 mb-6">{error || "The incident does not exist or you no longer have access."}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/incidents")}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
            >
              Back to Incidents
            </button>
            <button
              onClick={fetchContext}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load incident</h2>
          <p className="text-slate-600 mb-6">{error || "An unexpected error occurred."}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/incidents")}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
            >
              Back to Incidents
            </button>
            <button
              onClick={fetchContext}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Incidents
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(incident.id, "Incident ID")}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
            title="Copy incident ID"
          >
            <Copy className="w-4 h-4" />
            Copy ID
          </button>

          <button
            onClick={goToScan}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
            title="Open linked scan"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Scan
          </button>
        </div>
      </div>

      {/* Inline error banner (non-blocking) */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-800">Something went wrong</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
          <button
            onClick={fetchContext}
            className="px-3 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Header Card */}
      <div
        className={`rounded-3xl p-8 border ${
          isCritical ? "bg-red-50 border-red-100" : "bg-white border-slate-200"
        } shadow-sm relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldAlert className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${severityStyle(
                    incident.severity
                  )}`}
                >
                  Severity: {incident.severity}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusStyle(
                    incident.status
                  )}`}
                >
                  Status: {incident.status}
                </span>

                {typeof score === "number" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200">
                    Score: {score}
                  </span>
                )}

                {typeof exposure === "number" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-200">
                    Exposure: {exposure}
                  </span>
                )}

                <span className="text-slate-400 text-sm font-mono">ID: {incident.id}</span>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-2">{incident.type}</h1>
              <p className="text-slate-600 max-w-2xl text-lg">{incident.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <div className="mt-1 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => runAction("ack")}
                  disabled={actionLoading !== null || !canAck}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50"
                  title={
                    canAck ? "Open -> Investigating" : "Acknowledge is available only when the incident is Open."
                  }
                >
                  {actionLoading === "ack" ? "Working..." : "Acknowledge"}
                </button>

                <button
                  onClick={() => runAction("resolve")}
                  disabled={actionLoading !== null || !canResolve || noteLen < MIN_RESOLUTION_NOTE_LEN}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50"
                  title={resolveDisabledReason || "Open/Investigating -> Resolved"}
                >
                  {actionLoading === "resolve" ? "Working..." : "Resolve"}
                </button>

                <button
                  onClick={() => runAction("reopen")}
                  disabled={actionLoading !== null || !canReopen}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50"
                  title={canReopen ? "Resolved -> Open" : "Reopen is available only for Resolved incidents."}
                >
                  {actionLoading === "reopen" ? "Working..." : "Reopen"}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Detected: <span className="font-semibold">{formatDate(incident.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Resolved evidence panel */}
          {incident.status === "resolved" && resolvedEvidence && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
              <h3 className="text-sm font-bold text-emerald-900 mb-3 uppercase tracking-wider">
                Resolution Evidence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-xl border border-emerald-100 p-4">
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Resolved at
                  </div>
                  <div className="font-semibold text-slate-900">{formatDate(resolvedEvidence.at)}</div>
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 p-4">
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Resolved by
                  </div>
                  <div className="font-semibold text-slate-900">{resolvedEvidence.by || "-"}</div>
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 p-4">
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Resolution code
                  </div>
                  <div className="font-semibold text-slate-900">{resolvedEvidence.code || "-"}</div>
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 p-4 md:col-span-2">
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Resolution note
                  </div>
                  <div className="font-medium text-slate-800 whitespace-pre-wrap">
                    {resolvedEvidence.note || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resolution (mandatory on resolve) */}
          {canResolve && (
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                Resolution (required to resolve)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Resolution code</label>
                  <select
                    value={resolutionCode}
                    onChange={(e) => setResolutionCode(e.target.value as IncidentResolutionCode)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {RESOLUTION_CODES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Resolution note</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                    placeholder="Describe what was done, why, and what to do next to prevent recurrence..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Minimum {MIN_RESOLUTION_NOTE_LEN} characters.</span>
                    <span
                      className={
                        noteLen >= MIN_RESOLUTION_NOTE_LEN ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }
                    >
                      {noteLen}/{MIN_RESOLUTION_NOTE_LEN}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PII columns chips */}
          {piiCols.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">PII columns:</span>
              {piiCols.slice(0, 12).map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 rounded-lg text-xs font-semibold border bg-red-50 text-red-700 border-red-200"
                >
                  {c}
                </span>
              ))}
              {piiCols.length > 12 && (
                <span className="px-2 py-1 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
                  +{piiCols.length - 12} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Evidence */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Evidence & Context
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Source System
                </div>
                <div className="font-bold text-slate-900">{incident.source || "-"}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Detected At
                </div>
                <div className="font-bold text-slate-900">{formatDate(incident.created_at)}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Dataset (scan)
                </div>
                <div className="font-bold text-slate-900">{scan?.filename || incident.scan_id || "-"}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(incident.scan_id || "", "Scan ID")}
                    disabled={!incident.scan_id}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Scan ID
                  </button>

                  <button
                    onClick={goToScan}
                    disabled={!incident.scan_id}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Scan
                  </button>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-red-500 text-sm mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Impact (scan rows)
                </div>
                <div className="font-bold text-red-700">{scan?.total_rows ?? 0} Rows</div>
                <div className="text-xs text-red-600 mt-1">Exposure: {scan?.pii_total_exposure ?? 0}</div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                Evidence Snapshot
              </h3>

              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <code className="text-sm font-mono text-emerald-400">
                  {`{`}
                  <br />
                  {`  "incident_id": "${incident.id}",`}
                  <br />
                  {`  "scan_id": "${incident.scan_id || "-"}",`}
                  <br />
                  {`  "filename": "${scan?.filename || "-"}",`}
                  <br />
                  {`  "scan_status": "${scan?.status || "-"}",`}
                  <br />
                  {`  "compliance_score": ${scan?.compliance_score ?? 0},`}
                  <br />
                  {`  "pii_columns_found": ${JSON.stringify(scan?.pii_columns_found ?? [])},`}
                  <br />
                  {`  "pii_total_exposure": ${scan?.pii_total_exposure ?? 0}`}
                  <br />
                  {`}`}
                </code>
              </div>

              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sensitive values are not displayed in the UI.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Remediation */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>

            <h2 className="text-lg font-bold mb-4 relative z-10">Recommended Actions</h2>

            <div className="space-y-3 mb-8 relative z-10">
              {recommendations.map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-indigo-100 text-sm">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/50 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-indigo-400">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>

            <button
              onClick={() => runAction("resolve")}
              disabled={actionLoading !== null || !canResolve || noteLen < MIN_RESOLUTION_NOTE_LEN}
              className="w-full py-4 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2 relative z-10 disabled:opacity-80"
              title={resolveDisabledReason || "Resolve incident"}
            >
              {actionLoading === "resolve" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  Resolve Incident
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Manual Actions</h3>
            <div className="space-y-3">
              <button
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-left"
                onClick={() => toast("Coming soon")}
              >
                Assign to Engineer
              </button>

              <button
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-left"
                onClick={() => toast("Coming soon")}
              >
                Export Forensic Log
              </button>

              <button
                className="w-full py-3 px-4 border border-red-100 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors text-left"
                onClick={() => toast("Coming soon")}
              >
                Mark as False Positive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
