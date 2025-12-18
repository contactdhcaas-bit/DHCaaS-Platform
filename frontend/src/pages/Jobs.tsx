import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { listScanJobs, type ListScanJobsResponse } from "../services/scans";
import type { ScanJob } from "../types/scanJob";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

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

function normalizeFilter(v: string | null): "all" | "high" | "pii" | "failed" {
  if (v === "high" || v === "pii" || v === "failed" || v === "all") return v;
  return "all";
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export const JobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search } = useLocation(); // preserve filter/q/page when going to details

  const [data, setData] = useState<ListScanJobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const LIMIT = 20;

  // UI state
  const [filter, setFilter] = useState<"all" | "high" | "pii" | "failed">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // URL -> state (Back/Forward + manual URL edits)
  useEffect(() => {
    const nextFilter = normalizeFilter(searchParams.get("filter"));
    const nextQ = searchParams.get("q") || "";

    const rawPage = Number(searchParams.get("page") || "1");
    const nextPage = clampInt(rawPage, 1, Number.MAX_SAFE_INTEGER);

    setFilter((prev) => (prev === nextFilter ? prev : nextFilter));
    setQ((prev) => (prev === nextQ ? prev : nextQ));
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [searchParams]);

  const offset = useMemo(() => (page - 1) * LIMIT, [page]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // FIX: listScanJobs takes (limit, offset) not an object
      const res = await listScanJobs(LIMIT, offset);
      setData(res);

      // Clamp page if user manually set page beyond total pages
      const totalPages = Math.max(1, Math.ceil((res.total ?? 0) / LIMIT));
      if (page > totalPages) {
        setPage(totalPages);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [LIMIT, offset, page]);

  useEffect(() => {
    load();
  }, [load]);

  // state -> URL (keep shareable link)
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);

        // filter
        if (filter && filter !== "all") params.set("filter", filter);
        else params.delete("filter");

        // q
        const trimmed = q.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");

        // page
        if (page && page !== 1) params.set("page", String(page));
        else params.delete("page");

        return params;
      },
      { replace: true }
    );
  }, [filter, q, page, setSearchParams]);

  // Auto-refresh only while there are unfinished jobs
  useEffect(() => {
    const hasUnfinished = (data?.items ?? []).some(
      (j: ScanJob) => j.status !== "completed" && j.status !== "failed"
    );
    if (!hasUnfinished) return;

    const id = window.setInterval(() => {
      load();
    }, 3000);

    return () => window.clearInterval(id);
  }, [data, load]);

  // When filter/q changes from UI, reset to page 1
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q]);

  const visibleItems = useMemo(() => {
    let items: ScanJob[] = data?.items ?? [];

    // 1) Filter
    if (filter === "failed") items = items.filter((j: ScanJob) => j.status === "failed");

    if (filter === "pii") items = items.filter((j: ScanJob) => j.compliancecheck?.piidetected);

    if (filter === "high")
      items = items.filter(
        (j: ScanJob) => (j.compliancecheck?.gdprrisklevel ?? "").toLowerCase() === "high"
      );

    // 2) Search (case-insensitive)
    const qq = q.trim().toLowerCase();
    if (qq.length > 0) {
      items = items.filter((j: ScanJob) => {
        const jobId = (j.jobid ?? "").toLowerCase();
        const filename = (j.meta?.filename ?? "").toLowerCase();
        return jobId.includes(qq) || filename.includes(qq);
      });
    }

    return items;
  }, [data, filter, q]);

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    return Math.max(1, Math.ceil(total / LIMIT));
  }, [data?.total]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

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

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Jobs</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            type="button"
          >
            Refresh
          </button>

          <button
            onClick={onCopyLink}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            type="button"
          >
            Copy link
          </button>

          <Link
            to="/upload"
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
          >
            New scan
          </Link>
        </div>
      </div>

      {copyStatus && <div className="text-sm text-slate-600 dark:text-slate-300">{copyStatus}</div>}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              filter === "all"
                ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
            ].join(" ")}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter("high")}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              filter === "high"
                ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
            ].join(" ")}
          >
            High risk
          </button>

          <button
            type="button"
            onClick={() => setFilter("pii")}
            className={[
              "px-3 py--1.5 rounded-md border text-sm",
              filter === "pii"
                ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
            ].join(" ")}
          >
            PII
          </button>

          <button
            type="button"
            onClick={() => setFilter("failed")}
            className={[
              "px-3 py-1.5 rounded-md border text-sm",
              filter === "failed"
                ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
            ].join(" ")}
          >
            Failed
          </button>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-300">
          Page {page} / {totalPages} (Total: {data?.total ?? 0})
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Job ID or filename…"
            className="w-full sm:w-96 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />

          {q.trim() !== "" && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className={[
              "px-3 py-2 rounded-md border text-sm",
              !canPrev
                ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            Prev
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className={[
              "px-3 py-2 rounded-md border text-sm",
              !canNext
                ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            Next
          </button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-slate-600 dark:text-slate-300">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!isLoading && !error && data && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr className="text-left">
                <th className="p-3">Job ID</th>
                <th className="p-3">File</th>
                <th className="p-3">Status</th>
                <th className="p-3">PII</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Health</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3">Open</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-600 dark:text-slate-300" colSpan={8}>
                    No jobs match this filter/search.
                  </td>
                </tr>
              ) : (
                visibleItems.map((j: ScanJob) => (
                  <tr
                    key={j.jobid}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="p-3 font-mono text-xs">{j.jobid}</td>
                    <td className="p-3">{j.meta.filename}</td>

                    <td className="p-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          j.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                            : j.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
                        ].join(" ")}
                      >
                        {j.status}
                      </span>
                    </td>

                    <td className="p-3">
                      {j.compliancecheck?.piidetected === undefined ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            j.compliancecheck.piidetected
                              ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200",
                          ].join(" ")}
                        >
                          {j.compliancecheck.piidetected ? "Yes" : "No"}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {j.compliancecheck?.gdprrisklevel ? (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            j.compliancecheck.gdprrisklevel.toLowerCase() === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                              : j.compliancecheck.gdprrisklevel.toLowerCase() === "medium"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                                : j.compliancecheck.gdprrisklevel.toLowerCase() === "low"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
                          ].join(" ")}
                        >
                          {j.compliancecheck.gdprrisklevel}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="p-3">
                      {j.predictiveanalysis?.healthscore === undefined ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            (j.predictiveanalysis.healthscore ?? 0) >= 85
                              ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                              : (j.predictiveanalysis.healthscore ?? 0) >= 70
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
                          ].join(" ")}
                        >
                          {j.predictiveanalysis.healthscore}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {j.meta?.uploadtimestamp
                        ? new Date(j.meta.uploadtimestamp).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      <Link
                        to={`/jobs/${encodeURIComponent(j.jobid)}${search}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
