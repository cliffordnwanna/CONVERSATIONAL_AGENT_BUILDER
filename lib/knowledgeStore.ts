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
    error?: string;
  };
  addedAt: string;
}

interface KnowledgeSession {
  files: KnowledgeFile[];
  sources: KnowledgeSource[];
  lastUpdated: number;
}

// Session cleanup utilities
export const cleanupOldSessions = (maxAge: number = 24 * 60 * 60 * 1000) => { // 24 hours default
  const now = Date.now();
  const sessionsToDelete: string[] = [];
  
  for (const [sessionId, session] of knowledgeStore.entries()) {
    if (now - session.lastUpdated > maxAge) {
      sessionsToDelete.push(sessionId);
    }
  }
  
  // Delete old sessions
  sessionsToDelete.forEach(sessionId => {
    knowledgeStore.delete(sessionId);
    console.log(`🧹 Cleaned up old session: ${sessionId}`);
  });
  
  return sessionsToDelete.length;
};

export const cleanupAllSessions = () => {
  const sessionCount = knowledgeStore.size;
  knowledgeStore.clear();
  console.log(`🧹 Cleaned up all ${sessionCount} sessions`);
  return sessionCount;
};

// Auto-cleanup on page load (prevents bloat)
export const initializeCleanup = () => {
  // Clean up sessions older than 2 hours on page load
  cleanupOldSessions(2 * 60 * 60 * 1000);
  
  // Also clean up if too many sessions exist
  if (knowledgeStore.size > 50) {
    const sessions = Array.from(knowledgeStore.entries())
      .sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);
    
    // Keep only the 25 most recent sessions
    const toDelete = sessions.slice(0, -25);
    toDelete.forEach(([sessionId]) => {
      knowledgeStore.delete(sessionId);
    });
    
    console.log(`🧹 Cleaned up ${toDelete.length} oldest sessions to prevent bloat`);
  }
};

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
