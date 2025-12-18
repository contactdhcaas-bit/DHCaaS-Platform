import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getScanJob } from "../services/scans";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Clipboard helpers
async function copyText(text: string) {
  // Preferred modern API (secure contexts + user gesture)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback (older browsers)
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

// CSV helpers (escape commas/quotes/newlines)
function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const mustQuote = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

function toCsvRow(obj: Record<string, unknown>) {
  const headers = Object.keys(obj);
  const values = headers.map((k) => csvEscape(obj[k]));
  return {
    headers: headers.map(csvEscape).join(","),
    row: values.join(","),
  };
}

export const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<"jobId">();
  const { search } = useLocation(); // preserves ?filter=...&q=...

  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);

    getScanJob(jobId)
      .then((data) => {
        if (cancelled) return;
        setJob(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e?.message ?? String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const summary = useMemo(() => {
    if (!job) return null;

    return {
      jobId: job.jobid ?? jobId ?? null,
      filename: job.meta?.filename ?? null,
      status: job.status ?? null,
      uploadedAt: job.meta?.uploadtimestamp ?? null,
      quality: job.qualitymetrics
        ? {
            completeness: job.qualitymetrics.completenessscore ?? null,
            accuracy: job.qualitymetrics.accuracyscore ?? null,
            consistency: job.qualitymetrics.consistencyscore ?? null,
            totalRows: job.qualitymetrics.totalrows ?? null,
            missingValues: job.qualitymetrics.missingvaluescount ?? null,
          }
        : null,
      compliance: job.compliancecheck
        ? {
            piiDetected: !!job.compliancecheck.piidetected,
            gdprRiskLevel: job.compliancecheck.gdprrisklevel ?? null,
            sensitiveFieldsFound: job.compliancecheck.sensitivefieldsfound ?? [],
          }
        : null,
      predictive: job.predictiveanalysis
        ? {
            healthScore: job.predictiveanalysis.healthscore ?? null,
            anomalyDetected: !!job.predictiveanalysis.anomalydetected,
            anomalies: job.predictiveanalysis.anomalies ?? [],
          }
        : null,
      error: job.error ?? null,
    };
  }, [job, jobId]);

  const onDownloadJson = () => {
    if (!job) return;
    const filename = `dhcaas-job-${jobId ?? "unknown"}.json`;
    const blob = new Blob([JSON.stringify(job, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, filename);
  };

  const onDownloadSummary = () => {
    if (!summary) return;
    const filename = `dhcaas-job-${jobId ?? "unknown"}-summary.json`;
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, filename);
  };

  const onDownloadCsvSummary = () => {
    if (!summary) return;

    const flat = {
      jobId: summary.jobId,
      filename: summary.filename,
      status: summary.status,
      uploadedAt: summary.uploadedAt,

      completeness: summary.quality?.completeness ?? "",
      accuracy: summary.quality?.accuracy ?? "",
      consistency: summary.quality?.consistency ?? "",
      totalRows: summary.quality?.totalRows ?? "",
      missingValues: summary.quality?.missingValues ?? "",

      piiDetected: summary.compliance?.piiDetected ?? "",
      gdprRiskLevel: summary.compliance?.gdprRiskLevel ?? "",
      sensitiveFieldsFound: Array.isArray(summary.compliance?.sensitiveFieldsFound)
        ? summary.compliance!.sensitiveFieldsFound.join(" | ")
        : "",

      healthScore: summary.predictive?.healthScore ?? "",
      anomalyDetected: summary.predictive?.anomalyDetected ?? "",
      anomalies: Array.isArray(summary.predictive?.anomalies)
        ? summary.predictive!.anomalies.join(" | ")
        : "",

      error: summary.error ?? "",
    };

    const { headers, row } = toCsvRow(flat);
    const csv = `${headers}\n${row}\n`;

    // Optional BOM for Excel UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=UTF-8" });

    const filename = `dhcaas-job-${jobId ?? "unknown"}-summary.csv`;
    downloadBlob(blob, filename);
  };

  const onCopyLink = async () => {
    try {
      const url = window.location.href;
      await copyText(url);
      setCopyStatus("Copied link!");
      window.setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>
          Job details{jobId ? `: ${jobId}` : ""}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCopyLink}
            className="px-3 py-1.5 rounded-md border text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Copy link
          </button>

          <button
            type="button"
            onClick={onDownloadSummary}
            disabled={!summary || loading}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              !summary || loading
                ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900",
            ].join(" ")}
          >
            Download summary
          </button>

          <button
            type="button"
            onClick={onDownloadCsvSummary}
            disabled={!summary || loading}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              !summary || loading
                ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900",
            ].join(" ")}
          >
            Download CSV
          </button>

          <button
            type="button"
            onClick={onDownloadJson}
            disabled={!job || loading}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              !job || loading
                ? "opacity-50 cursor-not--allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900",
            ].join(" ")}
          >
            Download JSON
          </button>

          <Link to={`/jobs${search}`} className="text-blue-600 hover:underline">
            Back to Jobs
          </Link>
        </div>
      </div>

      {copyStatus && (
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {copyStatus}
        </div>
      )}

      {!jobId && (
        <p style={{ marginTop: 12, color: "#475569" }}>
          Missing jobId in URL.
        </p>
      )}

      {loading && <p style={{ marginTop: 12 }}>Loading...</p>}
      {err && <p style={{ marginTop: 12, color: "#b91c1c" }}>Error: {err}</p>}

      {job && !loading && (
        <div className="mt-3 space-y-3">
          <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
            <div className="text-sm text-slate-500">Filename</div>
            <div className="font-medium">{job.meta?.filename ?? "-"}</div>
          </div>

          <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
            <div className="text-sm text-slate-500">Status</div>
            <div className="font-medium">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  job.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                    : job.status === "failed"
                    ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
                ].join(" ")}
              >
                {job.status ?? "-"}
              </span>
            </div>
          </div>

          <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
            <div className="text-sm text-slate-500">Uploaded</div>
            <div className="font-medium">
              {job.meta?.uploadtimestamp
                ? new Date(job.meta.uploadtimestamp).toLocaleString()
                : "-"}
            </div>
          </div>

          {job.qualitymetrics && (
            <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
              <div className="text-sm text-slate-500 mb-2">Quality metrics</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Completeness
                  </span>
                  <span className="font-medium">
                    {Number(
                      job.qualitymetrics.completenessscore ?? 0
                    ).toLocaleString()}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Accuracy
                  </span>
                  <span className="font-medium">
                    {Number(job.qualitymetrics.accuracyscore ?? 0).toLocaleString()}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Consistency
                  </span>
                  <span className="font-medium">
                    {Number(
                      job.qualitymetrics.consistencyscore ?? 0
                    ).toLocaleString()}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Total rows
                  </span>
                  <span className="font-medium">
                    {Number(job.qualitymetrics.totalrows ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Missing values
                  </span>
                  <span className="font-medium">
                    {Number(
                      job.qualitymetrics.missingvaluescount ?? 0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {job.compliancecheck && (
            <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
              <div className="text-sm text-slate-500 mb-2">Compliance</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    PII detected
                  </span>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      job.compliancecheck.piidetected
                        ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200",
                    ].join(" ")}
                  >
                    {job.compliancecheck.piidetected ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    GDPR risk
                  </span>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      (job.compliancecheck.gdprrisklevel ?? "").toLowerCase() ===
                      "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                        : (job.compliancecheck.gdprrisklevel ?? "").toLowerCase() ===
                          "medium"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                        : (job.compliancecheck.gdprrisklevel ?? "").toLowerCase() ===
                          "low"
                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {job.compliancecheck.gdprrisklevel ?? "-"}
                  </span>
                </div>

                <div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Sensitive fields
                  </div>
                  <div className="font-medium">
                    {(job.compliancecheck.sensitivefieldsfound ?? []).length > 0
                      ? (job.compliancecheck.sensitivefieldsfound as string[]).join(
                          ", "
                        )
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {job.predictiveanalysis && (
            <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
              <div className="text-sm text-slate-500 mb-2">
                Predictive analysis
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Health score
                  </span>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      (job.predictiveanalysis.healthscore ?? 0) >= 85
                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                        : (job.predictiveanalysis.healthscore ?? 0) >= 70
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                        : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
                    ].join(" ")}
                  >
                    {job.predictiveanalysis.healthscore ?? "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Anomaly detected
                  </span>
                  <span className="font-medium">
                    {job.predictiveanalysis.anomalydetected ? "Yes" : "No"}
                  </span>
                </div>

                <div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Anomalies
                  </div>
                  <div className="font-medium">
                    {(job.predictiveanalysis.anomalies ?? []).length > 0
                      ? (job.predictiveanalysis.anomalies as string[]).join(", ")
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {job.error && (
            <div className="rounded border border-red-200 dark:border-red-900 p-3 bg-red-50 dark:bg-red-950/30">
              <div className="text-sm text-red-700 dark:text-red-300">Error</div>
              <div className="font-medium text-red-800 dark:text-red-200">
                {String(job.error)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
