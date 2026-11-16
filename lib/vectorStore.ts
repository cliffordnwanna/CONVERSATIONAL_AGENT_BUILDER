export interface VectorChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    type: string;
    knowledgeId: string;
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return 0;
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const norm = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0)) *
    Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return norm ? dot / norm : 0;
}

export class InMemoryVectorStore {
  private vectors = new Map<string, VectorChunk[]>();

  add(sessionId: string, chunks: VectorChunk[]) {
    if (chunks.some(chunk => !chunk.embedding?.length || !chunk.embedding.every(Number.isFinite))) {
      throw new Error("Invalid embedding: knowledge was not saved");
    }
    const merged = new Map((this.vectors.get(sessionId) || []).map(chunk => [chunk.id, chunk]));
    for (const chunk of chunks) merged.set(chunk.id, chunk);
    this.vectors.set(sessionId, [...merged.values()]);
  }

  search(sessionId: string, queryEmbedding: number[], topK = 3, knowledgeIds?: string[], minScore = 0.2) {
    if (!Number.isInteger(topK) || topK < 1) return [];
    const selected = knowledgeIds ? new Set(knowledgeIds) : undefined;
    return (this.vectors.get(sessionId) || [])
      .filter(chunk => !selected || selected.has(chunk.metadata.knowledgeId))
      .map(chunk => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
      .filter(chunk => chunk.score > 0 && chunk.score >= minScore)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, topK);
  }

  getAll(sessionId: string): VectorChunk[] {
    return this.vectors.get(sessionId) || [];
  }

  removeSource(sessionId: string, knowledgeId: string) {
    this.vectors.set(sessionId, this.getAll(sessionId).filter(chunk => chunk.metadata.knowledgeId !== knowledgeId));
  }

  clear(sessionId: string) {
    this.vectors.delete(sessionId);
  }
}

export const vectorStore = new InMemoryVectorStore();
