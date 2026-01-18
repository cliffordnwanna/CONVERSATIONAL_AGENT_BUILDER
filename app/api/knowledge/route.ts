import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { knowledgeStore, KnowledgeFile, KnowledgeSource, KnowledgeSession } from "@/lib/knowledgeStore";
import { createBatchEmbeddings } from "@/lib/embeddings";
import { chunkKnowledge } from "@/lib/chunking";
import { vectorStore } from "@/lib/vectorStore";

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
          // Simple PDF text extraction approach
          const bufferString = buffer.toString('utf-8');
          
          // Extract readable text from PDF (basic approach)
          const textMatches = bufferString.match(/[a-zA-Z0-9\s.,;:!?'"()-]+/g);
          const extractedText = textMatches ? textMatches.join(' ') : '';
          
          // Clean up of extracted text
          content = extractedText
            .replace(/[^\w\s.,;:!?'"()-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000); // Limit content size
            
        } catch (error) {
          console.error("PDF parsing error:", error);
          content = `PDF uploaded: ${file.name}. Text extraction failed.`;
        }
      } else if (fileType === "text/plain" || file.name.endsWith(".txt")) {
        content = buffer.toString("utf-8");
      } else if (fileType.includes("word") || file.name.endsWith(".docx")) {
        // For DOCX, try basic text extraction
        try {
          const bufferString = buffer.toString('utf-8');
          const textMatches = bufferString.match(/[a-zA-Z0-9\s.,;:!?'"()-]+/g);
          const extractedText = textMatches ? textMatches.join(' ') : '';
          
          content = extractedText
            .replace(/[^\w\s.,;:!?'"()-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
            
        } catch (error) {
          console.error("DOCX parsing error:", error);
          content = "DOCX file uploaded. Text extraction failed.";
        }
      } else {
        content = buffer.toString("utf-8");
      }
      
      const knowledgeFile: KnowledgeFile = {
        id: crypto.randomUUID(),
        name: file.name,
        content: content.substring(0, 50000), // Increased limit for full documents
        type: fileType,
        uploadedAt: new Date().toISOString(),
      };
      
      processedFiles.push(knowledgeFile);
    }
    
    // Process pasted text
    if (pastedText && pastedText.trim()) {
      const textFile: KnowledgeFile = {
        id: crypto.randomUUID(),
        name: "Pasted Text",
        content: pastedText.substring(0, 50000),
        type: "text/plain",
        uploadedAt: new Date().toISOString(),
      };
      
      processedFiles.push(textFile);
    }
    
    // Get existing session
    const existingSession = knowledgeStore.get(sessionId) || {
      files: [],
      sources: [],
      lastUpdated: Date.now(),
    };
    
    // Update session
    const updatedSession: KnowledgeSession = {
      ...existingSession,
      files: [...existingSession.files, ...processedFiles],
      lastUpdated: Date.now(),
    };
    
    knowledgeStore.set(sessionId, updatedSession);
    
    // Debug: Log what was stored
    console.log("📚 Knowledge Store Update:", {
      sessionId,
      filesStored: knowledgeStore.get(sessionId)?.files?.length || 0,
      sourcesStored: knowledgeStore.get(sessionId)?.sources?.length || 0,
      totalItems: (knowledgeStore.get(sessionId)?.files?.length || 0) + 
                  (knowledgeStore.get(sessionId)?.sources?.length || 0),
      sessionData: knowledgeStore.get(sessionId),
    });
    
    // Create embeddings for all processed files (Adjustment 3)
    const allKnowledge = processedFiles.map(file => ({
      id: file.id,
      type: "file" as const,
      title: file.name,
      content: file.content,
      status: "completed" as const,
      source: file.name,
      addedAt: Date.now()
    }));
    
    const chunks = chunkKnowledge(allKnowledge);
    const embeddings = await createBatchEmbeddings(chunks.map(c => c.content));
    
    const vectorChunks = chunks.map((chunk, index) => ({
      id: chunk.id,
      content: chunk.content,
      embedding: embeddings[index],
      metadata: chunk.metadata
    }));
    
    // Add to vector store (APPEND, not overwrite - Adjustment 1)
    vectorStore.add(sessionId, vectorChunks);
    
    return NextResponse.json({
      success: true,
      id: processedFiles[0]?.id,  // Return id directly for frontend consistency
      title: processedFiles[0]?.name,  // Return title for frontend
      content: processedFiles[0]?.content,  // Return content for frontend
      files: processedFiles,
      chunks: vectorChunks,  // Return chunks for frontend tracking
      metadata: {
        wordCount: processedFiles[0]?.content.split(/\s+/).length,
        chunksCreated: vectorChunks.length,
      },
      totalFiles: updatedSession.files.length,
      totalItems: updatedSession.files.length + updatedSession.sources.length,
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
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const existingSession = knowledgeStore.get(sessionId) || {
      files: [],
      sources: [],
      lastUpdated: Date.now(),
    };

    let newSource: KnowledgeSource;

    // Handle text upload
    if (body.text) {
      newSource = {
        id: crypto.randomUUID(),
        title: `Text Entry ${existingSession.sources.length + 1}`,
        content: body.text,
        type: "text",
        status: "completed",
        metadata: {
          wordCount: body.text.split(/\s+/).length,
        },
        addedAt: new Date().toISOString(),
      };
    }
    // Handle URL upload
    else if (body.url) {
      console.log("🕷️ Starting web scrape for:", body.url);
      
      try {
        const response = await fetch(body.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log("🕷️ Raw HTML length:", html.length);
        
        // Extract visible text using simple regex-based approach
        // Remove scripts, styles, and HTML tags
        let content = html
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Clean up and limit content
        content = content
          .substring(0, 10000) // Limit to first 10k chars
          .replace(/[^\w\s.,;:!?'"()-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log("🕷️ Extracted content length:", content.length);
        
        if (content.length < 50) {
          throw new Error("Extracted content too short - likely scraping failed");
        }
        
        newSource = {
          id: crypto.randomUUID(),
          title: body.url,
          content: content,
          type: "url",
          url: body.url,
          status: "completed",
          metadata: {
            wordCount: content.split(/\s+/).length,
            lastScraped: new Date().toISOString(),
          },
          addedAt: new Date().toISOString(),
        };
        
        console.log("✅ Web scrape successful:", {
          url: body.url,
          contentLength: content.length,
          wordCount: content.split(/\s+/).length
        });
        
      } catch (error) {
        console.error("❌ Web scrape failed:", error);
        newSource = {
          id: crypto.randomUUID(),
          title: body.url,
          content: `Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: "url",
          url: body.url,
          status: "error",
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            lastScraped: new Date().toISOString(),
          },
          addedAt: new Date().toISOString(),
        };
      }
    }
    // Handle legacy source format
    else if (body.source) {
      newSource = {
        id: body.source.id,
        title: body.source.title,
        content: body.source.content,
        type: body.source.type,
        url: body.source.url,
        status: body.source.status,
        metadata: body.source.metadata,
        addedAt: new Date().toISOString(),
      };
    } else {
      return NextResponse.json(
        { error: 'No valid content provided (text, url, or source required)' },
        { status: 400 }
      );
    }

    const updatedSession: KnowledgeSession = {
      ...existingSession,
      sources: [...existingSession.sources, newSource],
      lastUpdated: Date.now(),
    };

    knowledgeStore.set(sessionId, updatedSession);
    
    // Debug: Log what was stored
    console.log("📚 PUT Knowledge Store Update:", {
      sessionId,
      sourcesStored: knowledgeStore.get(sessionId)?.sources?.length || 0,
      totalItems: (knowledgeStore.get(sessionId)?.files?.length || 0) + 
                  (knowledgeStore.get(sessionId)?.sources?.length || 0),
    });
    
    // Create embeddings for new source (Adjustment 3)
    if (newSource.status === "completed" && newSource.content.trim()) {
      // Normalize scraped content for better chunking
      const normalizedContent = newSource.content
        .replace(/([.?!])\s+/g, '$1\n\n')   // force paragraph breaks
        .replace(/(What is|Do you|How does|Why is|Who should|Are you|Can you)/g, '\n\n$1')
        .trim();
      
      const knowledge = [{
        id: newSource.id,
        type: newSource.type as "file" | "url" | "text",
        title: newSource.title,
        content: normalizedContent,
        status: "completed" as const,
        source: newSource.url || newSource.title,
        addedAt: Date.now()
      }];
      
      const chunks = chunkKnowledge(knowledge);
      console.log("🧩 Chunks created:", chunks.length);
      
      const embeddings = await createBatchEmbeddings(chunks.map(c => c.content));
      
      const vectorChunks = chunks.map((chunk, index) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: embeddings[index],
        metadata: chunk.metadata
      }));
      
      // Add to vector store (APPEND, not overwrite - Adjustment 1)
      vectorStore.add(sessionId, vectorChunks);
    }
    
    return NextResponse.json({
      success: true,
      id: newSource.id,  // Return id directly for frontend consistency
      title: newSource.title,  // Return title for frontend
      content: newSource.content,  // Return content for frontend
      source: newSource,
      metadata: {
        wordCount: newSource.content.split(/\s+/).length,
        chunksCreated: newSource.status === "completed" ? Math.ceil(newSource.content.length / 500) : 0,
      },
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
