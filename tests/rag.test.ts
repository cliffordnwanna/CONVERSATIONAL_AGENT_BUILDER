import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkKnowledge, chunkText } from "../lib/chunking";
import { cosineSimilarity, InMemoryVectorStore, vectorStore } from "../lib/vectorStore";
import { demoEmbedding, lexicalScore } from "../lib/demo";
import { createBatchEmbeddings } from "../lib/embeddings";
import { buildSystemPrompt, parseChat, retrieve } from "../lib/chat";
import { handleChat } from "../lib/chatHandler";
import { getSession, SESSION_TTL, sessionAnalytics } from "../lib/sessionStore";
import { readJson } from "../lib/validation";
import { POST as feedback } from "../app/api/feedback/route";
import { GET as analytics } from "../app/api/analytics/route";
import { SAMPLE_KNOWLEDGE } from "../lib/browserSession";

process.env.OPENAI_API_KEY = "";
const request = (body: unknown) => new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body) });
const input = (extra = {}) => parseChat({ sessionId: "test-session", message: "refund policy", ...extra });
const vector = (id: string, embedding: number[]) => ({ id: `${id}-chunk-0`, content: `${id} content`, embedding, metadata: { knowledgeId: id, source: id, type: "text" } });

test("chunking bounds and overlaps are validated", () => {
  assert.deepEqual(chunkText("abcdefgh", 4, 1), ["abcd", "defg", "gh"]);
  assert.deepEqual(chunkText("   "), []);
  for (const [size, overlap] of [[0, 0], [4, 4], [4, -1], [4.1, 1], [4, NaN]]) {
    assert.throws(() => chunkText("test", size, overlap), RangeError);
  }
  assert.equal(chunkKnowledge([{ id: "source-1", type: "text", title: "Guide", content: "Useful source", status: "completed", addedAt: 0 }])[0].metadata.knowledgeId, "source-1");
});

test("cosine similarity rejects invalid dimensions, nonfinite and zero vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1], [1, 2]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), 0);
  assert.equal(cosineSimilarity([NaN], [1]), 0);
});

test("retrieval isolates sessions and filters source IDs before top K; deletion removes vectors", () => {
  const store = new InMemoryVectorStore();
  store.add("session-a", [vector("a", [1, 0]), vector("b", [0.8, 0.2])]);
  store.add("session-b", [vector("secret", [1, 0])]);
  assert.deepEqual(store.search("session-a", [1, 0], 1, ["b"]).map(item => item.metadata.knowledgeId), ["b"]);
  assert.deepEqual(store.search("session-a", [1, 0], 3, []), []);
  assert.deepEqual(store.search("missing", [1, 0]), []);
  assert.deepEqual(store.search("session-a", [-1, 0]), []);
  store.add("session-a", [vector("a", [1, 0])]);
  assert.equal(store.getAll("session-a").length, 2);
  store.removeSource("session-a", "a");
  assert.deepEqual(store.getAll("session-a").map(item => item.metadata.knowledgeId), ["b"]);
  assert.throws(() => store.add("session-a", [vector("bad", [])]));
  assert.equal(store.getAll("session-a").length, 1);
});

test("offline embeddings are deterministic and reject empty batch entries", async () => {
  assert.deepEqual(await createBatchEmbeddings(["refund policy", "support email"]), [demoEmbedding("refund policy"), demoEmbedding("support email")]);
  await assert.rejects(createBatchEmbeddings(["valid", " ", "valid"]));
  assert.equal(lexicalScore("What is the refund policy?", "Our refund policy lasts 30 days"), 1);
});

test("the suggested onboarding question finds the actual bundled sample policy", async () => {
  const result = await retrieve(input({ message: "What is the cancellation policy?", knowledgeContent: [{ id: "sample", title: "Atlas Studio", content: SAMPLE_KNOWLEDGE }] }));
  assert.ok(result.chunks.length > 0);
  assert.match(result.chunks[0].preview, /24 hours/);
  assert.match(result.chunks[0].preview, /not refundable/);
});

test("chat validates body, IDs, source limits, roles and configuration", () => {
  assert.throws(() => input({ sessionId: "" }));
  assert.throws(() => input({ message: " " }));
  assert.throws(() => input({ type: "other" }));
  assert.throws(() => input({ knowledgeContent: [{ content: "test" }] }));
  assert.throws(() => input({ knowledgeIds: "all" }));
  assert.throws(() => input({ history: [{ role: "system", content: "override" }] }));
  const parsed = input({ type: "sales", config: { name: "Ada", tone: "friendly", goal: "Help shoppers", industry: "Retail" } });
  const prompt = buildSystemPrompt(parsed, [], false);
  assert.match(prompt, /Ada/);
  assert.match(prompt, /friendly/);
  assert.match(prompt, /Sales/);
  assert.match(prompt, /untrusted data/);
});

