<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Conversational Agent Builder: guide for coding agents

## What this is

A Next.js 16 (App Router, TypeScript) demo of a document-grounded assistant. A visitor adds knowledge (PDF, DOCX, TXT, Markdown, pasted text or a public web page), configures an assistant, chats, and inspects the source passages behind each answer. Production runs in **live mode** (OpenAI embeddings and `gpt-4o-mini`) with a spending-capped server key; without a key, or if the key is rejected, it serves labelled keyword retrieval. All state is in server memory. It is an engineering demo, not a hosted agent service. Human-facing docs: `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `DESIGN.md` (UI system), `PRODUCT.md`.

## Run, test, verify

Requires Node 22.13+.

```bash
npm ci
npm run dev                 # offline mode unless OPENAI_API_KEY is set in .env.local
npm run build && npm run start
npm run lint && npm run typecheck
npm test                    # 56 unit/API tests; no network, no paid calls
npm run eval                # deterministic offline retrieval baseline
npm run e2e                 # API check against a running server (BASE_URL, default http://localhost:3000)
```

For an offline end-to-end run, start the server with the key unset (`OPENAI_API_KEY= npm run start -- -p 3300`) then `BASE_URL=http://localhost:3300 npm run e2e` (27 checks). Against a live-mode server the same command runs 28 checks and makes a few small paid calls; `E2E_REPEAT=n` adds an upload-then-ask repeat check. `GET /api/health` reports the mode (`demo` or `live`) and `degraded`.

Tests mock the OpenAI client with `node:test` `mock.method(openai.embeddings, "create", ...)`. They must never reach the network.

## HTTP contract

All routes are under `/api`. Session IDs are 8-100 characters of `[A-Za-z0-9_-]`; the browser uses a UUID.

| Route | Purpose |
|---|---|
| `GET /health` | `{ mode, degraded, storage, messageLimit, sessionTtlMinutes }` |
| `POST /knowledge` | multipart upload: fields `sessionId` and `files` (max 5 files, 5 MB each) |
| `PUT /knowledge` | JSON `{ sessionId, text }`, `{ sessionId, url }` or `{ sessionId, source: { id, title, type, content } }` |
| `GET /knowledge?sessionId=` | list sources; `DELETE` with `{ sessionId, id? }` removes one or all |
| `POST /chat` | JSON `{ sessionId, message, type: "faq" \| "sales", config?, history?, knowledgeIds?, knowledgeContent? }` |
| `GET /analytics?sessionId=` | measured in-memory session metrics |
| `POST /feedback` | `{ sessionId, messageId, value: "up" \| "down" \| null }` |
| `POST /scrape` | `{ url }`, bounded public-web extraction |

`POST /chat` success body: `reply`, `messageId`, `remainingMessages`, `usedKnowledge`, `chunks` (and the same list as `chunkPreviews`), `analytics`, `retrievalMode` (`semantic`, `lexical`, `inline`, `none`), `mode`, `degraded`, plus the observability fields `requestId` (also the `X-Request-Id` header), `timings` `{ retrievalMs, generationMs, totalMs }` and `usage` (`{ promptTokens, completionTokens, totalTokens }` or `null`). Errors: 400 invalid input, 409 a reply already in flight, 413 too large, 415 wrong content type, 429 the 6-message cap, 502/503 provider failure. Error bodies are `{ error }` with no provider detail.

Limits (defined in `lib/sessionStore.ts`, `lib/knowledgeStore.ts`, `lib/ingestion.ts`): 6 user messages per session, 10-minute idle expiry, in-memory only, 20 knowledge items and 100,000 extracted characters per session, 50,000 characters per document. There is no per-IP rate limiter.

## Code map

- `app/api/*/route.ts`: thin route handlers. `lib/chatHandler.ts` is the chat flow; `lib/chat.ts` validates input and retrieves.
- `lib/ingestion.ts`, `lib/scrape.ts`: extraction, chunking, atomic indexing, and public-URL fetching that rejects private and non-HTTP addresses (covered by `tests/scrape-safety.test.ts`).
- `lib/embeddings.ts`, `lib/vectorStore.ts`, `lib/knowledgeStore.ts`, `lib/sessionStore.ts`: embeddings, in-memory vectors and sessions.
- `lib/demo.ts`: runtime mode and the 5-minute degraded fallback when the key is rejected (401/403/quota).
- `app/` pages and `components/`: UI. Follow `DESIGN.md`.
- `tests/*.test.ts`, `scripts/e2e.ts`, `scripts/evaluate.ts`.

## Do not

- Do not commit `.env*`, print or log API keys, or put a key in client code or a browser-visible variable. Never set `OPENAI_API_KEY` for the Development environment on Vercel.
- Do not push, deploy, or change Vercel settings or environment variables without the owner's explicit approval.
- Do not move, delete or recreate existing tags (`baseline-v0`, `baseline-v1`, `release-v1.0.0`, `release-v1.1.0`). Do not rewrite history or force push.
- Do not remove or rename existing fields of the HTTP responses; additions only. The e2e script and the evaluator depend on them.
- Do not change the limits or the retrieval and prompt logic as a side effect of another task. Limit changes need matching docs and tests.
- Do not log question, answer or source text.
- Do not claim prompt-injection resistance, security guarantees, or evaluation results that have not been tested. The evaluator (`rag-eval-kit`) has not published a baseline yet.
- Do not add gradients, glass effects, emoji or a second accent colour to the UI.
- Do not edit `venv/` (a local Python environment that is not tracked), `node_modules/`, `.next/`, `.claude/` or `.vercel/`.
- Do not add Claude or AI co-author trailers to commits.
