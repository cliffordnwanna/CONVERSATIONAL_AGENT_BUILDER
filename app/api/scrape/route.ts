import { NextRequest, NextResponse } from "next/server";
import { allowFields, IngestionError, readJsonBody } from "@/lib/ingestion";
import { scrapeWebsite, ScrapeError } from "@/lib/scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 4096);
    allowFields(body, ["url"]);
    return NextResponse.json(await scrapeWebsite(body.url));
  } catch (error) {
    const expected = error instanceof IngestionError || error instanceof ScrapeError;
    return NextResponse.json({ success: false, title: "", content: "", description: "", error: expected ? error.message : "Unable to read the website. Try pasting its text instead." }, { status: expected ? error.status : 502 });
  }
}
