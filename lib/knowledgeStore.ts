import { vectorStore, type VectorChunk } from "./vectorStore";

export interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  type: "url" | "text";
  url?: string;
  status: string;
  metadata?: {
    wordCount?: number;
    description?: string;
    lastScraped?: string;
    error?: string;
  };
  addedAt: string;
}

export interface KnowledgeSession {
  files: KnowledgeFile[];
  sources: KnowledgeSource[];
  lastUpdated: number;
}

export const KNOWLEDGE_LIMITS = { items: 20, sessions: 50, characters: 100_000, ttlMs: 10 * 60 * 1000 };

export class KnowledgeStoreError extends Error {
  constructor(message: string, public readonly status = 409) { super(message); }
}

interface IngestionLease { ids: Set<string>; cancelled: boolean; startedAt: number }

declare global {
  var globalKnowledgeStore: Map<string, KnowledgeSession> | undefined;
  var globalKnowledgeIngestions: Map<string, Set<IngestionLease>> | undefined;
}

// Process-local demo storage only: not durable, authenticated, or shared across server instances.
export const knowledgeStore = globalThis.globalKnowledgeStore ??= new Map<string, KnowledgeSession>();
const pendingIngestions = globalThis.globalKnowledgeIngestions ??= new Map<string, Set<IngestionLease>>();

function cancelIngestions(sessionId: string, id?: string): void {
  for (const lease of pendingIngestions.get(sessionId) ?? []) {
    if (id === undefined || lease.ids.has(id)) lease.cancelled = true;
  }
}

export function beginKnowledgeIngestion(sessionId: string, ids: string[]): IngestionLease {
  const pending = pendingIngestions.get(sessionId) ?? new Set<IngestionLease>();
  if (pending.size >= 5 || (!pendingIngestions.has(sessionId) && pendingIngestions.size >= KNOWLEDGE_LIMITS.sessions)) {
    throw new KnowledgeStoreError("Too many knowledge uploads are in progress. Please retry shortly.", 429);
  }
  const lease = { ids: new Set(ids), cancelled: false, startedAt: Date.now() };
  pending.add(lease);
  pendingIngestions.set(sessionId, pending);
  return lease;
}

export function finishKnowledgeIngestion(sessionId: string, lease: IngestionLease): void {
  const pending = pendingIngestions.get(sessionId);
  pending?.delete(lease);
  if (!pending?.size) pendingIngestions.delete(sessionId);
}

export function cleanupOldSessions(maxAge = KNOWLEDGE_LIMITS.ttlMs): number {
  let removed = 0;
  for (const [id, session] of knowledgeStore) {
    if (Date.now() - session.lastUpdated >= maxAge) {
      cancelIngestions(id);
      vectorStore.clear(id);
      knowledgeStore.delete(id);
      removed++;
    }
  }
  return removed;
}

export function cleanupAllSessions(): number {
  const count = knowledgeStore.size;
  for (const id of pendingIngestions.keys()) cancelIngestions(id);
  for (const id of knowledgeStore.keys()) vectorStore.clear(id);
  knowledgeStore.clear();
  return count;
}

export function initializeCleanup(): void {
  cleanupOldSessions();
  const sessions = [...knowledgeStore.entries()].sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);
  for (const [id] of sessions.slice(0, Math.max(0, sessions.length - KNOWLEDGE_LIMITS.sessions))) {
    cancelIngestions(id);
    vectorStore.clear(id);
    knowledgeStore.delete(id);
  }
}

// Reads do not extend TTL; absent knowledge returns undefined without clearing vector-only sessions.
export function getKnowledgeSession(sessionId: string): KnowledgeSession | undefined {
  initializeCleanup();
  return knowledgeStore.get(sessionId);
}

export function assertKnowledgeCapacity(sessionId: string, itemCount: number, characters = 0): void {
  const session = getKnowledgeSession(sessionId);
  if (!session && knowledgeStore.size >= KNOWLEDGE_LIMITS.sessions) {
    throw new KnowledgeStoreError("The demo is at session capacity. Try again after a session expires.", 503);
  }
  if ((session?.files.length ?? 0) + (session?.sources.length ?? 0) + itemCount > KNOWLEDGE_LIMITS.items) {
    throw new KnowledgeStoreError(`A session can contain at most ${KNOWLEDGE_LIMITS.items} knowledge items. Remove some before adding more.`);
  }
  const existingCharacters = [...(session?.files ?? []), ...(session?.sources ?? [])].reduce((sum, item) => sum + item.content.length, 0);
  if (existingCharacters + characters > KNOWLEDGE_LIMITS.characters) {
    throw new KnowledgeStoreError(`Session knowledge is limited to ${KNOWLEDGE_LIMITS.characters.toLocaleString("en-US")} characters. Remove some before adding more.`);
  }
}

export function commitKnowledge(sessionId: string, files: KnowledgeFile[], sources: KnowledgeSource[], chunks: VectorChunk[], lease?: IngestionLease): KnowledgeSession {
  const items = [...files, ...sources];
  assertKnowledgeCapacity(sessionId, items.length, items.reduce((sum, item) => sum + item.content.length, 0));
  if (lease && (lease.cancelled || Date.now() - lease.startedAt >= KNOWLEDGE_LIMITS.ttlMs)) {
    throw new KnowledgeStoreError("Knowledge was cleared or expired while indexing. No items were saved; please retry.");
  }
  const previous = knowledgeStore.get(sessionId);
  const ids = new Set([...(previous?.files ?? []), ...(previous?.sources ?? [])].map(item => item.id));
  for (const item of items) {
    if (ids.has(item.id)) throw new KnowledgeStoreError("A knowledge item with this ID already exists.");
    ids.add(item.id);
  }
  const session: KnowledgeSession = {
    files: [...(previous?.files ?? []), ...files],
    sources: [...(previous?.sources ?? []), ...sources],
    lastUpdated: Date.now(),
  };
  // Both stores publish synchronously, only after every embedding and capacity check succeeds.
  vectorStore.add(sessionId, chunks);
  knowledgeStore.set(sessionId, session);
  return session;
}

export function deleteKnowledge(sessionId: string, id?: string): KnowledgeSession {
  const previous = getKnowledgeSession(sessionId);
  cancelIngestions(sessionId, id);
  if (id === undefined) {
    vectorStore.clear(sessionId);
    knowledgeStore.delete(sessionId);
    return { files: [], sources: [], lastUpdated: Date.now() };
  }
  if (previous) vectorStore.removeSource(sessionId, id);
  else vectorStore.clear(sessionId);
  const session: KnowledgeSession = {
    files: (previous?.files ?? []).filter(file => file.id !== id),
    sources: (previous?.sources ?? []).filter(source => source.id !== id),
    lastUpdated: Date.now(),
  };
  if (previous) knowledgeStore.set(sessionId, session);
  return session;
}
