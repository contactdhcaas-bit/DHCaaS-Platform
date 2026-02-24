// C:\Users\Data Health Check Intercafe\frontend\src\lib\analytics.ts

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

export type AnalyticsParams = Record<string, unknown>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function hasGtag(): boolean {
  return typeof window.gtag === "function";
}

function getPageContext() {
  if (!isBrowser()) {
    return {
      page_title: undefined as string | undefined,
      page_location: undefined as string | undefined,
      page_path: undefined as string | undefined,
    };
  }

  return {
    page_title: document.title || undefined,
    page_location: window.location.href || undefined,
    page_path: window.location.pathname + window.location.search + window.location.hash,
  };
}

function mergeParams(base: AnalyticsParams, extra: AnalyticsParams): AnalyticsParams {
  const out: AnalyticsParams = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

/**
 * Send any GA4 event with consistent context params.
 * - Adds page_title and page_location automatically (recommended for SPA + page_view). [web:800]
 * - Adds page_path as a convenience (derived from location). [web:800]
 */
export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!isBrowser()) return;
  if (!hasGtag()) return;

  const ctx = getPageContext();
  const payload = mergeParams(ctx, params);

  window.gtag!("event", eventName, payload);
}

/**
 * SPA helper: manually send page_view when route changes.
 * Use with send_page_view:false in gtag('config', ...). [web:800]
 */
export function trackPageView(params: AnalyticsParams = {}) {
  trackEvent("page_view", params);
}

/**
 * Convenience wrappers with recommended names (optional).
 * These just call trackEvent with extra parameters you provide. [web:620]
 */
export function trackLogin(params: AnalyticsParams = {}) {
  trackEvent("login", params);
}

export function trackSignUp(params: AnalyticsParams = {}) {
  trackEvent("sign_up", params);
}

export function trackGenerateLead(params: AnalyticsParams = {}) {
  trackEvent("generate_lead", params);
}
