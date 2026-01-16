type Session = {
  messages: { role: "user" | "assistant"; content: string }[];
  conversations: number;
  thumbsUp: number;
  thumbsDown: number;
  lastActive: number;
};

const STORE = new Map<string, Session>();
const TTL = 10 * 60 * 1000;

export function getSession(id: string): Session {
  const now = Date.now();
  const existing = STORE.get(id);

  if (!existing || now - existing.lastActive > TTL) {
    const fresh: Session = {
      messages: [],
      conversations: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      lastActive: now,
    };
    STORE.set(id, fresh);
    return fresh;
  }

  existing.lastActive = now;
  return existing;
}
