# Conversational Agent Builder

Build and inspect a document-grounded assistant: ingest knowledge, configure its behavior, ask questions, inspect retrieved excerpts, and measure actual session activity.

Built with Next.js 16, TypeScript, and OpenAI. The [live demo](https://conversational-agent-builder.vercel.app) runs in live mode (semantic retrieval and AI-generated answers) with a spending-capped OpenAI key. Locally it also runs **without an API key** in an explicitly labeled extractive demo mode.

> **Engineering portfolio demo, not a production SaaS.** No fabricated analytics, paid plans, or claims of production deployment. Session storage is intentionally ephemeral.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)
[![Live demo](https://img.shields.io/badge/Live_demo-Vercel-black?logo=vercel)](https://conversational-agent-builder.vercel.app)

---

## What It Does

1. **Configure** — Choose your agent's name, use case, tone, goal, and industry
2. **Upload Knowledge** — Feed the agent PDF, TXT, DOCX, or Markdown files; paste text; or scrape a website URL
3. **Chat** — Test your agent in a live chat playground. Responses are grounded in your uploaded knowledge using RAG
4. **Review** — See analytics on conversations, satisfaction, and knowledge usage

---

## Features

- **Two honest modes** — Offline keyword retrieval returns exact excerpts, not generated answers. Live mode uses `text-embedding-3-small` and GPT-4o-mini.
- **Inspectable RAG** — Source-ID filtering before top-k search, similarity cutoff, one query embedding per turn, numbered source excerpts, and explicit no-match behavior.
- **Reliable ingestion** — PDF, real DOCX extraction via Mammoth, UTF-8 TXT/Markdown, pasted text, and bounded public-web scraping. Indexing completes before knowledge is published; failed embeddings never silently corrupt alignment.
- **Configured conversations** — Name, tone, goal, use case, and industry reach the model; bounded conversation history supports follow-up questions.
- **Measured analytics** — Completed turns, actual latency, source-context usage, replaceable feedback, reported model tokens, and indicative generation cost. No invented savings.
- **Demo lifecycle** — Sample onboarding, six completed turns per session, source deletion, browser-local state, and configuration export.
- **Regression evidence** — Automated API/core tests, mocked live-provider tests, deterministic retrieval evaluation, and CI.
- **One-workspace interface** — A light, calm layout with a drag-and-drop knowledge panel (PDF, DOCX, TXT, Markdown, pasted text, web page), a chat with pinned composer, and a settings tab. On phones the three panels become tabs. Designed for desktop and mobile; see [DESIGN.md](DESIGN.md).

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| LLM | OpenAI GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small |
| PDF Parsing | pdf-parse v2 |
| Deployment | Vercel — [live demo](https://conversational-agent-builder.vercel.app) |

---

## Getting Started

### Prerequisites

- Node.js **22.13+** (Node 22 is used in CI) and npm.
- Optional: an OpenAI API key for live mode. No key is needed for the local demo.

### Setup

```bash
git clone https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER.git
cd CONVERSATIONAL_AGENT_BUILDER
npm ci
```

For offline mode, skip configuration. For live mode, copy `.env.example` to `.env.local` and set the key **only on the server**:

```dotenv
OPENAI_API_KEY=your-server-side-key
```

Live ingestion sends document text to OpenAI; chat sends the question, bounded history, and retrieved excerpts. Only use documents you have permission to process. Never upload secrets or sensitive personal data to a public demo. Restart the server and re-upload sources when switching modes.

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In Builder, load sample knowledge, ask a question using words from a source, expand its excerpts, leave feedback, and open Analytics.

### A 90-second portfolio walkthrough

1. Show the mode badge: distinguish offline extraction from live generation.
2. Load the sample; explain chunking, indexing, and source provenance.
3. Ask a supported question, then an unrelated one; inspect evidence and abstention.
4. Change the configuration and show a follow-up conversation in live mode.
5. Leave feedback and show measured analytics, then run `npm run eval`.
6. State the limits: ephemeral storage, synthetic evaluation, no authentication or public-agent hosting.

---

## Project Structure

```text
app/
  page.tsx                  # Landing page
  layout.tsx                # Root layout and navigation
  builder/
    BuilderClient.tsx       # Agent builder — config, knowledge, chat
  analytics/page.tsx        # Analytics dashboard
  deploy/page.tsx           # Local configuration export and widget concept
  api/
    chat/route.ts           # RAG-powered chat endpoint
    knowledge/route.ts      # File upload, text, and URL ingestion
    scrape/route.ts         # Public-web extraction endpoint
    analytics/route.ts      # Measured session analytics
    feedback/route.ts       # Idempotent per-answer votes
    health/route.ts         # Runtime mode and demo limits

components/
  AgentConfigurator.tsx     # Assistant settings panel (persisted in the browser)
  KnowledgeBaseWorkflow.tsx # Sample, files, text, website, and source management
  ui/                       # shadcn/ui primitives

lib/
  openai.ts                 # OpenAI client (lazy-initialized)
  embeddings.ts             # Single and batch embedding helpers
  chunking.ts               # Text chunking (500 chars, 50 overlap)
  vectorStore.ts            # In-memory cosine similarity search
  knowledgeStore.ts         # Session-scoped knowledge storage
  sessionStore.ts           # Bounded chat sessions, metrics (10-min idle TTL)
  chat.ts / chatHandler.ts  # Validated retrieval, prompts, chat orchestration
  ingestion.ts / scrape.ts  # Extraction, atomic indexing, bounded public fetch
  demo.ts                  # Explicit offline lexical mode

tests/                     # Regression tests; live calls are mocked
scripts/evaluate.ts        # Small labeled retrieval benchmark

prompts/
  sales.ts                  # Sales/lead-gen system prompt
  faq.ts                    # FAQ/knowledge-base system prompt
```

---

## How RAG Works

```text
Upload (PDF / DOCX / TXT / Markdown / URL / pasted text)
  → Extract text
  → Chunk into 500-char segments
  → Generate embeddings (text-embedding-3-small)
  → Store in vector store

Chat message
  → Embed the query
  → Cosine similarity search (top 3 chunks)
  → Inject retrieved context into system prompt
  → GPT-4o-mini generates a grounded response
```

This diagram describes **live mode**. Offline mode stores deterministic local lexical vectors and ranks exact keyword overlap; it does not perform semantic inference or call an LLM.

The response exposes the same top-three excerpts supplied to generation, not a second independent retrieval. A badge means context was supplied, **not proof that every generated claim is supported**. Prompts request numbered citations and abstention, but model grounding is not guaranteed.

On a serverless cold start, browser-held knowledge can provide a bounded, source-filtered lexical fallback, explicitly reported as `inline`. It is not equivalent to semantic retrieval. Client history is limited to user/assistant roles and 12 messages; server history is preferred when available.

---

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Send a message, get a RAG-enhanced response |
| `POST` | `/api/knowledge` | Upload files (multipart form data) |
| `GET` | `/api/knowledge` | Retrieve session knowledge |
| `PUT` | `/api/knowledge` | Add text or scrape a URL |
| `DELETE` | `/api/knowledge` | Remove a source and its vectors, or clear knowledge |
| `POST` | `/api/scrape` | Bounded public-web extraction |
| `GET` | `/api/analytics?sessionId=...` | Actual in-memory session metrics |
| `POST` | `/api/feedback` | Set/change/remove a vote on a completed answer |
| `GET` | `/api/health` | Mode, storage, and demo limits |

Chat accepts `{sessionId, message, type, config?, history?, knowledgeIds?, knowledgeContent?}`. Inline knowledge entries require `{id,title,content}`. Feedback accepts `{sessionId,messageId,value}` where value is `up`, `down`, or `null`. Delete accepts `{sessionId,id?}`. Session IDs must be 8–100 alphanumeric, underscore, or hyphen characters; the browser generates a UUID. Invalid input returns 400/413, overlapping chat requests 409, and exhausted message quota 429.

### Chat response

`POST /api/chat` returns JSON with the fields below. The last four were added for observability; all earlier fields are unchanged.

| Field | Meaning |
|---|---|
| `reply`, `messageId` | The answer text and an ID used for feedback |
| `usedKnowledge`, `chunks`, `chunkPreviews`, `retrievalMode` | The source passages supplied to the model and how they were found (`semantic`, `lexical`, `inline` or `none`) |
| `mode`, `degraded` | `live` or `demo`; `degraded: true` means the API key was rejected or out of quota and the keyword fallback answered |
| `remainingMessages`, `analytics` | The session allowance and measured session metrics |
| `requestId` | A UUID for this request. The same value is sent in the `X-Request-Id` response header. It is not the `messageId` |
| `timings` | `{ retrievalMs, generationMs, totalMs }` in milliseconds. Retrieval includes the query embedding in live mode; generation is the model call (or building the offline excerpt reply); total is the whole handler |
| `usage` | `{ promptTokens, completionTokens, totalTokens }` as reported by the provider for answer generation, or `null` when there was no model call or no usage was returned. Query-embedding tokens are not included |

Errors (400, 409, 413, 429, 502, 503) keep their existing shape and carry no `requestId`.

In production the server writes one JSON log line per successful chat with the `requestId`, mode, retrieval mode, `degraded`, chunk count, timings and token counts. It never contains questions, answers or source text; a unit test asserts this.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and check TypeScript |
| `npm test` | 56 automated unit/API regression tests; no paid API calls |
| `npm run eval` | Deterministic offline retrieval baseline |
| `npm run e2e` | End-to-end API check against a running server (`BASE_URL`, default `http://localhost:3000`); adapts to offline/live mode (27 checks offline, 28 live) |
| `npm run eval -- --live` | Opt-in paid semantic embedding evaluation; requires an exported `OPENAI_API_KEY` |

The evaluation reports hit@1, recall@3, MRR@3, no-match accuracy, and per-query latency over **10 synthetic questions / 4 documents**. This is a regression smoke baseline, not a claim of real-world accuracy. Live generation is covered with mocked provider responses, not an LLM judge. The script does not load `.env.local`; export the key explicitly for live evaluation. CI runs lint, typecheck, tests, offline evaluation, and production build without credentials.

---

## Deployment

**Live:** https://conversational-agent-builder.vercel.app, deployed from `main` on Vercel. Production runs in **live mode** with a server-side `OPENAI_API_KEY` that has an OpenAI project spending cap. If the key is rejected (401/403) or out of quota, the server serves labelled keyword retrieval for 5 minutes instead of erroring (`mode: "demo"`, `degraded: true`; also shown by `GET /api/health`).

**Verification:** locally, 56 unit tests plus lint, typecheck and the 27-check offline end-to-end run. The production site was last verified at tag `release-v1.1.0` (26 API checks and 31 browser-UI checks, 0 lost uploads in 20 sequential upload-then-ask runs). That was before the `requestId`, `timings` and `usage` response fields were added, so production has not been re-verified with them until it is redeployed.

**Configure your own deployment:** import the repo into Vercel (Next.js preset, Node 22.13+), then add `OPENAI_API_KEY` for Production and Preview with the **Sensitive** type, and use a key from an OpenAI project with a spending cap. Leave it unset to get a keyless offline demo instead. Never commit the key or set it in a client-visible variable. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for validation and rollback (Vercel Deployments, then Instant Rollback).

**Privacy:** in live mode, uploaded document text, questions and conversation history are sent to OpenAI. Do not upload sensitive or personal data to the public demo. The application's own log line holds request metadata only (see Chat response); it does not log questions, answers or source text.

**Evaluation:** this app is the target of the evaluator linked below. Baseline and case study are pending; no evaluation results are claimed here.

Before a production release, add authentication and tenant authorization, durable document/vector/session storage, centralized rate limits, retention/deletion controls, tracing and metrics beyond the per-request fields and log line, and a larger domain-specific evaluation set. The deployment screen exports a browser-local configuration; it does not provision hosted agents or billing.

---

## Known Limitations

This is a demo project with intentional simplifications:

- **In-memory storage** — Knowledge, vectors, and sessions are stored in Node.js memory. Data resets on serverless cold starts (Vercel) or server restarts.
- **Session-scoped, not authenticated** — Random browser session IDs separate demo data but are not a substitute for user authorization. Local browser state and downloaded exports may contain document text; use only non-sensitive data.
- **Bounded demo storage** — Knowledge expires after 10 minutes of inactivity; at most 50 knowledge sessions are retained. Limits include 20 items and 100,000 extracted characters per knowledge session, 50,000 characters per document, and per upload at most 5 files of 5 MB each (12 MB request). Chat retains at most 500 sessions and six completed turns each, with a 10-minute idle expiry. Limits reset after eviction/restart.
- **Browser/server lifetime differs** — Browser-held content can survive a server restart; server analytics, votes, and chat quotas do not. Clear local state when using shared computers.
- **Extractive scraping** — Public HTTP(S) HTML/text only; no JavaScript rendering or authenticated sites. Fetches are DNS-pinned, redirects revalidated, and bytes/time bounded. Respect website terms and copyright.
- **Model limitations** — Prompts tell the model to treat sources as untrusted and to cite them, but prompt-injection resistance has **not** been tested and should not be assumed. Citations do not guarantee factual accuracy; source-context usage is not answer correctness.
- **No per-IP rate limiting** — The 6-message cap is per session and a new session resets it, so spend on the public demo is bounded only by the OpenAI key's spending cap.
- **Test coverage gaps** — The repeated-upload check was sequential, not concurrent. The browser interface has no automated tests.
- **Costs are estimates** — Generation cost uses indicative GPT-4o-mini text-token rates ($0.15/M input, $0.60/M output); embeddings and hosting are excluded. Verify current provider pricing.

- **Dependency audit** — The verified lockfile has no production advisories (`npm audit --omit=dev`). Full audit still reports seven moderate development-only advisories through the latest available `typescript-eslint`/`minimatch` chain; no incompatible major override was forced. Recheck advisories before deploying.

The earlier planning files under `docs/` are historical design notes; this README and executable tests describe current behavior.

---

## Measuring it

This app is the first target of [rag-eval-kit](https://github.com/cliffordnwanna/agent-skills/tree/main/skills/rag-eval-kit), a separate local toolkit that evaluates its retrieval and answers against a reviewed question set. Results will be published there once the benchmark is approved; none are claimed yet.

---

## Author

**Clifford Nwanna** — ML/AI Engineer

- GitHub: [@cliffordnwanna](https://github.com/cliffordnwanna)

---

## License

Apache-2.0 — see [LICENSE](LICENSE). This is a portfolio demonstration, not a production service.
