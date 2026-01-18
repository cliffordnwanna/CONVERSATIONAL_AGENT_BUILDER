interface VectorChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    type: string;
  };
}

class InMemoryVectorStore {
  private vectors: Map<string, VectorChunk[]> = new Map();
  
  // ADD must APPEND, not overwrite (Adjustment 1)
  add(sessionId: string, chunks: VectorChunk[]) {
    const existing = this.vectors.get(sessionId) || [];
    const merged = [...existing, ...chunks];
    this.vectors.set(sessionId, merged);
  }
  
  // Search with semantic similarity
  search(sessionId: string, queryEmbedding: number[], topK = 3): VectorChunk[] {
    const vectors = this.vectors.get(sessionId) || [];
    
    const scored = vectors.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }
  
  // Get all vectors for a session (for debugging)
  getAll(sessionId: string): VectorChunk[] {
    return this.vectors.get(sessionId) || [];
  }
  
  // Clear session (for testing)
  clear(sessionId: string) {
    this.vectors.delete(sessionId);
  }
}

export const vectorStore = new InMemoryVectorStore();
export type { VectorChunk };
