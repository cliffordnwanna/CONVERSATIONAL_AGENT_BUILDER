import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { openai } from "../lib/openai";
import { handleChat } from "../lib/chatHandler";
import { vectorStore } from "../lib/vectorStore";
import { resetProviderDegradation } from "../lib/demo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const QUESTION = "refund policy for secret-question-marker";
const SOURCE_TEXT = "Refund policy: 30 days. secret-source-marker";
const ANSWER = "Refunds are accepted within 30 days [1]. secret-answer-marker";

const request = (sessionId: string, message = QUESTION) =>
  new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ sessionId, message, type: "faq" }) });
const seed = (sessionId: string, embedding = [1, 0]) =>
  vectorStore.add(sessionId, [{ id: "policy-chunk-0", content: SOURCE_TEXT, embedding, metadata: { knowledgeId: "policy", source: "Returns", type: "text" } }]);

test("offline chat keeps every existing field and adds requestId, timings and null usage", async () => {
  process.env.OPENAI_API_KEY = "";
  resetProviderDegradation();
  const sessionId = crypto.randomUUID();
  seed(sessionId);
  const response = await handleChat(request(sessionId));
  assert.equal(response.status, 200);
  const body = await response.json();
  for (const field of ["reply", "messageId", "remainingMessages", "usedKnowledge", "chunks", "chunkPreviews", "analytics", "retrievalMode", "mode", "degraded"]) {
    assert.ok(field in body, `existing field ${field} must remain`);
  }
  assert.equal(body.mode, "demo");
  assert.match(body.requestId, UUID);
  assert.equal(response.headers.get("X-Request-Id"), body.requestId);
  assert.notEqual(body.requestId, body.messageId);
  for (const key of ["retrievalMs", "generationMs", "totalMs"]) {
    assert.equal(typeof body.timings[key], "number", key);
    assert.ok(body.timings[key] >= 0 && Number.isFinite(body.timings[key]), key);
  }
  assert.ok(body.timings.totalMs >= body.timings.retrievalMs);
  assert.equal(body.usage, null, "no model call, so no provider usage");
});

test("each request gets its own requestId", async () => {
  process.env.OPENAI_API_KEY = "";
  const sessionId = crypto.randomUUID();
  seed(sessionId);
  const first = await (await handleChat(request(sessionId))).json();
  const second = await (await handleChat(request(sessionId))).json();
  assert.notEqual(first.requestId, second.requestId);
});

test("live chat reports provider token usage", async () => {
  process.env.OPENAI_API_KEY = "test-only-no-network";
  resetProviderDegradation();
  const sessionId = crypto.randomUUID();
  seed(sessionId);
  mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 120, completion_tokens: 20, total_tokens: 140 } }));
  try {
    const body = await (await handleChat(request(sessionId))).json();
    assert.equal(body.mode, "live");
    assert.deepEqual(body.usage, { promptTokens: 120, completionTokens: 20, totalTokens: 140 });
    assert.equal(body.analytics.totalTokens, 140, "existing analytics are unchanged");
  } finally { mock.restoreAll(); }
});

test("usage is derived when the provider omits the total and null when it omits usage", async () => {
  process.env.OPENAI_API_KEY = "test-only-no-network";
  resetProviderDegradation();
  const embed = () => mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  try {
    const a = crypto.randomUUID(); seed(a); embed();
    mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));
    assert.deepEqual((await (await handleChat(request(a))).json()).usage, { promptTokens: 10, completionTokens: 5, totalTokens: 15 });
    mock.restoreAll();
    const b = crypto.randomUUID(); seed(b); embed();
    mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: ANSWER } }] }));
    assert.equal((await (await handleChat(request(b))).json()).usage, null);
  } finally { mock.restoreAll(); }
});

test("the production log line carries metadata only, never user or source content", async () => {
  process.env.OPENAI_API_KEY = "test-only-no-network";
  resetProviderDegradation();
  const sessionId = crypto.randomUUID();
  seed(sessionId);
  mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 } }));
  const logged: string[] = [];
  const info = mock.method(console, "info", (...args: unknown[]) => { logged.push(args.map(String).join(" ")); });
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    const body = await (await handleChat(request(sessionId))).json();
    assert.equal(logged.length, 1);
    const entry = JSON.parse(logged[0]);
    assert.equal(entry.event, "chat");
    assert.equal(entry.requestId, body.requestId);
    assert.equal(entry.promptTokens, 7);
    for (const forbidden of ["secret-question-marker", "secret-source-marker", "secret-answer-marker", "Refund policy"]) {
      assert.ok(!logged[0].includes(forbidden), `log must not contain ${forbidden}`);
    }
  } finally {
    Object.assign(process.env, { NODE_ENV: previous });
    info.mock.restore();
    mock.restoreAll();
  }
});

test("failed requests do not gain observability fields or leak a requestId", async () => {
  const response = await handleChat(new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ sessionId: "bad", message: " " }) }));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal("requestId" in body, false);
});