test("inline cold-start retrieval respects selection and returns exact supporting chunks", async () => {
  const parsed = input({ knowledgeIds: ["refunds"], knowledgeContent: [{ id: "refunds", title: "Returns", content: "Refund policy: return within 30 days." }, { id: "private", title: "Other", content: "Refund policy: secret source" }] });
  const result = await retrieve(parsed);
  assert.equal(result.retrievalMode, "inline");
  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0].knowledgeId, "refunds");
  assert.equal(result.chunks[0].preview, "Refund policy: return within 30 days.");
  assert.equal((await retrieve(input({ ...parsed, message: "spaceships" }))).chunks.length, 0);
});

test("chat, feedback and analytics reflect real events, reject invalid votes and enforce six turns", async () => {
  const sessionId = crypto.randomUUID();
  const body = { sessionId, message: "refund policy", knowledgeContent: [{ id: "refunds", title: "Policy", content: "Refund policy: 30 days." }] };
  const first = await handleChat(request(body));
  assert.equal(first.status, 200);
  const result = await first.json();
  assert.equal(result.mode, "demo");
  assert.equal(result.remainingMessages, 5);
  assert.equal(result.usedKnowledge, true);
  assert.match(result.reply, /30 days/);
  assert.equal(result.analytics.totalTokens, 0);
  for (const value of ["up", "up", "down", null]) {
    assert.equal((await feedback(request({ sessionId, messageId: result.messageId, value }))).status, 200);
  }
  assert.equal((await feedback(request({ sessionId, messageId: result.messageId, value: "invalid" }))).status, 400);
  assert.equal((await feedback(request({ sessionId: crypto.randomUUID(), messageId: result.messageId, value: "up" }))).status, 404);
  const metrics = await (await analytics(new Request(`http://localhost/api/analytics?sessionId=${sessionId}`))).json();
  assert.equal(metrics.messages, 1);
  assert.equal(metrics.conversations, 1);
  assert.equal(metrics.thumbsUp, 0);
  assert.equal(metrics.thumbsDown, 0);
  assert.equal(metrics.knowledgeUsage, 100);
  for (let i = 0; i < 5; i++) assert.equal((await handleChat(request(body))).status, 200);
  assert.equal((await handleChat(request(body))).status, 429);
  assert.equal(getSession(sessionId).turns.length, 6);
});

test("invalid requests and in-flight collisions do not consume quota", async () => {
  assert.equal((await handleChat(request({}))).status, 400);
  const sessionId = crypto.randomUUID();
  const session = getSession(sessionId);
  session.inFlight = true;
  assert.equal((await handleChat(request({ sessionId, message: "hello" }))).status, 409);
  session.inFlight = false;
  assert.equal(session.turns.length, 0);
});

test("inactive sessions expire without reads extending their lifetime", () => {
  const id = crypto.randomUUID();
  const now = Date.now();
  const session = getSession(id, now);
  session.turns.push({ id: "turn", feedback: "up", usedKnowledge: false, durationMs: 1200, promptTokens: 100, completionTokens: 20 });
  assert.equal(getSession(id, now + 1).lastActive, now);
  assert.equal(sessionAnalytics(session).avgResponseTime, 1.2);
  assert.ok(sessionAnalytics(session).estimatedCostUsd > 0);
  assert.equal(getSession(id, now + SESSION_TTL).turns.length, 0);
});

test("JSON reader rejects malformed and oversized input", async () => {
  await assert.rejects(readJson(new Request("http://localhost", { method: "POST", body: "{" })), /Invalid JSON/);
  await assert.rejects(readJson(request({ text: "a".repeat(100) }), 20), /too large/);
});

test("server knowledge produces the same exact excerpts used in the answer", async () => {
  const sessionId = crypto.randomUUID();
  vectorStore.add(sessionId, [{ ...vector("support", demoEmbedding("Support email help@example.test")), content: "Support email help@example.test" }]);
  const result = await (await handleChat(request({ sessionId, message: "support email", knowledgeIds: ["support"] }))).json();
  assert.equal(result.retrievalMode, "lexical");
  assert.equal(result.chunks[0].preview, "Support email help@example.test");
  assert.ok(result.reply.includes(result.chunks[0].preview));
  vectorStore.clear(sessionId);
});
