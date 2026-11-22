import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { openai } from "../lib/openai";
import { createBatchEmbeddings } from "../lib/embeddings";
import { handleChat } from "../lib/chatHandler";
import { vectorStore } from "../lib/vectorStore";
import { isProviderFailure, markProviderDegraded, providerDegraded, resetProviderDegradation, runtimeMode } from "../lib/demo";

process.env.OPENAI_API_KEY = "test-only-no-network";
const authError = Object.assign(new Error("Incorrect API key"), { status: 401 });
const request = (sessionId: string) => new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ sessionId, message: "refund policy", type: "faq" }) });

test("only auth, permission and quota failures count as an unusable key", () => {
  assert.equal(isProviderFailure(authError), true);
  assert.equal(isProviderFailure({ status: 403 }), true);
  assert.equal(isProviderFailure({ status: 429, code: "insufficient_quota" }), true);
  assert.equal(isProviderFailure({ status: 429, code: "rate_limit_exceeded" }), false);
  assert.equal(isProviderFailure({ status: 500 }), false);
  assert.equal(isProviderFailure(new Error("network")), false);
  assert.equal(isProviderFailure(null), false);
});

test("an unusable key switches to offline mode, visibly, and can be reset", () => {
  resetProviderDegradation();
  assert.equal(runtimeMode(), "live");
  assert.equal(markProviderDegraded({ status: 500 }), false);
  assert.equal(runtimeMode(), "live");
  assert.equal(markProviderDegraded(authError), true);
  assert.equal(runtimeMode(), "demo");
  assert.equal(providerDegraded(), true);
  resetProviderDegradation();
  assert.equal(runtimeMode(), "live");
});

test("embedding with a rejected key indexes offline vectors instead of throwing", async () => {
  resetProviderDegradation();
  const create = mock.method(openai.embeddings, "create", async () => { throw authError; });
  try {
    const vectors = await createBatchEmbeddings(["alpha beta", "gamma"]);
    assert.equal(vectors.length, 2);
    assert.equal(vectors[0].length, 1024);
    assert.equal(runtimeMode(), "demo");
  } finally { mock.restoreAll(); resetProviderDegradation(); void create; }
});

test("non-auth provider errors still fail loudly", async () => {
  resetProviderDegradation();
  mock.method(openai.embeddings, "create", async () => { throw Object.assign(new Error("boom"), { status: 500 }); });
  try {
    await assert.rejects(createBatchEmbeddings(["x"]), /boom/);
    assert.equal(runtimeMode(), "live");
  } finally { mock.restoreAll(); }
});

test("chat answers from the offline path when generation is rejected, and reports degraded", async () => {
  resetProviderDegradation();
  const sessionId = crypto.randomUUID();
  vectorStore.add(sessionId, [{ id: "policy-chunk-0", content: "Refund policy: 30 days.", embedding: [1, 0], metadata: { knowledgeId: "policy", source: "Returns", type: "text" } }]);
  mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  mock.method(openai.chat.completions, "create", async () => { throw authError; });
  try {
    const response = await handleChat(request(sessionId));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.mode, "demo");
    assert.equal(body.degraded, true);
    assert.match(body.reply, /Offline demo/);
  } finally { mock.restoreAll(); resetProviderDegradation(); }
});

test("stored offline vectors are never compared with live query vectors", async () => {
  resetProviderDegradation();
  const sessionId = crypto.randomUUID();
  const offline = new Array<number>(1024).fill(0);
  offline[1] = 1;
  vectorStore.add(sessionId, [{ id: "p-chunk-0", content: "Refund policy: 30 days.", embedding: offline, metadata: { knowledgeId: "p", source: "Returns", type: "text" } }]);
  mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: "ok [1]" } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }));
  try {
    const body = await (await handleChat(request(sessionId))).json();
    assert.equal(body.retrievalMode, "lexical");
    assert.equal(body.chunks.length, 1);
  } finally { mock.restoreAll(); resetProviderDegradation(); }
});
