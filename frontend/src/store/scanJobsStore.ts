import { create } from "zustand";
import type { ScanJob } from "../types/scanJob";
import { createScanJob, uploadToPresignedUrl, getScanJob } from "../services/scans";

type ScanJobsState = {
  job: ScanJob | null;
  uploadUrl: string | null;
  isBusy: boolean;
  error: string | null;

  startUpload: (file: File) => Promise<void>;
  pollOnce: () => Promise<void>;
  reset: () => void;
};

export const useScanJobsStore = create<ScanJobsState>((set, get) => ({
  job: null,
  uploadUrl: null,
  isBusy: false,
  error: null,

  reset: () => set({ job: null, uploadUrl: null, isBusy: false, error: null }),

  startUpload: async (file: File) => {
    set({ isBusy: true, error: null });

    try {
      const { job, uploadUrl } = await createScanJob({
        filename: file.name,
        filesizebytes: file.size,
      });

      set({ job, uploadUrl });

      await uploadToPresignedUrl(uploadUrl, file);

      const updated = await getScanJob(job.jobid);
      set({ job: updated });
    } catch (e: any) {
      set({ error: e?.message ?? "Upload failed", isBusy: false });
      return;
    }

    set({ isBusy: false });
  },

  pollOnce: async () => {
    const jobId = get().job?.jobid;
    if (!jobId) return;

    set({ isBusy: true, error: null });
    try {
      const updated = await getScanJob(jobId);
      set({ job: updated });
    } catch (e: any) {
      set({ error: e?.message ?? "Polling failed" });
    } finally {
      set({ isBusy: false });
    }
  },
}));
