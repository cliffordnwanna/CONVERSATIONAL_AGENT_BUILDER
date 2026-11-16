import { randomUUID } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { chunkKnowledge } from "./chunking";
import { createBatchEmbeddings } from "./embeddings";
import { assertKnowledgeCapacity, beginKnowledgeIngestion, commitKnowledge, finishKnowledgeIngestion, getKnowledgeSession, type KnowledgeFile, type KnowledgeSource } from "./knowledgeStore";
import { scrapeWebsite, validatePublicUrl } from "./scrape";

export const INGESTION_LIMITS = { files: 5, fileBytes: 5 * 1024 * 1024, requestBytes: 12 * 1024 * 1024, jsonBytes: 320 * 1024, characters: 50_000 };

export class IngestionError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); this.name = "IngestionError"; }
}

export function validateSessionId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new IngestionError("Session ID must contain 1–128 letters, numbers, underscores or hyphens.");
  }
  return value;
}

export function validateItemId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new IngestionError("Invalid knowledge item ID.");
  return value;
}

function containsControlCharacters(value: string, allowWhitespace = false): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 && (!allowWhitespace || ![9, 10, 13].includes(code))) return true;
  }
  return false;
}

export function validateText(value: unknown, label = "Text"): string {
  if (typeof value !== "string" || !value.trim()) throw new IngestionError(`${label} must contain readable text.`);
  if (value.length > INGESTION_LIMITS.characters) throw new IngestionError(`${label} exceeds the 50,000 character limit.`, 413);
  if (containsControlCharacters(value, true)) throw new IngestionError(`${label} contains unsupported binary characters.`, 422);
  return value.trim();
}

export function validateObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new IngestionError("Request body must be a JSON object.");
  return value as Record<string, unknown>;
}

export function allowFields(body: Record<string, unknown>, fields: string[]): void {
  if (Object.keys(body).some(key => !fields.includes(key))) throw new IngestionError("Request contains unsupported fields.");
}

export async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new IngestionError("Request body is too large or has an invalid content length.", 413);
  if (!request.body) throw new IngestionError("Request body is required.");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new IngestionError("Request body exceeds the size limit.", 413);
      }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(parts, length);
}

export async function readJsonBody(request: Request, limit = INGESTION_LIMITS.jsonBytes): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new IngestionError("Content-Type must be application/json.", 415);
  const bytes = await readLimitedBody(request, limit);
  try { return validateObject(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))); }
  catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError("Request body is not valid JSON.");
  }
}

