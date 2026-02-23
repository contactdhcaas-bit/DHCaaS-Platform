import express, { Request, Response, NextFunction } from "express";

const app = express();
const PORT = 8000;

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PATCH, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") res.sendStatus(200);
  else next();
});

export type IncidentStatus = "open" | "acknowledged" | "resolved";

export type IncidentRecord = {
  jobId: string;
  status: IncidentStatus;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
};

const incidents = new Map<string, IncidentRecord>();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Incidents API is running" });
});

app.get("/incidents", (req: Request, res: Response) => {
  const items = Array.from(incidents.values());
  res.json({ items });
});

app.patch("/incidents/:jobId", (req: Request, res: Response) => {
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

app.listen(PORT, () => {
  console.log(`Incidents API listening on http://localhost:${PORT}`);
});
