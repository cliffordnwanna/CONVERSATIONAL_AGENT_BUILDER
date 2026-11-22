const STOP_WORDS = new Set("a an the is are was were be been being to of in on at and or for with i me my you your it its this that these those what which how do does can could please tell about have has we our".split(" "));

export function terms(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

// A deterministic lexical demo, not a replacement for semantic embeddings.
export function demoEmbedding(text: string): number[] {
  const vector = new Array<number>(1024).fill(0);
  for (const term of terms(text)) {
    let hash = 2166136261;
    for (const character of term) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
    vector[(hash >>> 0) % vector.length] += 1;
  }
  return vector;
}

export function lexicalScore(query: string, content: string): number {
  const queryTerms = new Set(terms(query));
  const contentTerms = new Set(terms(content));
  if (!queryTerms.size) return 0;
  return [...queryTerms].filter(term => contentTerms.has(term)).length / queryTerms.size;
}

const DEGRADED_MS = 5 * 60 * 1000;
let degradedUntil = 0;

/** Auth, permission and quota/billing failures mean the configured key cannot be used right now. */
export function isProviderFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { status, code } = error as { status?: unknown; code?: unknown };
  return status === 401 || status === 403 || (status === 429 && code === "insufficient_quota");
}

/** On such a failure, serve from the keyless offline path for a few minutes instead of returning 502. */
export function markProviderDegraded(error: unknown): boolean {
  if (!isProviderFailure(error)) return false;
  degradedUntil = Date.now() + DEGRADED_MS;
  return true;
}

export function providerDegraded(): boolean {
  return Date.now() < degradedUntil;
}

export function resetProviderDegradation() {
  degradedUntil = 0;
}

export function runtimeMode(): "live" | "demo" {
  if (!process.env.OPENAI_API_KEY?.trim() || providerDegraded()) return "demo";
  return "live";
}
