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

The mode is decided by one thing: whether `OPENAI_API_KEY` is set on the server (`runtimeMode()` in `lib/demo.ts`). `GET /api/health` reports it. A public deployment without the key runs the offline mode, makes no AI requests, and costs nothing.

## Known limits

- Storage is in memory. On serverless platforms, instances are recycled and may not share memory, so uploaded knowledge can disappear between requests. The `inline` fallback exists to soften this and is not equivalent to semantic retrieval.
- No authentication, rate limiting beyond the 6-message session cap, or persistent analytics.
- Retrieval quality has been measured only by a small synthetic benchmark (`npm run eval`) until the `rag-eval-kit` baseline is published.
