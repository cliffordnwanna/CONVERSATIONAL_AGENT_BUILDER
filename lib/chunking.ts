export interface UnifiedKnowledge {
  id: string;
  type: "file" | "url" | "text";
  title: string;
  content: string;
  status: "pending" | "completed" | "error";
  url?: string;
  source?: string;
  metadata?: {
    wordCount?: number;
    description?: string;
    lastScraped?: string;
  };
  addedAt: number;
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  if (!Number.isInteger(chunkSize) || !Number.isInteger(overlap) || chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError("Chunk size must be positive and overlap smaller than chunk size");
  }
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize);
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

export function chunkKnowledge(knowledge: UnifiedKnowledge[]): {
  id: string;
  content: string;
  metadata: {
    source: string;
    type: string;
    knowledgeId: string;
  };
}[] {
  const chunks: {
    id: string;
    content: string;
    metadata: {
      source: string;
      type: string;
      knowledgeId: string;
    };
  }[] = [];
  
  knowledge.forEach(item => {
    // Only process completed sources with content (Adjustment 3)
    if (item.status !== "completed" || !item.content.trim()) {
      return;
    }
    
    const textChunks = chunkText(item.content);
    
    textChunks.forEach((chunk, index) => {
      chunks.push({
        id: `${item.id}-chunk-${index}`,
        content: chunk,
        metadata: {
          source: item.source || item.title,
          type: item.type,
          knowledgeId: item.id
        }
      });
    });
  });
  
  return chunks;
}