const FILE_TYPES = {
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
type FileExtension = keyof typeof FILE_TYPES;

export function validateFile(file: File): FileExtension {
  if (typeof file === "string" || !file || typeof file.arrayBuffer !== "function" || !file.name || file.name.length > 255 || containsControlCharacters(file.name)) throw new IngestionError("Each files field must be a named file.");
  const extension = file.name.split(".").pop()?.toLowerCase() as FileExtension;
  if (!Object.hasOwn(FILE_TYPES, extension)) throw new IngestionError("Supported file types are .txt, .md, .markdown, .pdf and .docx (not .doc).", 415);
  const isMarkdown = extension === "md" || extension === "markdown";
  if (file.type && file.type !== "application/octet-stream" && file.type !== FILE_TYPES[extension] && !(isMarkdown && file.type === "text/plain")) throw new IngestionError("File extension and content type do not match.", 415);
  if (!file.size || file.size > INGESTION_LIMITS.fileBytes) throw new IngestionError("Each file must be nonempty and no larger than 5 MB.", file.size ? 413 : 400);
  return extension;
}

export function validateDocxArchive(buffer: Buffer): void {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) throw new IngestionError("The DOCX file is not a valid Word archive.", 422);
  let end = buffer.length - 22;
  const minimum = Math.max(0, buffer.length - 22 - 65535);
  while (end >= minimum && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < minimum || end + 22 + buffer.readUInt16LE(end + 20) !== buffer.length) throw new IngestionError("The DOCX archive is incomplete.", 422);
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const directoryEnd = offset + buffer.readUInt32LE(end + 12);
  if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6) || buffer.readUInt16LE(end + 8) !== count || count > 2000 || directoryEnd !== end) throw new IngestionError("This DOCX archive is too complex or unsupported.", 422);
  let expandedBytes = 0;
  let hasDocument = false;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > directoryEnd || buffer.readUInt32LE(offset) !== 0x02014b50) throw new IngestionError("The DOCX archive directory is invalid.", 422);
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    expandedBytes += buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const entryEnd = offset + 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
    if (entryEnd > directoryEnd || flags & 1 || ![0, 8].includes(method) || expandedBytes > 20 * 1024 * 1024) throw new IngestionError("The DOCX archive is encrypted, oversized, or unsupported.", 422);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50 || buffer.readUInt16LE(localOffset + 8) !== method) throw new IngestionError("The DOCX archive entry is invalid.", 422);
    const dataOffset = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    if (dataOffset + compressedSize > buffer.readUInt32LE(end + 16)) throw new IngestionError("The DOCX archive entry is truncated.", 422);
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let expanded: Buffer;
    try { expanded = method === 8 ? inflateRawSync(compressed, { maxOutputLength: 20 * 1024 * 1024 }) : compressed; }
    catch { throw new IngestionError("The DOCX archive is oversized or corrupt.", 422); }
    if (expanded.length !== buffer.readUInt32LE(offset + 24)) throw new IngestionError("The DOCX archive has invalid expanded sizes.", 422);
    if (buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8") === "word/document.xml") hasDocument = true;
    offset = entryEnd;
  }
  if (offset !== directoryEnd || !hasDocument) throw new IngestionError("The DOCX archive does not contain a Word document.", 422);
}

interface PdfParser { getText(options: { pageJoiner: string }): Promise<{ text: string }>; destroy(): Promise<void> }
type PdfFactory = (buffer: Buffer) => Promise<PdfParser>;

export async function extractPdf(buffer: Buffer, createParser: PdfFactory = async data => {
  const { PDFParse } = await import("pdf-parse");
  return new PDFParse({ data: new Uint8Array(data) });
}): Promise<string> {
  if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new IngestionError("The file is not a valid PDF.", 422);
  const parser = await createParser(buffer);
  try { return (await parser.getText({ pageJoiner: "" })).text; }
  finally { await parser.destroy(); }
}

export async function extractFile(file: File): Promise<KnowledgeFile> {
  const extension = validateFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  try {
    if (extension === "pdf") text = await extractPdf(buffer);
    else if (extension === "docx") {
      validateDocxArchive(buffer);
      const mammoth = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer })).value;
    } else text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(`Could not extract text from ${file.name}. Use a valid text-based document or paste its text.`, 422);
  }
  if (!text.trim()) throw new IngestionError(`No readable text was found in ${file.name}. Scanned documents require OCR first.`, 422);
  return { id: randomUUID(), name: file.name, content: validateText(text, "Extracted document"), type: FILE_TYPES[extension], uploadedAt: new Date().toISOString() };
}

export async function parseUpload(request: Request): Promise<{ sessionId: string; files: KnowledgeFile[] }> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) throw new IngestionError("Use multipart/form-data for file uploads.", 415);
  const bytes = await readLimitedBody(request, INGESTION_LIMITS.requestBytes);
  let form: FormData;
  try { form = await new Response(bytes as BodyInit, { headers: { "content-type": contentType } }).formData(); }
  catch { throw new IngestionError("Invalid multipart upload."); }
  for (const key of form.keys()) if (!["files", "pastedText", "sessionId"].includes(key)) throw new IngestionError("Upload contains unsupported fields.");
  if (form.getAll("sessionId").length !== 1 || form.getAll("pastedText").length > 1) throw new IngestionError("Upload fields must not be duplicated.");
  const sessionId = validateSessionId(form.get("sessionId"));
  const files = form.getAll("files");
  if (files.length > INGESTION_LIMITS.files) throw new IngestionError("Upload at most 5 files at a time.");
  for (const file of files) {
    if (typeof file === "string") throw new IngestionError("Each files field must be a file.");
    validateFile(file);
  }
  const pastedText = form.has("pastedText") ? validateText(form.get("pastedText"), "Pasted text") : undefined;
  const count = files.length + (pastedText ? 1 : 0);
  if (!count) throw new IngestionError("Provide at least one file or nonblank pasted text.");
  assertKnowledgeCapacity(sessionId, count);
  const processed: KnowledgeFile[] = [];
  for (const file of files) processed.push(await extractFile(file as File));
  if (pastedText) processed.push({ id: randomUUID(), name: "Pasted Text", content: pastedText, type: "text/plain", uploadedAt: new Date().toISOString() });
  return { sessionId, files: processed };
}

