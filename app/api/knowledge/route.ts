import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import * as pdf from "pdf-parse";

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
  metadata?: any;
  addedAt: string;
}

interface KnowledgeSession {
  files: KnowledgeFile[];
  sources: KnowledgeSource[];
  lastUpdated: number;
}

// In-memory knowledge store (in production, use vector DB like Pinecone)
const knowledgeStore = new Map<string, KnowledgeSession>();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const files = formData.getAll("files") as File[];
    const pastedText = formData.get("pastedText") as string;
    
    const processedFiles: KnowledgeFile[] = [];
    
    // Process uploaded files
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      let content = "";
      const fileType = file.type;
      
      if (fileType === "application/pdf") {
        try {
          const pdfData = await (pdf as any)(buffer);
          content = pdfData.text;
        } catch (error) {
          console.error("PDF parsing error:", error);
          content = "Error parsing PDF file";
        }
      } else if (fileType === "text/plain" || file.name.endsWith(".txt")) {
        content = buffer.toString("utf-8");
      } else if (fileType.includes("word") || file.name.endsWith(".docx")) {
        // For DOCX, we'd need a library like mammoth
        content = "DOCX file uploaded. Text extraction requires additional processing.";
      } else {
        content = buffer.toString("utf-8");
      }
      
      const knowledgeFile: KnowledgeFile = {
        id: crypto.randomUUID(),
        name: file.name,
        content: content.substring(0, 10000), // Limit content size
        type: fileType,
        uploadedAt: new Date().toISOString(),
      };
      
      processedFiles.push(knowledgeFile);
    }
    
    // Process pasted text
    if (pastedText) {
      const knowledgeFile: KnowledgeFile = {
        id: crypto.randomUUID(),
        name: "Pasted Text",
        content: pastedText.substring(0, 10000),
        type: "text/plain",
        uploadedAt: new Date().toISOString(),
      };
      
      processedFiles.push(knowledgeFile);
    }
    
    // Store in session knowledge base
    const existingSession = knowledgeStore.get(sessionId);
    const currentFiles = existingSession ? existingSession.files : [];
    const currentSources = existingSession ? existingSession.sources : [];
    
    // Limit to 5 files per session to control costs
    const updatedFiles = [...currentFiles, ...processedFiles].slice(0, 5);
    
    const updatedSession: KnowledgeSession = {
      files: updatedFiles,
      sources: currentSources,
      lastUpdated: Date.now(),
    };
    
    knowledgeStore.set(sessionId, updatedSession);
    
    return NextResponse.json({
      success: true,
      files: updatedFiles,
      message: `Successfully processed ${processedFiles.length} items`,
    });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process files" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url || '');
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  const session = knowledgeStore.get(sessionId) || {
    files: [],
    sources: [],
    lastUpdated: Date.now(),
  };

  // Return both files and sources in the format expected by chat API
  return NextResponse.json({
    files: session.files,
    sources: session.sources,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, source } = await req.json();

    if (!sessionId || !source) {
      return NextResponse.json(
        { error: 'Session ID and source data required' },
        { status: 400 }
      );
    }

    const existingSession = knowledgeStore.get(sessionId) || {
      files: [],
      sources: [],
      lastUpdated: Date.now(),
    };

    const newSource: KnowledgeSource = {
      id: source.id,
      title: source.title,
      content: source.content,
      type: source.type,
      url: source.url,
      status: source.status,
      metadata: source.metadata,
      addedAt: new Date().toISOString(),
    };

    const updatedSession: KnowledgeSession = {
      ...existingSession,
      sources: [...existingSession.sources, newSource],
      lastUpdated: Date.now(),
    };

    knowledgeStore.set(sessionId, updatedSession);

    return NextResponse.json({
      success: true,
      source: newSource,
      totalSources: updatedSession.sources.length,
      totalItems: updatedSession.files.length + updatedSession.sources.length,
    });

  } catch (error) {
    console.error('Knowledge source error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add knowledge source' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, itemId, itemType } = await req.json();

    if (!sessionId || !itemId) {
      return NextResponse.json(
        { error: 'Session ID and item ID required' },
        { status: 400 }
      );
    }

    const session = knowledgeStore.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    let updatedSession: KnowledgeSession;

    if (itemType === 'file') {
      updatedSession = {
        ...session,
        files: session.files.filter((file: KnowledgeFile) => file.id !== itemId),
        lastUpdated: Date.now(),
      };
    } else if (itemType === 'source') {
      updatedSession = {
        ...session,
        sources: session.sources.filter((source: KnowledgeSource) => source.id !== itemId),
        lastUpdated: Date.now(),
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    knowledgeStore.set(sessionId, updatedSession);

    return NextResponse.json({
      success: true,
      files: updatedSession.files,
      sources: updatedSession.sources,
      totalItems: updatedSession.files.length + updatedSession.sources.length,
    });

  } catch (error) {
    console.error('Knowledge delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete knowledge item' 
      },
      { status: 500 }
    );
  }
}
