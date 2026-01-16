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

// In-memory knowledge store (in production, use vector DB like Pinecone)
const knowledgeStore = new Map<string, KnowledgeFile[]>();

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
    if (!knowledgeStore.has(sessionId)) {
      knowledgeStore.set(sessionId, []);
    }
    
    const existingFiles = knowledgeStore.get(sessionId)!;
    
    // Limit to 5 files per session to control costs
    const updatedFiles = [...existingFiles, ...processedFiles].slice(0, 5);
    knowledgeStore.set(sessionId, updatedFiles);
    
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
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  
  if (!sessionId || !knowledgeStore.has(sessionId)) {
    return NextResponse.json({ files: [] });
  }
  
  return NextResponse.json({ files: knowledgeStore.get(sessionId) });
}
