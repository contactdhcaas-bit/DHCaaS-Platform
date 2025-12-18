import React, { useEffect, useMemo, useState } from "react";
import { useScanJobsStore } from "../store/scanJobsStore";
import { healthCheck } from "../services/scans";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function getExt(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New: API test status
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  // New: show Poll only in dev
  const isDev = import.meta.env.DEV;

  const { job, isBusy, error: jobError, startUpload, pollOnce, reset } = useScanJobsStore();

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return { name: file.name, sizeBytes: file.size, ext: getExt(file.name) };
  }, [file]);

  // Auto-poll while job is running/processing
  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" || job.status === "failed") return;

    const t = setInterval(() => {
      pollOnce();
    }, 1200);

    return () => clearInterval(t);
  }, [job?.jobid, job?.status, pollOnce]);

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    setFile(null);

    if (!f) return;

    const ext = getExt(f.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type: ${ext || "unknown"}. Use CSV or Excel.`);
      return;
    }

    setFile(f);
  };

  const onStart = async () => {
    setError(null);
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    await startUpload(file);
  };

  // New: test API reachability through Vite proxy (/api/health)
  const onTestApi = async () => {
    setApiStatus("Checking...");
    try {
      const r = (await healthCheck()) as { status?: string } | null;
      const statusText = r?.status ?? "ok";
      setApiStatus(statusText);
    } catch {
      setApiStatus("failed");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Upload</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Upload a CSV/Excel file to create a scan job (async).
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Select file
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Accepted: {ACCEPTED_EXTENSIONS.join(", ")}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              onChange={onPickFile}
              className="text-sm text-slate-700 dark:text-slate-200"
              accept=".csv,.xlsx,.xls"
            />

            <button
              type="button"
              onClick={onTestApi}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
              disabled={isBusy}
            >
              Test API
            </button>

            <button
              type="button"
              onClick={onStart}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={!file || isBusy}
            >
              Start scan
            </button>
          </div>
        </div>

        {apiStatus && (
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            API: {apiStatus}
          </div>
        )}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {fileInfo && (
          <div className="mt-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="font-medium">Selected file</div>
            <ul className="mt-2 space-y-1">
              <li>Name: {fileInfo.name}</li>
              <li>Extension: {fileInfo.ext}</li>
              <li>Size (bytes): {fileInfo.sizeBytes}</li>
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Job status
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {job ? job.status : "Not started."}
            </div>
            {jobError && <div className="mt-2 text-sm text-red-600">{jobError}</div>}
          </div>

          <div className="flex items-center gap-2">
            {isDev && (
              <button
                type="button"
                onClick={pollOnce}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                disabled={!job || isBusy}
              >
                Poll
              </button>
            )}

            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
              disabled={isBusy}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Results</div>

        {!job?.qualitymetrics ? (
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">No results yet.</div>
        ) : (
          <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 space-y-3">
            <div>
              <div className="font-medium">Quality metrics</div>
              <ul className="mt-2 space-y-1">
                <li>Total rows: {job.qualitymetrics.totalrows}</li>
                <li>Missing values: {job.qualitymetrics.missingvaluescount}</li>
                <li>Completeness: {job.qualitymetrics.completenessscore}</li>
                <li>Accuracy: {job.qualitymetrics.accuracyscore}</li>
                <li>Consistency: {job.qualitymetrics.consistencyscore}</li>
              </ul>
            </div>

            {job.compliancecheck && (
              <div>
                <div className="font-medium">Compliance</div>
                <ul className="mt-2 space-y-1">
                  <li>PII detected: {String(job.compliancecheck.piidetected)}</li>
                  <li>Risk level: {job.compliancecheck.gdprrisklevel}</li>
                  <li>
                    Fields: {job.compliancecheck.sensitivefieldsfound.join(", ") || "-"}
                  </li>
                </ul>
              </div>
            )}

            {job.predictiveanalysis && (
              <div>
                <div className="font-medium">Predictive</div>
                <ul className="mt-2 space-y-1">
                  <li>Health score: {job.predictiveanalysis.healthscore}</li>
                  <li>
                    Anomaly detected: {String(job.predictiveanalysis.anomalydetected)}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
