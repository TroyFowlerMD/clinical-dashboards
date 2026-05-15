import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/log — return all non-expired log entries (newest first)
  app.get("/api/log", async (_req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  // POST /api/log — save a new log entry
  app.post("/api/log", async (req, res) => {
    const { patientDescriptor, levelOfCare, chartNarrative, p2pScript, clarifyingQuestions, psychEvalNote, biopsychosocialFormulation } = req.body;
    if (!chartNarrative && !p2pScript) {
      return res.status(400).json({ error: "No output to log" });
    }
    const entry = await storage.addLog({
      patientDescriptor: patientDescriptor ?? "",
      levelOfCare: levelOfCare ?? "",
      chartNarrative: chartNarrative ?? "",
      p2pScript: p2pScript ?? "",
      clarifyingQuestions: clarifyingQuestions ?? "",
      psychEvalNote: psychEvalNote ?? "",
      biopsychosocialFormulation: biopsychosocialFormulation ?? "",
    });
    res.json(entry);
  });

  // DELETE /api/log/:id — remove a single entry
  app.delete("/api/log/:id", async (req, res) => {
    const deleted = await storage.deleteLog(req.params.id);
    res.json({ deleted });
  });

  return httpServer;
}
