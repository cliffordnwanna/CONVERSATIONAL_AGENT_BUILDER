"use client";

export interface AgentConfig {
  name: string;
  useCase: "faq" | "sales";
  tone: "professional" | "friendly" | "direct";
  goal: string;
  industry: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  type: "text" | "url" | "file";
  source?: string;
  localOnly?: boolean;
}

export interface SourceChunk {
  source: string;
  preview: string;
  knowledgeId: string;
  id?: string;
  score?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  messageId?: string;
  chunks?: SourceChunk[];
  usedKnowledge?: boolean;
  retrievalMode?: "semantic" | "lexical" | "inline" | "none";
  mode?: "demo" | "live";
  feedback?: "up" | "down" | null;
}

export interface SessionAnalytics {
  conversations: number;
  messages: number;
  thumbsUp: number;
  thumbsDown: number;
  avgResponseTime: number;
  knowledgeUsage: number;
  totalTokens: number;
  estimatedCostUsd: number;
  remainingMessages: number;
  expiresAt: string | number | null;
}

export interface HealthStatus {
  mode: "demo" | "live";
  degraded?: boolean;
  storage: "memory";
  messageLimit: number;
  sessionTtlMinutes: number;
}

export const DEFAULT_CONFIG: AgentConfig = {
  name: "Atlas Assistant",
  useCase: "faq",
  tone: "friendly",
  goal: "Answer questions using the supplied knowledge and acknowledge missing information.",
  industry: "",
};

export const SAMPLE_KNOWLEDGE = "Atlas Studio — fictional demo company\n\nAtlas Studio is a fictional coworking space. Day passes cost $20 and include Wi-Fi, a desk, and complimentary tea. Opening hours are Monday to Friday, 9:00 AM to 6:00 PM. Meeting rooms can be booked for $15 per hour. Cancellation policy: cancel a day pass at least 24 hours before arrival for a full refund. Later cancellations are not refundable. For accessibility arrangements, contact hello@example.test. These details are sample data, not a real business offer.";

const PREFIX = "agentforge-demo-v1";
let fallbackSessionId = "";
const memory = new Map<string, string>();

export function getBrowserSession(): { id: string; persistent: boolean } {
  try {
    const key = `${PREFIX}:session`;
    const stored = localStorage.getItem(key);
    const id = stored && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)
      ? stored : (fallbackSessionId || crypto.randomUUID());
    localStorage.setItem(key, id);
    fallbackSessionId = id;
    return { id, persistent: true };
  } catch {
    fallbackSessionId ||= crypto.randomUUID();
    return { id: fallbackSessionId, persistent: false };
  }
}

export function readBrowserData<T>(sessionId: string, name: string, fallback: T): T {
  const key = `${PREFIX}:${sessionId}:${name}`;
  try {
    const value = memory.get(key) ?? localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    const value = memory.get(key);
    return value ? JSON.parse(value) as T : fallback;
  }
}

export function writeBrowserData(sessionId: string, name: string, value: unknown): boolean {
  const key = `${PREFIX}:${sessionId}:${name}`;
  const serialized = JSON.stringify(value);
  memory.set(key, serialized);
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(60000);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", signal });
  } catch (error) {
    if (timeout.aborted) throw new Error("The request timed out. Please retry; server state may need refreshing.");
    if (init?.signal?.aborted) throw error;
    throw new Error("Could not reach the server. Check your connection and retry.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The server returned an unreadable response (${response.status}). Please retry.`);
  }
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Request failed (${response.status}). Please retry.`);
  }
  return data as T;
}

export function readConfig(sessionId: string, template = ""): AgentConfig {
  const saved = readBrowserData<Partial<AgentConfig>>(sessionId, "config", {});
  const config = { ...DEFAULT_CONFIG, ...saved };
  return {
    name: typeof config.name === "string" ? config.name.slice(0, 80) : DEFAULT_CONFIG.name,
    useCase: template ? (template === "sales" ? "sales" : "faq") : config.useCase === "sales" ? "sales" : "faq",
    tone: ["professional", "friendly", "direct"].includes(config.tone) ? config.tone : "friendly",
    goal: typeof config.goal === "string" ? config.goal.slice(0, 500) : DEFAULT_CONFIG.goal,
    industry: typeof config.industry === "string" ? config.industry.slice(0, 100) : "",
  };
}
