# Architecture

A Next.js 16 (App Router) application. There is no database: all state is held in server memory per session, and agent settings live in the browser.

## Request flow

```text
Browser ──► /api/knowledge (POST file | PUT text/url source)
              extract text → chunk (500 chars, 50 overlap) → embed → vector store
Browser ──► /api/chat
              validate → session (6-message cap, 10-min idle TTL)
              → retrieve top 3 chunks (filtered to the selected source IDs)
              → answer → return reply + the same chunks that were supplied to the model
```

| Concern | Where | Behaviour |
|---|---|---|
| Ingestion | `lib/ingestion.ts`, `lib/scrape.ts` | PDF, DOCX (Mammoth), TXT/Markdown, pasted text, bounded public-URL fetch with private-address blocking. Knowledge is published only after indexing completes. |
| Chunking | `lib/chunking.ts` | Fixed 500-character windows, 50 overlap. No structure awareness. |
| Embeddings | `lib/embeddings.ts` | Live: `text-embedding-3-small`, batches of 64, rejects incomplete responses. Offline: 1024-bin hashed term vector. |
| Vector store | `lib/vectorStore.ts` | In-memory cosine similarity, minimum score 0.2, source-ID filter applied before top-k. |
| Retrieval | `lib/chat.ts` | Live: `semantic`. Offline: keyword overlap, reported as `lexical`. Browser-held text on a cold serverless instance: `inline`. No match: `none`. |
| Generation | `lib/chatHandler.ts` | Live only: `gpt-4o-mini`, temperature 0.3, max 500 tokens, last 12 history messages. Offline returns matching excerpts and says so. |
| Sessions | `lib/sessionStore.ts` | Per-session turns, feedback and token counts, with a bounded lifetime. |
| Errors | `lib/validation.ts` | Typed `RequestError` for user mistakes; upstream 429 becomes 503; everything else becomes a generic 502 with no provider detail. |

## Modes

The mode is decided by one thing: whether `OPENAI_API_KEY` is set on the server (`runtimeMode()` in `lib/demo.ts`). `GET /api/health` reports it. The public deployment runs live mode with a spending-capped key; a deployment without a key runs the offline mode, makes no AI requests and costs nothing.

If a configured key is later rejected (401/403) or out of quota, the server serves the offline path for 5 minutes rather than returning errors. Responses then report `mode: "demo"` and `degraded: true`, and `/api/health` shows `degraded: true`.

## Observability

Every successful `POST /api/chat` response carries a `requestId` (also the `X-Request-Id` header), `timings` (`retrievalMs`, `generationMs`, `totalMs`) and `usage` (provider-reported prompt, completion and total tokens for answer generation, or `null`). In production the server logs one JSON line per chat with those values plus mode, retrieval mode, `degraded` and chunk count. It logs no question, answer or source text. Query-embedding and ingestion token usage are not reported. There is no tracing or metrics backend.

## Limits

| Limit | Value | Where |
|---|---|---|
| User messages per session | 6 | `lib/sessionStore.ts` |
| Idle expiry (chat session and knowledge) | 10 minutes | `lib/sessionStore.ts`, `lib/knowledgeStore.ts` |
| Storage | In server memory only; lost on restart or cold start | |
| Knowledge per session | 20 items, 100,000 extracted characters | `lib/knowledgeStore.ts` |
| Per document | 50,000 characters; 5 files per upload, 5 MB each, 12 MB request | `lib/ingestion.ts` |
| Retained sessions | 50 knowledge sessions, 500 chat sessions | |
| Rate limiting | Per session only. There is no per-IP limiter, so a new session resets the 6-message cap | |

## Privacy

In live mode, document text (for embeddings) and questions, history and retrieved passages (for the answer) are sent to OpenAI. Nothing is stored server-side beyond the in-memory session. The browser keeps settings, source copies and recent chat in local storage.

## Known limits

- Storage is in memory. On serverless platforms, instances are recycled and may not share memory, so uploaded knowledge can disappear between requests. The `inline` fallback exists to soften this and is not equivalent to semantic retrieval.
- No authentication, rate limiting beyond the 6-message session cap, or persistent analytics.
- Retrieval quality has been measured only by a small synthetic benchmark (`npm run eval`) until the `rag-eval-kit` baseline is published.
