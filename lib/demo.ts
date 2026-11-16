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

export function runtimeMode(): "live" | "demo" {
  return process.env.OPENAI_API_KEY?.trim() ? "live" : "demo";
}
