import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { deflateRawSync } from "node:zlib";
import { extractFile, extractPdf, indexKnowledge, INGESTION_LIMITS, parseSource, parseUpload, readJsonBody, readLimitedBody, validateDocxArchive, validateFile, validateSessionId, validateText } from "../lib/ingestion";
import { cleanupOldSessions, deleteKnowledge, getKnowledgeSession, KNOWLEDGE_LIMITS, knowledgeStore, type KnowledgeSource } from "../lib/knowledgeStore";
import { vectorStore } from "../lib/vectorStore";

function source(id = "source-one", content = "Reliable source text."): KnowledgeSource {
  return { id, title: "Test source", content, type: "text", status: "completed", addedAt: new Date().toISOString() };
}
const embed = async (texts: string[]) => texts.map(() => [1, 0]);
const ownedSessions = new Set(["ingestion-test", "ingestion-empty-failure", "ingestion-vector-only"]);
afterEach(() => {
  for (const sessionId of ownedSessions) {
    knowledgeStore.delete(sessionId);
    vectorStore.clear(sessionId);
  }
});

function zip(entries: Record<string, string>): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [filename, text] of Object.entries(entries)) {
    const name = Buffer.from(filename);
    const content = Buffer.from(text);
    const compressed = deflateRawSync(content);
    let crc = 0xffffffff;
    for (const byte of content) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(name.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(8, 10);
    directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(content.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    local.push(header, name, compressed);
    central.push(directory, name);
    offset += header.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

function docx(text: string): Buffer {
  return zip({
    "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    "_rels/.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  });
}

test("session and text validation reject malformed, blank and oversized values", () => {
  for (const invalid of [undefined, null, "", 42, {}, "bad id", "../other", "x".repeat(129)]) assert.throws(() => validateSessionId(invalid));
  assert.equal(validateSessionId("session_123-ok"), "session_123-ok");
  for (const invalid of [undefined, " \n ", 42, "binary\u0000", "x".repeat(50_001)]) assert.throws(() => validateText(invalid));
  assert.equal(validateText("  Héllo 世界\n "), "Héllo 世界");
});

test("file validation enforces extension, MIME, nonempty and size limits", () => {
  assert.equal(validateFile(new File(["text"], "NOTES.TXT", { type: "text/plain" })), "txt");
  for (const file of [new File(["x"], "test.doc"), new File(["x"], "test.pdf", { type: "text/plain" }), new File([], "empty.txt"), new File([new Uint8Array(INGESTION_LIMITS.fileBytes + 1)], "large.txt")]) assert.throws(() => validateFile(file));
});

test("TXT and DOCX use real extraction and preserve Unicode", async () => {
  const txt = await extractFile(new File([" Héllo 世界 "], "notes.txt"));
  assert.equal(txt.content, "Héllo 世界");
  const document = await extractFile(new File([new Uint8Array(docx("A real Word document 世界"))], "notes.docx"));
  assert.equal(document.content, "A real Word document 世界");
});

test("Markdown extensions accept Markdown, plain-text and absent MIME types with UTF-8 content", async () => {
  const content = "# Héllo 世界\n\n- **Readable Markdown**";
  for (const extension of ["md", "markdown", "MD", "MARKDOWN"]) {
    for (const type of ["text/markdown", "text/plain", "", "application/octet-stream"]) {
      const file = new File([content], `notes.${extension}`, { type });
      assert.equal(validateFile(file), extension.toLowerCase());
      const extracted = await extractFile(file);
      assert.equal(extracted.content, content);
      assert.equal(extracted.type, "text/markdown");
    }
  }
});

test("Markdown rejects incompatible MIME, blank, binary, invalid UTF-8 and oversized content", async () => {
  for (const extension of ["md", "markdown"]) {
    assert.throws(() => validateFile(new File(["Text"], `wrong.${extension}`, { type: "application/pdf" })));
    assert.throws(() => validateFile(new File([new Uint8Array(INGESTION_LIMITS.fileBytes + 1)], `large.${extension}`)));
    for (const content of [" \n ", "binary\u0000text", new Uint8Array([0xff, 0xfe, 0xff]), "x".repeat(INGESTION_LIMITS.characters + 1)]) {
      await assert.rejects(extractFile(new File([content], `invalid.${extension}`, { type: "text/markdown" })));
    }
  }
});

test("blank, corrupt, fake PDF and invalid UTF-8 documents are rejected", async () => {
  for (const file of [new File(["  "], "blank.txt"), new File([new Uint8Array([0xff, 0xfe, 0xff])], "bad.txt"), new File(["not a pdf"], "bad.pdf"), new File(["<w:t>Fake XML</w:t>"], "bad.docx"), new File([new Uint8Array(docx(""))], "blank.docx")]) await assert.rejects(extractFile(file));
});

test("DOCX archive validation rejects inflated size and missing Word content", () => {
  assert.throws(() => validateDocxArchive(zip({ "other.xml": "not a document" })));
  const archive = docx("text");
  const directory = archive.readUInt32LE(archive.length - 6);
  archive.writeUInt32LE(30 * 1024 * 1024, directory + 24);
  assert.throws(() => validateDocxArchive(archive));
});

test("PDF parser is destroyed on success and failure, without fabricated page markers", async () => {
  let destroyed = 0;
  const factory = async () => ({
    getText: async (options: { pageJoiner: string }) => { assert.equal(options.pageJoiner, ""); return { text: "Real text" }; },
    destroy: async () => { destroyed++; },
  });
  assert.equal(await extractPdf(Buffer.from("%PDF-1.7"), factory), "Real text");
  await assert.rejects(extractPdf(Buffer.from("%PDF-1.7"), async () => ({ getText: async () => { throw new Error("broken PDF"); }, destroy: async () => { destroyed++; } })));
  assert.equal(destroyed, 2);
});

test("bounded request parsing handles actual streamed length and malformed JSON", async () => {
  await assert.rejects(readLimitedBody(new Request("http://local", { method: "POST", body: "12345" }), 4));
  await assert.rejects(readJsonBody(new Request("http://local", { method: "POST", body: "[]", headers: { "Content-Type": "application/json" } })));
  await assert.rejects(readJsonBody(new Request("http://local", { method: "POST", body: "broken", headers: { "Content-Type": "application/json" } })));
  await assert.rejects(readJsonBody(new Request("http://local", { method: "POST", body: "{}" })));
});

test("multipart accepts valid files and rejects duplicates, wrong types and excess files", async () => {
  const make = (form: FormData) => new Request("http://local", { method: "POST", body: form });
  const valid = new FormData(); valid.set("sessionId", "ingestion-test"); valid.append("files", new File(["Text"], "notes.txt"));
  assert.equal((await parseUpload(make(valid))).files[0].content, "Text");
  const wrong = new FormData(); wrong.set("sessionId", "ingestion-test"); wrong.set("files", "not a file");
  await assert.rejects(parseUpload(make(wrong)));
  valid.append("sessionId", "other");
  await assert.rejects(parseUpload(make(valid)));
  const tooMany = new FormData(); tooMany.set("sessionId", "ingestion-test");
  for (let i = 0; i < 6; i++) tooMany.append("files", new File(["Text"], `${i}.txt`));
  await assert.rejects(parseUpload(make(tooMany)));
});

test("source requests enforce exactly one input and successful legacy extraction", async () => {
  for (const body of [{ sessionId: "ingestion-test", text: " " }, { sessionId: "ingestion-test", text: "x", url: "https://example.com" }, { sessionId: "ingestion-test", source: { ...source(), status: "error" } }, { sessionId: "ingestion-test", text: 123 }]) await assert.rejects(parseSource(body));
  const parsed = await parseSource({ sessionId: "ingestion-test", text: "Useful content" });
  assert.equal(parsed.source.status, "completed");
});

test("embedding rejection or misalignment leaves all knowledge records and vectors unchanged", async () => {
  const existingFile = await extractFile(new File(["Existing uploaded text"], "existing.txt"));
  const incomingFile = await extractFile(new File(["New uploaded text"], "new.txt"));
  await indexKnowledge("ingestion-test", [existingFile], [source()], embed);
  const knowledgeBefore = structuredClone(getKnowledgeSession("ingestion-test"));
  const vectorsBefore = structuredClone(vectorStore.getAll("ingestion-test"));
  for (const failedEmbed of [async () => { throw new Error("API failed"); }, async () => [], async () => [[NaN], [1]], async () => [[0, 0], [1, 0]]]) {
    await assert.rejects(indexKnowledge("ingestion-test", [incomingFile], [source("second")], failedEmbed));
    assert.deepEqual(getKnowledgeSession("ingestion-test"), knowledgeBefore);
    assert.deepEqual(vectorStore.getAll("ingestion-test"), vectorsBefore);
  }
  await assert.rejects(indexKnowledge("ingestion-empty-failure", [incomingFile], [source("second")], async () => { throw new Error("API failed"); }));
  assert.equal(getKnowledgeSession("ingestion-empty-failure"), undefined);
  assert.deepEqual(vectorStore.getAll("ingestion-empty-failure"), []);
});

test("all embeddings finish before either store publishes", async () => {
  let finish!: (value: number[][]) => void;
  const pending = indexKnowledge("ingestion-test", [], [source()], () => new Promise(resolve => { finish = resolve; }));
  assert.equal(knowledgeStore.has("ingestion-test"), false);
  assert.equal(vectorStore.getAll("ingestion-test").length, 0);
  finish([[1, 0]]);
  await pending;
  assert.equal(getKnowledgeSession("ingestion-test")?.sources.length, 1);
});

test("clearing during embedding does not resurrect removed knowledge", async () => {
  let finish!: (value: number[][]) => void;
  const pending = indexKnowledge("ingestion-test", [], [source()], () => new Promise(resolve => { finish = resolve; }));
  deleteKnowledge("ingestion-test");
  finish([[1, 0]]);
  await assert.rejects(pending, /cleared or expired/);
  assert.equal(knowledgeStore.has("ingestion-test"), false);
  assert.deepEqual(vectorStore.getAll("ingestion-test"), []);
});

test("concurrent commits recheck capacity after embeddings complete", async () => {
  await indexKnowledge("ingestion-test", [], Array.from({ length: KNOWLEDGE_LIMITS.items - 1 }, (_, i) => source(`existing-${i}`)), embed);
  let finish!: (value: number[][]) => void;
  const pending = indexKnowledge("ingestion-test", [], [source("delayed")], () => new Promise(resolve => { finish = resolve; }));
  await indexKnowledge("ingestion-test", [], [source("immediate")], embed);
  finish([[1, 0]]);
  await assert.rejects(pending, /at most 20/);
  assert.equal(getKnowledgeSession("ingestion-test")?.sources.length, KNOWLEDGE_LIMITS.items);
  assert.equal(vectorStore.getAll("ingestion-test").length, KNOWLEDGE_LIMITS.items);
});

test("deletion removes source vectors, preserves others, and clearing is idempotent", async () => {
  await indexKnowledge("ingestion-test", [], [source("one"), source("two")], embed);
  deleteKnowledge("ingestion-test", "one");
  assert.deepEqual(vectorStore.getAll("ingestion-test").map(chunk => chunk.metadata.knowledgeId), ["two"]);
  assert.deepEqual(getKnowledgeSession("ingestion-test")?.sources.map(item => item.id), ["two"]);
  deleteKnowledge("ingestion-test"); deleteKnowledge("ingestion-test");
  assert.equal(knowledgeStore.has("ingestion-test"), false);
  assert.deepEqual(vectorStore.getAll("ingestion-test"), []);
});

test("knowledge reads preserve vector-only sessions, never refresh TTL, and return undefined when absent or expired", async () => {
  const vector = { id: "vector-only-chunk", content: "Vector-only fixture", embedding: [1, 0], metadata: { source: "Fixture", type: "text", knowledgeId: "fixture" } };
  vectorStore.add("ingestion-vector-only", [vector]);
  assert.equal(getKnowledgeSession("ingestion-vector-only"), undefined);
  assert.deepEqual(vectorStore.getAll("ingestion-vector-only"), [vector]);
  await indexKnowledge("ingestion-test", [], [source()], embed);
  const session = knowledgeStore.get("ingestion-test")!;
  const writtenAt = Date.now() - KNOWLEDGE_LIMITS.ttlMs / 2;
  session.lastUpdated = writtenAt;
  assert.equal(getKnowledgeSession("ingestion-test"), session);
  assert.equal(session.lastUpdated, writtenAt);
  session.lastUpdated = Date.now() - KNOWLEDGE_LIMITS.ttlMs;
  assert.equal(getKnowledgeSession("ingestion-test"), undefined);
  assert.deepEqual(vectorStore.getAll("ingestion-test"), []);
  assert.deepEqual(vectorStore.getAll("ingestion-vector-only"), [vector]);
});

test("expiry synchronizes knowledge and vector cleanup", async () => {
  await indexKnowledge("ingestion-test", [], [source()], embed);
  knowledgeStore.get("ingestion-test")!.lastUpdated = Date.now() - KNOWLEDGE_LIMITS.ttlMs;
  assert.equal(cleanupOldSessions(), 1);
  assert.equal(knowledgeStore.has("ingestion-test"), false);
  assert.deepEqual(vectorStore.getAll("ingestion-test"), []);
});

test("item, session, character and duplicate-ID bounds reject atomically", async () => {
  await indexKnowledge("ingestion-test", [], [source()], embed);
  await assert.rejects(indexKnowledge("ingestion-test", [], [source()], embed));
  await assert.rejects(indexKnowledge("ingestion-test", [], Array.from({ length: KNOWLEDGE_LIMITS.items }, (_, i) => source(`extra-${i}`)), embed));
  await assert.rejects(indexKnowledge("ingestion-test", [], [source("large", "x".repeat(KNOWLEDGE_LIMITS.characters))], embed));
  assert.equal(vectorStore.getAll("ingestion-test").length, 1);
  for (let i = knowledgeStore.size; i < KNOWLEDGE_LIMITS.sessions; i++) {
    const sessionId = `ingestion-capacity-${i}`;
    ownedSessions.add(sessionId);
    knowledgeStore.set(sessionId, { files: [], sources: [], lastUpdated: Date.now() });
  }
  await assert.rejects(indexKnowledge("one-too-many", [], [source()], embed));
  assert.equal(knowledgeStore.size, KNOWLEDGE_LIMITS.sessions);
});
