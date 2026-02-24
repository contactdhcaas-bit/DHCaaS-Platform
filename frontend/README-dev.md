# DHCaaS Frontend - Dev Notes

## API client configuration

- HTTP client file: `src/lib/apiClient.ts`
- Base URL comes from environment variable:
  - `VITE_API_BASE_URL` (defined in `.env` or `.env.local`)
- Default fallback in development:
  - `http://127.0.0.1:9000`
- To switch environments:
  - Dev: `VITE_API_BASE_URL=http://127.0.0.1:9000`
  - Staging/Prod: set to API Gateway URL (e.g. `https://api.dhcaas.com`)

## Scan jobs listing (`listScanJobs`)

- File: `src/services/scans.ts`
- Current behavior:
  - `listScanJobs()` returns mock data (3 jobs) for Incidents testing.
- Real API version is already implemented but commented out:
  - When `/scan-jobs` backend is ready:
    1. Enable the real `listScanJobs` implementation (Axios GET on `/scan-jobs` with `limit` and `offset` params).
    2. Remove the mock implementation.
- Incidents UI does not need any change when switching from mock to real API.
