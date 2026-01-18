interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: string;
}

interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  type: 'url' | 'text';
  url?: string;
  status: string;
  metadata?: {
    wordCount?: number;
    description?: string;
    lastScraped?: string;
  };
  addedAt: string;
}

interface KnowledgeSession {
  files: KnowledgeFile[];
  sources: KnowledgeSource[];
  lastUpdated: number;
}

// Create a truly persistent global store
declare global {
  var globalKnowledgeStore: Map<string, KnowledgeSession> | undefined;
}

// Initialize global store if it doesn't exist
if (!global.globalKnowledgeStore) {
  global.globalKnowledgeStore = new Map<string, KnowledgeSession>();
}

export const knowledgeStore = global.globalKnowledgeStore;

export type { KnowledgeFile, KnowledgeSource, KnowledgeSession };
