export const MESSAGE_LIMIT = 6;
export const SESSION_TTL = 10 * 60 * 1000;
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Feedback = "up" | "down" | null;
export type Session = {
  messages: ChatMessage[];
  turns: { id: string; feedback: Feedback; usedKnowledge: boolean; durationMs: number; promptTokens: number; completionTokens: number }[];
  lastActive: number;
  inFlight: boolean;
};

const STORE = new Map<string, Session>();

export function getSession(id: string, now = Date.now()): Session {
  for (const [key, session] of STORE) {
    if (!session.inFlight && now - session.lastActive >= SESSION_TTL) STORE.delete(key);
  }
  const existing = STORE.get(id);
  if (existing) return existing;
  if (STORE.size >= 500) {
    const oldest = [...STORE].filter(([, session]) => !session.inFlight).sort((a, b) => a[1].lastActive - b[1].lastActive)[0];
    if (!oldest) throw new Error("Session capacity reached");
    STORE.delete(oldest[0]);
  }
  const fresh: Session = { messages: [], turns: [], lastActive: now, inFlight: false };
  STORE.set(id, fresh);
  return fresh;
}

export function sessionAnalytics(session: Session) {
  const turns = session.turns;
  const promptTokens = turns.reduce((sum, turn) => sum + turn.promptTokens, 0);
  const completionTokens = turns.reduce((sum, turn) => sum + turn.completionTokens, 0);
  return {
    conversations: turns.length ? 1 : 0,
    messages: turns.length,
    thumbsUp: turns.filter(turn => turn.feedback === "up").length,
    thumbsDown: turns.filter(turn => turn.feedback === "down").length,
    avgResponseTime: turns.length ? turns.reduce((sum, turn) => sum + turn.durationMs, 0) / turns.length / 1000 : 0,
    knowledgeUsage: turns.length ? 100 * turns.filter(turn => turn.usedKnowledge).length / turns.length : 0,
    totalTokens: promptTokens + completionTokens,
    // Indicative GPT-4o-mini text token rates; excludes embeddings and infrastructure.
    estimatedCostUsd: (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000,
    remainingMessages: Math.max(0, MESSAGE_LIMIT - turns.length),
    expiresAt: session.lastActive + SESSION_TTL,
  };
}
