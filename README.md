# Conversational Agent Builder

A no-code platform for building RAG-powered conversational AI agents. Upload your documents, configure agent behavior, and test in real time — all from the browser.

Built with Next.js 16, TypeScript, and OpenAI. Deployed on Vercel.

> **Demo Project** — Built as a portfolio piece for [Deep Learning Indaba](https://deeplearningindaba.com).

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## What It Does

1. **Configure** — Choose a use case, tone, and goal for your agent in a guided 4-step wizard
2. **Upload Knowledge** — Feed the agent PDF, TXT, DOCX, or Markdown files; paste text; or scrape a website URL
3. **Chat** — Test your agent in a live chat playground. Responses are grounded in your uploaded knowledge using RAG
4. **Review** — See analytics on conversations, satisfaction, and knowledge usage

---

## Features

- **RAG Pipeline** — Documents are chunked, embedded via OpenAI `text-embedding-3-small`, and retrieved with cosine similarity at query time
- **Multi-Format Ingestion** — PDF (via `pdf-parse`), DOCX, TXT, Markdown, pasted text, and web scraping
- **4-Step Agent Configurator** — Use case, tone, goal, and optional industry selection
- **Live Chat Playground** — Session-based chat with a 6-message limit, thumbs up/down feedback, and knowledge-source badges
- **Analytics Dashboard** — Conversation volume, satisfaction rate, response time, and cost savings metrics
- **Deploy Page** — Embed code snippets and pricing plan previews
- **Dark Theme** — Consistent `slate-900 → purple-900` gradient across all pages
- **Mobile Responsive** — Animated hamburger menu and fluid layouts

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.1.3 (App Router), React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| LLM | OpenAI GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small |
| PDF Parsing | pdf-parse v2 |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key — [platform.openai.com](https://platform.openai.com)

### Setup

```bash
git clone https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER.git
cd CONVERSATIONAL_AGENT_BUILDER
npm install
```

Create a `.env.local` file:

```
OPENAI_API_KEY=sk-your-key-here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx                  # Landing page
  layout.tsx                # Root layout and navigation
  builder/
    BuilderClient.tsx       # Agent builder — config, knowledge, chat
  analytics/page.tsx        # Analytics dashboard
  deploy/page.tsx           # Deployment options and pricing
  api/
    chat/route.ts           # RAG-powered chat endpoint
    knowledge/route.ts      # File upload, text, and URL ingestion
    scrape/route.ts         # Web scraping endpoint

components/
  AgentConfigurator.tsx     # 4-step configuration wizard
  KnowledgeUpload.tsx       # File upload with drag-and-drop
  KnowledgeBaseWorkflow.tsx # Website/text/manage tabs
  ui/                       # shadcn/ui primitives

lib/
  openai.ts                 # OpenAI client (lazy-initialized)
  embeddings.ts             # Single and batch embedding helpers
  chunking.ts               # Text chunking (500 chars, 50 overlap)
  vectorStore.ts            # In-memory cosine similarity search
  knowledgeStore.ts         # Session-scoped knowledge storage
  sessionStore.ts           # Chat session store (10-min TTL)

prompts/
  sales.ts                  # Sales/lead-gen system prompt
  faq.ts                    # FAQ/knowledge-base system prompt
```

---

## How RAG Works

```
Upload (PDF / TXT / URL)
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

When the AI uses knowledge base content, a 🧠 badge appears on the message, and you can expand it to see exactly which source chunks were used.

---

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Send a message, get a RAG-enhanced response |
| `POST` | `/api/knowledge` | Upload files (multipart form data) |
| `GET` | `/api/knowledge` | Retrieve session knowledge |
| `PUT` | `/api/knowledge` | Add text or scrape a URL |
| `POST` | `/api/scrape` | Standalone web scraping |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

---

## Deployment

The app is configured for zero-config deployment on Vercel:

1. Push to GitHub
2. Connect the repo in [vercel.com](https://vercel.com)
3. Add `OPENAI_API_KEY` to environment variables
4. Deploy

---

## Known Limitations

This is a demo project with intentional simplifications:

- **In-memory storage** — Knowledge, vectors, and sessions are stored in Node.js memory. Data resets on serverless cold starts (Vercel) or server restarts.
- **Session-scoped** — Each browser session has its own isolated knowledge base. There is no persistence or user accounts.
- **Message limit** — Chat sessions are capped at 6 messages to manage API costs.
- **Analytics are static** — The analytics dashboard shows demo data, not live metrics.

---

## Author

**Clifford Nwanna** — ML/AI Engineer

- GitHub: [@cliffordnwanna](https://github.com/cliffordnwanna)

---

## License

This project is a portfolio demonstration. Not intended for production use.
