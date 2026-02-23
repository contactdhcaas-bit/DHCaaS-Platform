import type { Request, Response, Router } from "express";
import express from "express";

export type IncidentStatus = "open" | "acknowledged" | "resolved";

export type IncidentRecord = {
  jobId: string;
  status: IncidentStatus;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
};

// in-memory store for MVP
const incidents = new Map<string, IncidentRecord>();

const router: Router = express.Router();

// GET /incidents
router.get("/", (req: Request, res: Response) => {
  res.json({
    items: Array.from(incidents.values()),
  });
});

// PATCH /incidents/:jobId
router.patch("/:jobId", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { status, owner } = req.body as {
    status?: IncidentStatus;
    owner?: string | null;
  };

  if (status && !["open", "acknowledged", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const now = new Date().toISOString();
  const existing = incidents.get(jobId);

  const next: IncidentRecord = {
    jobId,
    status: status ?? existing?.status ?? "open",
    owner: owner ?? existing?.owner ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  incidents.set(jobId, next);
  res.json(next);
});

export default router;
