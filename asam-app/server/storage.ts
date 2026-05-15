import { type User, type InsertUser, type LogEntry } from "@shared/schema";
import { randomUUID } from "crypto";

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Log
  getLogs(): Promise<LogEntry[]>;
  addLog(entry: Omit<LogEntry, "id" | "createdAt" | "expiresAt">): Promise<LogEntry>;
  deleteLog(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private logs: Map<string, LogEntry>;

  constructor() {
    this.users = new Map();
    this.logs = new Map();
    // Sweep expired entries every 10 minutes
    setInterval(() => this.sweepExpired(), 10 * 60 * 1000);
  }

  private sweepExpired() {
    const now = Date.now();
    for (const [id, entry] of this.logs) {
      if (entry.expiresAt <= now) this.logs.delete(id);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLogs(): Promise<LogEntry[]> {
    this.sweepExpired();
    return Array.from(this.logs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async addLog(entry: Omit<LogEntry, "id" | "createdAt" | "expiresAt">): Promise<LogEntry> {
    const now = Date.now();
    const log: LogEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: now,
      expiresAt: now + FORTY_EIGHT_HOURS,
    };
    this.logs.set(log.id, log);
    return log;
  }

  async deleteLog(id: string): Promise<boolean> {
    return this.logs.delete(id);
  }
}

export const storage = new MemStorage();
