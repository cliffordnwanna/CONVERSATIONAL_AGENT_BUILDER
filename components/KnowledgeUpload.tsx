"use client";

import KnowledgeBaseWorkflow from "@/components/KnowledgeBaseWorkflow";
import type { KnowledgeSource } from "@/lib/browserSession";

export default function KnowledgeUpload({ sessionId, onKnowledgeUpdate }: {
  sessionId: string;
  onKnowledgeUpdate: (sources: KnowledgeSource[]) => void;
}) {
  return <KnowledgeBaseWorkflow sessionId={sessionId} onKnowledgeUpdate={onKnowledgeUpdate} />;
}
