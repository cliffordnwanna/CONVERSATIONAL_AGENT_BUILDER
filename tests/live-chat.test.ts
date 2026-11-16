import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { openai } from "../lib/openai";
import { createBatchEmbeddings } from "../lib/embeddings";
import { handleChat } from "../lib/chatHandler";
import { vectorStore } from "../lib/vectorStore";
import { getSession } from "../lib/sessionStore";

process.env.OPENAI_API_KEY = "test-only-no-network";
const request = (sessionId: string, message = "refund policy") => new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ sessionId, message, type: "sales", config: { name: "Ada", tone: "friendly", goal: "Assist shoppers" } }) });

test("batch embedding preserves returned indices and fails rather than silently skipping a batch", async () => {
  const create = mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] }));
  try {
    assert.deepEqual(await createBatchEmbeddings(["first", "second"]), [[1, 0], [0, 1]]);
    create.mock.mockImplementation(async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
    await assert.rejects(createBatchEmbeddings(["first", "second"]), /Incomplete/);
    let calls = 0;
    create.mock.mockImplementation(async () => {
      calls++;
      if (calls === 2) throw new Error("provider unavailable");
      return { data: Array.from({ length: 64 }, (_, index) => ({ index, embedding: [1, 0] })) };
    });
    await assert.rejects(createBatchEmbeddings(Array.from({ length: 65 }, () => "source")), /provider unavailable/);
  } finally { mock.restoreAll(); }
});

test("live chat embeds once, retains configuration and history, and reports actual model usage", async () => {
  const sessionId = crypto.randomUUID();
  vectorStore.add(sessionId, [{ id: "policy-chunk-0", content: "Refund policy: 30 days.", embedding: [1, 0], metadata: { knowledgeId: "policy", source: "Returns", type: "text" } }]);
  const embed = mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
  const complete = mock.method(openai.chat.completions, "create", async () => ({ choices: [{ message: { content: "Refunds are accepted within 30 days [1]." } }], usage: { prompt_tokens: 120, completion_tokens: 20 } }));
  try {
    const response = await handleChat(request(sessionId));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(embed.mock.callCount(), 1);
    assert.equal(body.retrievalMode, "semantic");
    assert.equal(body.analytics.totalTokens, 140);
    const args = complete.mock.calls[0].arguments[0] as { messages: { role: string; content: string }[] };
    assert.match(args.messages[0].content, /Ada/);
    assert.match(args.messages[0].content, /friendly/);
    assert.match(args.messages[0].content, /30 days/);
    assert.equal(body.chunks[0].preview, "Refund policy: 30 days.");
    await handleChat(request(sessionId, "What did I just ask?"));
    const second = complete.mock.calls[1].arguments[0] as { messages: { role: string; content: string }[] };
    assert.equal(second.messages[1].content, "refund policy");
    assert.equal(second.messages[2].role, "assistant");
  } finally { mock.restoreAll(); vectorStore.clear(sessionId); }
});

test("upstream failure releases in-flight lock and does not charge a successful turn", async () => {
  const sessionId = crypto.randomUUID();
  mock.method(openai.chat.completions, "create", async () => { throw new Error("upstream failure"); });
  try {
    assert.equal((await handleChat(request(sessionId))).status, 502);
    assert.equal(getSession(sessionId).inFlight, false);
    assert.equal(getSession(sessionId).turns.length, 0);
  } finally { mock.restoreAll(); }
});

test("unrelated semantic knowledge abstains without model generation", async () => {
  const sessionId = crypto.randomUUID();
  vectorStore.add(sessionId, [{ id: "policy-chunk-0", content: "Refund policy: 30 days.", embedding: [1, 0], metadata: { knowledgeId: "policy", source: "Returns", type: "text" } }]);
  mock.method(openai.embeddings, "create", async () => ({ data: [{ index: 0, embedding: [0, 1] }] }));
  const complete = mock.method(openai.chat.completions, "create", async () => { throw new Error("Must not run"); });
  try {
    const result = await (await handleChat(request(sessionId, "unrelated subject"))).json();
    assert.equal(result.usedKnowledge, false);
    assert.equal(result.chunks.length, 0);
    assert.match(result.reply, /don't have information/);
    assert.equal(complete.mock.callCount(), 0);
  } finally { mock.restoreAll(); vectorStore.clear(sessionId); }
});
