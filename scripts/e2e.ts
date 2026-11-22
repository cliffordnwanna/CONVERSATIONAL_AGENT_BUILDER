/**
 * End-to-end API check against a running server.
 *
 *   npm run build && npm start        (in another terminal)
 *   npm run e2e                       (BASE_URL defaults to http://localhost:3000)
 *
 * The checks adapt to the server's mode (GET /api/health). Offline mode needs no key and makes
 * no AI requests. Live mode (server has OPENAI_API_KEY) makes a handful of small paid calls and
 * additionally checks semantic retrieval; set E2E_REQUIRE_LIVE=1 to fail if the server is not live.
 * Set E2E_REPEAT=n to repeat the upload-then-ask check n times (detects in-memory loss on
 * serverless hosts).
 */
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const REPEAT = Number(process.env.E2E_REPEAT ?? "1");
let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  [${detail}]` : ""}`);
}

async function call(path: string, init: RequestInit = {}) {
  const response = await fetch(BASE + path, init);
  let body: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  try { body = await response.json(); } catch { /* non-JSON body */ }
  return { status: response.status, body };
}
const json = (method: string, path: string, body: unknown) =>
  call(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const sessionId = () => `e2e-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

const DOC =
  "Acme Widgets return policy. Customers may return any widget within 30 days of delivery for a full refund. " +
  "Refunds are issued to the original payment method within 5 business days. Opened software and custom " +
  "engraved items cannot be returned. Support is open Monday to Friday, 9am to 5pm Lagos time.";
const SHIPPING = "Standard shipping takes 3 to 5 business days. Express shipping takes 1 to 2 business days and costs 15 dollars.";

async function upload(sid: string, name: string, content: string) {
  const form = new FormData();
  form.set("sessionId", sid);
  form.append("files", new Blob([content], { type: "text/plain" }), name);
  return call("/api/knowledge", { method: "POST", body: form });
}

async function main() {
  const health = await call("/api/health");
  const live = health.body.mode === "live";
  console.log(`server: ${BASE}  mode: ${health.body.mode}`);
  if (process.env.E2E_REQUIRE_LIVE === "1" && !live) throw new Error("E2E_REQUIRE_LIVE=1 but the server is in demo mode");

  const sid = sessionId();
  const up = await upload(sid, "policy.txt", DOC);
  check("upload txt file", up.status === 200 && up.body?.success === true, String(up.status));
  const add = await json("PUT", "/api/knowledge", {
    sessionId: sid,
    source: { id: "faq-shipping", title: "Shipping FAQ", type: "text", content: SHIPPING },
  });
  check("add text source", add.status === 200, String(add.status));
  const list = await call(`/api/knowledge?sessionId=${sid}`);
  check("list knowledge", list.status === 200 && list.body.files.length + list.body.sources.length === 2);

  const chat = { sessionId: sid, type: "faq" };
  const first = await json("POST", "/api/chat", { ...chat, message: "How many days do I have to return a widget?" });
  check("chat uses knowledge", first.status === 200 && first.body.usedKnowledge === true && /30/.test(first.body.reply), String(first.body?.reply).slice(0, 60));
  check("retrieval mode matches runtime", first.body?.retrievalMode === (live ? "semantic" : "lexical"), first.body?.retrievalMode);
  check("source chunks returned", Array.isArray(first.body?.chunks) && first.body.chunks.length >= 1);

  const follow = await json("POST", "/api/chat", { ...chat, message: "And how long until I get the money back?" });
  check("follow-up answered", follow.status === 200 && !!follow.body?.reply);
  if (live) check("follow-up resolves context", /5/.test(follow.body.reply));

  const off = await json("POST", "/api/chat", { ...chat, message: "What is the CEO's favourite colour?" });
  const reply = String(off.body?.reply ?? "").toLowerCase();
  check("unrelated question does not invent an answer",
    off.status === 200 && (!off.body.usedKnowledge || /don't|do not|no matching|not have/.test(reply)));

  const filtered = await json("POST", "/api/chat", { ...chat, message: "How long does express shipping take?", knowledgeIds: ["faq-shipping"] });
  check("source filter restricts retrieval", filtered.status === 200 && filtered.body.chunks.every((c: { knowledgeId: string }) => c.knowledgeId === "faq-shipping"));

  const vote = await json("POST", "/api/feedback", { sessionId: sid, messageId: first.body?.messageId, value: "up" });
  check("feedback accepted", vote.status === 200, String(vote.status));
  const stats = await call(`/api/analytics?sessionId=${sid}`);
  check("analytics count real turns", stats.status === 200 && stats.body.remainingMessages === 2, `remaining=${stats.body?.remainingMessages}`);
  check("feedback for unknown message rejected", (await json("POST", "/api/feedback", { sessionId: sid, messageId: "nope", value: "up" })).status === 404);

  for (let i = 0; i < 2; i++) await json("POST", "/api/chat", { ...chat, message: `Is there a return window? (${i})` });
  check("6-message cap enforced", (await json("POST", "/api/chat", { ...chat, message: "one more" })).status === 429);

  const del = await json("DELETE", "/api/knowledge", { sessionId: sid, id: up.body?.id });
  check("delete a source", del.status === 200 && del.body.totalItems === 1);

  check("bad session id rejected", (await call("/api/analytics?sessionId=x")).status === 400);
  check("invalid JSON rejected", (await call("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: "{bad" })).status === 400);
  check("empty message rejected", (await json("POST", "/api/chat", { sessionId: sid, message: " " })).status === 400);
  check("non-multipart upload rejected", [400, 415].includes((await json("POST", "/api/knowledge", { sessionId: sid })).status));
  check("oversize upload rejected", [400, 413].includes((await upload(sessionId(), "big.txt", "a".repeat(3_000_000))).status));
  const exe = new FormData();
  exe.set("sessionId", sessionId());
  exe.append("files", new Blob(["MZ"], { type: "application/octet-stream" }), "x.exe");
  check("unsupported file type rejected", [400, 415].includes((await call("/api/knowledge", { method: "POST", body: exe })).status));
  for (const url of ["http://127.0.0.1/", `${BASE}/api/health`, "http://169.254.169.254/latest/meta-data/", "file:///etc/passwd"]) {
    const r = await json("POST", "/api/scrape", { url });
    check(`scrape blocks ${url}`, r.status >= 400 && !r.body?.content, String(r.status));
  }

  if (REPEAT > 1) {
    // Upload then ask from a fresh session each time; a miss means the knowledge was not found.
    let misses = 0;
    for (let i = 0; i < REPEAT; i++) {
      const s = sessionId();
      await upload(s, "policy.txt", DOC);
      const r = await json("POST", "/api/chat", { sessionId: s, type: "faq", message: "How many days do I have to return a widget?" });
      if (r.status !== 200 || !r.body.usedKnowledge) misses++;
    }
    check(`upload-then-ask repeated ${REPEAT}x`, misses === 0, `${misses} misses`);
  }

  console.log(`\n${passed}/${passed + failed} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch(error => { console.error(error); process.exit(1); });