export async function parseSource(body: Record<string, unknown>): Promise<{ sessionId: string; source: KnowledgeSource }> {
  allowFields(body, ["sessionId", "text", "url", "source"]);
  const sessionId = validateSessionId(body.sessionId);
  if (["text", "url", "source"].filter(key => key in body).length !== 1) throw new IngestionError("Provide exactly one of text, url, or source.");
  assertKnowledgeCapacity(sessionId, 1);
  const base = { id: randomUUID(), status: "completed", addedAt: new Date().toISOString() };
  if ("text" in body) {
    const content = validateText(body.text);
    return { sessionId, source: { ...base, title: `Text Entry ${(getKnowledgeSession(sessionId)?.sources.length ?? 0) + 1}`, content, type: "text", metadata: { wordCount: content.split(/\s+/).length } } };
  }
  if ("url" in body) {
    const url = validatePublicUrl(body.url).href;
    const result = await scrapeWebsite(url);
    return { sessionId, source: { ...base, title: result.title, content: result.content, type: "url", url, metadata: { wordCount: result.content.split(/\s+/).length, description: result.description, lastScraped: base.addedAt } } };
  }
  const source = validateObject(body.source);
  if (source.type !== "text" && source.type !== "url") throw new IngestionError("Source type must be text or url.");
  if (source.status !== undefined && source.status !== "completed") throw new IngestionError("Only successfully extracted sources can be added.");
  if (typeof source.title !== "string" || !source.title.trim() || source.title.length > 300) throw new IngestionError("Source title must contain 1–300 characters.");
  const content = validateText(source.content, "Source content");
  const url = source.type === "url" ? validatePublicUrl(source.url).href : undefined;
  return { sessionId, source: { ...base, id: source.id === undefined ? base.id : validateItemId(source.id), title: source.title.trim(), type: source.type, content, ...(url ? { url } : {}), metadata: { wordCount: content.split(/\s+/).length } } };
}

export async function indexKnowledge(sessionId: string, files: KnowledgeFile[], sources: KnowledgeSource[], embed = createBatchEmbeddings) {
  const items = [
    ...files.map(file => ({ id: file.id, type: "file" as const, title: file.name, content: file.content, source: file.name })),
    ...sources.map(source => ({ id: source.id, type: source.type, title: source.title, content: source.content, source: source.url || source.title })),
  ];
  assertKnowledgeCapacity(sessionId, items.length, items.reduce((sum, item) => sum + item.content.length, 0));
  const chunks = chunkKnowledge(items.map(item => ({ ...item, status: "completed" as const, addedAt: Date.now() })));
  if (!chunks.length) throw new IngestionError("No readable knowledge was found.", 422);
  const lease = beginKnowledgeIngestion(sessionId, items.map(item => item.id));
  try {
    let embeddings: number[][];
    try { embeddings = await embed(chunks.map(chunk => chunk.content)); }
    catch { throw new IngestionError("Knowledge indexing failed. No items were saved; please retry.", 502); }
    if (embeddings.length !== chunks.length || embeddings.some(vector => !Array.isArray(vector) || !vector.length || vector.some(value => !Number.isFinite(value)) || !vector.some(value => value !== 0) || vector.length !== embeddings[0].length)) {
      throw new IngestionError("Knowledge indexing returned incomplete results. No items were saved; please retry.", 502);
    }
    const session = commitKnowledge(sessionId, files, sources, chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] })), lease);
    return { session, chunksCreated: chunks.length };
  } finally { finishKnowledgeIngestion(sessionId, lease); }
}
