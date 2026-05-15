/**
 * Vercel Serverless — /api/log
 *
 * GET    /api/log          → return all non-expired entries
 * POST   /api/log          → create a new entry
 * DELETE /api/log?id=xxx   → delete a specific entry
 *
 * NOTE: Vercel serverless functions are stateless — the in-memory store
 * resets on each cold start. This is acceptable for a session-based
 * workflow where entries are only needed for the current working session.
 * For true persistence, swap the Map for a database (e.g. Vercel KV).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";

const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface LogEntry {
  id: string;
  createdAt: number;
  expiresAt: number;
  patientDescriptor: string;
  levelOfCare: string;
  chartNarrative: string;
  p2pScript: string;
  clarifyingQuestions: string;
  psychEvalNote: string;
  biopsychosocialFormulation: string;
}

// Module-level store — shared within a single warm serverless instance.
// Each cold start resets this; that's expected behavior.
const store = new Map<string, LogEntry>();

function sweep() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers — allow requests from any origin (the app calls its own API)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  sweep();

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const now = Date.now();
    const logs = [...store.values()]
      .filter((e) => e.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
    return res.json(logs);
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const {
      patientDescriptor,
      levelOfCare,
      chartNarrative,
      p2pScript,
      clarifyingQuestions,
      psychEvalNote,
      biopsychosocialFormulation,
    } = req.body ?? {};

    if (!chartNarrative && !p2pScript) {
      return res.status(400).json({ error: "No output to log" });
    }

    const now = Date.now();
    const entry: LogEntry = {
      id: randomUUID(),
      createdAt: now,
      expiresAt: now + TTL_MS,
      patientDescriptor: patientDescriptor ?? "",
      levelOfCare: levelOfCare ?? "",
      chartNarrative: chartNarrative ?? "",
      p2pScript: p2pScript ?? "",
      clarifyingQuestions: clarifyingQuestions ?? "",
      psychEvalNote: psychEvalNote ?? "",
      biopsychosocialFormulation: biopsychosocialFormulation ?? "",
    };
    store.set(entry.id, entry);
    return res.json(entry);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = req.query.id as string | undefined;
    if (!id) {
      return res.status(400).json({ error: "Missing ?id= query parameter" });
    }
    const existed = store.delete(id);
    if (!existed) {
      // Already gone (expired or never existed) — treat as success
      return res.json({ ok: true });
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
