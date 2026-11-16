import { NextRequest, NextResponse } from "next/server";
import { deleteKnowledge, getKnowledgeSession, KnowledgeStoreError } from "@/lib/knowledgeStore";
import { allowFields, indexKnowledge, IngestionError, parseSource, parseUpload, readJsonBody, validateItemId, validateSessionId } from "@/lib/ingestion";
import { ScrapeError } from "@/lib/scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof IngestionError || error instanceof KnowledgeStoreError || error instanceof ScrapeError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json({ success: false, error: "Unable to process knowledge. No new items were saved; please retry." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, files } = await parseUpload(request);
    const { session, chunksCreated } = await indexKnowledge(sessionId, files, []);
    return NextResponse.json({
      success: true,
      id: files[0].id,
      title: files[0].name,
      content: files[0].content,
      type: "file",
      files,
      metadata: { wordCount: files[0].content.split(/\s+/).length, chunksCreated },
      totalFiles: session.files.length,
      totalItems: session.files.length + session.sources.length,
    });
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, source } = await parseSource(await readJsonBody(request));
    const { session, chunksCreated } = await indexKnowledge(sessionId, [], [source]);
    return NextResponse.json({
      success: true,
      id: source.id,
      title: source.title,
      content: source.content,
      type: source.type,
      source,
      metadata: { ...source.metadata, chunksCreated },
      totalSources: session.sources.length,
      totalItems: session.files.length + session.sources.length,
    });
  } catch (error) { return failure(error); }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = validateSessionId(new URL(request.url).searchParams.get("sessionId"));
    const session = getKnowledgeSession(sessionId);
    return NextResponse.json({ files: session?.files ?? [], sources: session?.sources ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 4096);
    allowFields(body, ["sessionId", "id"]);
    const sessionId = validateSessionId(body.sessionId);
    const id = "id" in body ? validateItemId(body.id) : undefined;
    const session = deleteKnowledge(sessionId, id);
    return NextResponse.json({ success: true, files: session.files, sources: session.sources, totalItems: session.files.length + session.sources.length });
  } catch (error) { return failure(error); }
}
