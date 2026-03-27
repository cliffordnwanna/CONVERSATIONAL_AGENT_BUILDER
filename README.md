# 🤖 Conversational Agent Builder

**Build AI Agents That Actually Understand Your Business**

A RAG-powered (Retrieval-Augmented Generation) SaaS application built with **Next.js 16**, **TypeScript**, and **Tailwind CSS v4**. It enables users to create conversational AI agents using their own knowledge bases through file uploads, text input, and website scraping—no coding required.

**Live Demo**: [Deployed on Vercel](https://your-agent.vercel.app) *(update with your deployment URL)*

---

## Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Pages & Routes](#-pages--routes)
- [API Reference](#-api-reference)
- [RAG Architecture](#-rag-architecture)
- [Component Reference](#-component-reference)
- [Configuration](#-configuration)
- [Prompt Templates](#-prompt-templates)
- [Embed Widget](#-embed-widget)
- [Scripts](#-scripts)

---

## 🎯 Features

- **4-Step Agent Configuration** — Use case, tone, goal, and optional industry selection via the `AgentConfigurator` component
- **RAG-Powered Knowledge Base** — Upload PDF, TXT, DOCX, or MD files; paste text; or scrape websites. Content is chunked, embedded, and stored for semantic retrieval
- **In-Memory Vector Store** — Cosine-similarity search over OpenAI `text-embedding-3-small` embeddings with configurable top-K retrieval
- **Real-time Chat Testing** — 6-message session limit, thumbs-up/thumbs-down feedback, and 🧠 badges when the AI uses knowledge base content
- **Multi-Source Knowledge Management** — Unified tabbed interface (Website / Upload / Text / Manage) with per-source metadata (word count, chunks created, knowledge ID)
- **Analytics Dashboard** — Session-based metrics with conversation volume chart, satisfaction rate, response time, cost savings, and knowledge usage rate
- **Deploy Page** — Embed code snippets, pricing plan selector, and deployment stats
- **Mobile-Responsive Navigation** — Hamburger menu with animated toggle via `MobileNav`
- **Comprehensive Server Logging** — Emoji-prefixed debug logs for knowledge uploads, RAG searches, and chat requests

---

## 🚀 Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.1.3 (App Router) | React 19.2.3, React Compiler enabled |
| **Language** | TypeScript 5 | Strict mode, path alias `@/` |
| **Styling** | Tailwind CSS v4 + tw-animate-css | Dark gradient theme (`slate-900 → purple-900`) |
| **UI Components** | shadcn/ui (Radix primitives) | Button, Card, Badge, Input, Textarea, Tabs |
| **Icons** | Lucide React | Upload, Globe, FileText, FolderOpen, ArrowLeft |
| **LLM** | OpenAI `gpt-4o-mini` | Temperature 0.3, max 150 tokens |
| **Embeddings** | OpenAI `text-embedding-3-small` | Batch processing in groups of 10 |
| **State** | In-memory (Node.js global) | `knowledgeStore` (Map), `vectorStore` (Map), `sessionStore` (Map) |
| **PDF Parsing** | pdf-parse (external package) | Configured in `next.config.ts` via `serverExternalPackages` |
| **Hosting** | Vercel (Free tier) | Zero-config deployment |

---

## 📁 Project Structure

```
CONVERSATIONAL_AGENT_BUILDER/
├── app/
│   ├── layout.tsx                    # Root layout with global nav (Home, Builder, Analytics, Deploy)
│   ├── page.tsx                      # Landing page — hero, stats, feature cards, templates
│   ├── globals.css                   # Tailwind v4 imports and theme variables
│   ├── analytics/
│   │   └── page.tsx                  # Analytics dashboard with charts and session history
│   ├── builder/
│   │   ├── page.tsx                  # Builder page wrapper with Suspense fallback
│   │   └── BuilderClient.tsx         # Main builder — chat, knowledge tabs, config, session stats
│   ├── components/
│   │   └── MobileNav.tsx             # Animated hamburger menu for mobile viewports
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts             # POST — RAG-powered chat (embedding search → GPT-4o-mini)
│   │   ├── knowledge/
│   │   │   └── route.ts             # POST (file upload), GET (session data), PUT (text/URL)
│   │   └── scrape/
│   │       └── route.ts             # POST — Standalone web scraping endpoint
│
├── components/
│   ├── AgentConfigurator.tsx          # 4-step config wizard (use case → tone → goal → knowledge)
│   ├── BackButton.tsx                 # Reusable back-navigation button (Link or onClick)
│   ├── KnowledgeBaseWorkflow.tsx      # Standalone knowledge workflow (URL scrape, text, manage)
│   ├── KnowledgeUpload.tsx            # File upload + paste-text component with status tracking
│   └── ui/                            # shadcn/ui primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
├── lib/
│   ├── openai.ts                      # OpenAI client initialization (uses OPENAI_API_KEY)
│   ├── embeddings.ts                  # createEmbedding() and createBatchEmbeddings()
│   ├── chunking.ts                    # chunkText() — 500-char chunks, 50-char overlap
│   ├── vectorStore.ts                 # InMemoryVectorStore — add, search (cosine similarity), clear
│   ├── knowledgeStore.ts              # Global Map<sessionId, KnowledgeSession> + cleanup utilities
│   ├── sessionStore.ts                # Session Map with 10-minute TTL (messages, feedback counters)
│   └── utils.ts                       # cn() helper (clsx + tailwind-merge)
│
├── prompts/
│   ├── sales.ts                       # System prompt for Sales / Lead Gen agents
│   └── faq.ts                         # System prompt for FAQ / Knowledge Base agents
│
├── public/
│   └── embed.js                       # Embeddable chat widget script (demo)
│
├── docs/
│   ├── prd.md                         # Product requirements document
│   ├── Implementation.md              # Implementation notes
│   ├── tests.md                       # Test documentation
│   ├── upgrade.md                     # Upgrade notes
│   ├── product_catalogue.txt          # Sample knowledge base file
│   └── test_file.txt                  # Test file
│
├── images/
│   └── README.md                      # Placeholder for screenshots
│
├── components.json                    # shadcn/ui configuration
├── eslint.config.mjs                  # ESLint flat config
├── next.config.ts                     # Next.js config (React Compiler, serverExternalPackages)
├── package.json                       # Dependencies and scripts
├── postcss.config.mjs                 # PostCSS with @tailwindcss/postcss
└── tsconfig.json                      # TypeScript config (strict, path aliases)
```

---

## 📊 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- An **OpenAI API key** ([platform.openai.com](https://platform.openai.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER.git
cd CONVERSATIONAL_AGENT_BUILDER

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your API key:
#   OPENAI_API_KEY=sk-...

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for GPT-4o-mini and text-embedding-3-small |

---

## 🗺️ Pages & Routes

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page with hero section, stats (10K+ agents, 80% cost reduction, 5M+ messages, 99.9% uptime), feature grid, and four template cards (Sales Assistant, FAQ Bot, Support Agent, Knowledge Base) |
| `/builder` | `app/builder/page.tsx` → `app/builder/BuilderClient.tsx` | Main agent builder — left panel: 4-step `AgentConfigurator` + session stats; center panel: chat playground with 6-message limit, feedback buttons, and knowledge usage badges |
| `/analytics` | `app/analytics/page.tsx` | Dashboard showing total conversations, satisfaction rate, avg response time, cost savings, conversation volume bar chart, knowledge base usage %, recent sessions list, performance insights, and ROI calculator |
| `/deploy` | `app/deploy/page.tsx` | Embed code snippets (standard + advanced with config), three pricing plans (Starter $0, Professional $49, Enterprise $199), and deployment stats |

---

## 🔌 API Reference

### `POST /api/chat` — `app/api/chat/route.ts`

Send a message and receive a RAG-enhanced AI response.

**Request body:**
```json
{
  "sessionId": "uuid",
  "message": "What products do you offer?",
  "type": "sales" | "support",
  "knowledgeIds": ["uuid1", "uuid2"],
  "hasKnowledge": true
}
```

**Behavior:**
1. Creates an embedding of the user message via `createEmbedding()` (`lib/embeddings.ts`)
2. Searches the `vectorStore` for the top 3 most similar chunks for the session (`lib/vectorStore.ts`)
3. If relevant knowledge is found, builds an enhanced prompt grounding the response in that context
4. Falls back to the `salesPrompt` or `faqPrompt` template (`prompts/sales.ts`, `prompts/faq.ts`) when no knowledge is available
5. Calls OpenAI `gpt-4o-mini` with temperature 0.3 and max 150 tokens

**Response:**
```json
{
  "reply": "Based on our catalog...",
  "analytics": {
    "conversations": 1,
    "thumbsUp": 0,
    "thumbsDown": 0,
    "usedKnowledge": true,
    "chunks": 156
  },
  "sessionId": "uuid"
}
```

---

### `POST /api/knowledge` — `app/api/knowledge/route.ts`

Upload files to the knowledge base (multipart form data).

**Form fields:**
- `sessionId` (string, required)
- `files` (File[], accepts `.txt`, `.pdf`, `.docx`, `.md`)
- `pastedText` (string, optional)

**Behavior:**
1. Parses uploaded files — extracts text from PDF (basic regex extraction), TXT (UTF-8), DOCX (basic regex), or MD
2. Stores files in the global `knowledgeStore` (`lib/knowledgeStore.ts`)
3. Chunks content via `chunkKnowledge()` (`lib/chunking.ts`) — 500-char chunks with 50-char overlap
4. Creates batch embeddings via `createBatchEmbeddings()` (`lib/embeddings.ts`)
5. Appends vector chunks to the `vectorStore` (`lib/vectorStore.ts`)

---

### `GET /api/knowledge` — `app/api/knowledge/route.ts`

Retrieve knowledge for a session.

**Query params:** `?sessionId=uuid`

**Response:** `{ "files": [...], "sources": [...] }`

---

### `PUT /api/knowledge` — `app/api/knowledge/route.ts`

Add text content or scrape a website URL.

**Request body (text):**
```json
{
  "sessionId": "uuid",
  "text": "Our return policy allows..."
}
```

**Request body (URL):**
```json
{
  "sessionId": "uuid",
  "url": "https://example.com/faq"
}
```

**URL scraping behavior:** Fetches the page, strips `<script>` and `<style>` tags, extracts visible text (limited to 10,000 chars), then chunks and embeds it.

---

### `POST /api/scrape` — `app/api/scrape/route.ts`

Standalone web scraping endpoint (used by `KnowledgeBaseWorkflow`).

**Request body:** `{ "url": "https://example.com" }`

**Response:**
```json
{
  "title": "Example Page",
  "content": "Extracted text content...",
  "description": "Meta description",
  "success": true
}
```

Content is limited to 5,000 characters. Extracts `<title>` and meta description via regex.

---

## 🧠 RAG Architecture

The RAG pipeline is implemented across four library files:

### 1. Text Chunking — `lib/chunking.ts`

- `chunkText(text, chunkSize=500, overlap=50)` — Splits text into overlapping chunks
- `chunkKnowledge(knowledge[])` — Iterates over knowledge items, filters by `status === "completed"`, chunks each, and returns `{ id, content, metadata: { source, type } }[]`

### 2. Embeddings — `lib/embeddings.ts`

- `createEmbedding(text)` — Calls OpenAI `text-embedding-3-small` for a single text string
- `createBatchEmbeddings(texts[])` — Processes texts in batches of 10, returns `number[][]`

### 3. Vector Store — `lib/vectorStore.ts`

- `InMemoryVectorStore` class backed by `Map<sessionId, VectorChunk[]>`
- `add(sessionId, chunks)` — **Appends** chunks (does not overwrite existing)
- `search(sessionId, queryEmbedding, topK=3)` — Returns the top-K most similar chunks using cosine similarity
- `getAll(sessionId)` / `clear(sessionId)` — Debugging utilities

### 4. Knowledge Store — `lib/knowledgeStore.ts`

- Global `Map<string, KnowledgeSession>` stored on `global.globalKnowledgeStore` (persists across hot reloads)
- `KnowledgeSession` contains `files: KnowledgeFile[]` and `sources: KnowledgeSource[]`
- Cleanup utilities: `cleanupOldSessions(maxAge)` — removes sessions older than the specified age (default 24h); `initializeCleanup()` — runs on load, prunes sessions >2h old and caps total at 50

### 5. Session Store — `lib/sessionStore.ts`

- `getSession(id)` — Returns or creates a session with message history, feedback counters, and a 10-minute TTL

### Data Flow

```
User Input (file / text / URL)
    │
    ▼
POST or PUT /api/knowledge
    │
    ├── Extract text content
    ├── Store in knowledgeStore (global Map)
    ├── chunkKnowledge() → 500-char chunks
    ├── createBatchEmbeddings() → OpenAI text-embedding-3-small
    └── vectorStore.add() → append to session vectors
    
User Chat Message
    │
    ▼
POST /api/chat
    │
    ├── createEmbedding(query)
    ├── vectorStore.search(sessionId, embedding, topK=3)
    ├── Build enhanced prompt with retrieved context
    └── OpenAI gpt-4o-mini → Response with usedKnowledge flag
```

---

## 🧩 Component Reference

### Page Components

| Component | File | Description |
|---|---|---|
| `Home` | `app/page.tsx` | Landing page with hero, stats, feature cards, template cards, and CTA |
| `BuilderClient` | `app/builder/BuilderClient.tsx` | Core builder: manages session ID, unified knowledge state, chat messages, analytics, and renders the 3-panel layout (config / chat / stats) |
| `AnalyticsPage` | `app/analytics/page.tsx` | Analytics dashboard with static demo data, bar chart, session list, and ROI calculator |
| `DeployPage` | `app/deploy/page.tsx` | Deployment options: embed snippets, pricing plans, and deployment stats |

### Shared Components

| Component | File | Description |
|---|---|---|
| `AgentConfigurator` | `components/AgentConfigurator.tsx` | 4-step wizard: Step 1 — Use case (Customer Support, Sales Assistant, Knowledge Base, HR Assistant); Step 2 — Tone (Professional, Friendly, Casual, Expert); Step 3 — Goal (Generate Leads, Provide Support, Share Information, Drive Conversions) + optional industry; Step 4 — Renders `renderKnowledgeBaseStep` callback |
| `KnowledgeBaseWorkflow` | `components/KnowledgeBaseWorkflow.tsx` | Standalone knowledge UI with Website/Text/Manage tabs, URL scraping via `/api/scrape`, and text input |
| `KnowledgeUpload` | `components/KnowledgeUpload.tsx` | File upload + paste-text component with drag-and-drop area, file size display, and upload status |
| `BackButton` | `components/BackButton.tsx` | Reusable navigation button supporting both `href` (Link) and `onClick` modes |
| `MobileNav` | `app/components/MobileNav.tsx` | Animated hamburger menu with slide-down panel for mobile navigation |

### UI Primitives (shadcn/ui) — `components/ui/`

`badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `tabs.tsx`, `textarea.tsx`

---

## 🔧 Configuration

### Agent Configuration Options

Defined in `components/AgentConfigurator.tsx`:

**Use Cases:** Customer Support, Sales Assistant, Knowledge Base, HR Assistant

**Tones:** Professional, Friendly, Casual, Expert

**Goals:** Generate Leads, Provide Support, Share Information, Drive Conversions

**Industries (optional):** Technology, Healthcare, Finance, Retail, Education, Real Estate, Consulting, Manufacturing, Other

### Session Limits

| Setting | Value | Location |
|---|---|---|
| Chat message limit | 6 user messages per session | `app/builder/BuilderClient.tsx` |
| File upload limit | 5 files, 10MB total | UI labels in `BuilderClient.tsx` |
| Max file size | 3MB per file | UI labels in `BuilderClient.tsx` |
| Accepted file types | `.txt`, `.pdf`, `.docx`, `.md` | File input `accept` attribute |
| Content size limit (files) | 50,000 characters | `app/api/knowledge/route.ts` |
| Content size limit (scrape via PUT) | 10,000 characters | `app/api/knowledge/route.ts` |
| Content size limit (scrape via POST) | 5,000 characters | `app/api/scrape/route.ts` |
| Chunk size | 500 characters | `lib/chunking.ts` |
| Chunk overlap | 50 characters | `lib/chunking.ts` |
| RAG top-K results | 3 chunks | `app/api/chat/route.ts`, `lib/vectorStore.ts` |
| Session TTL | 10 minutes | `lib/sessionStore.ts` |
| Knowledge session cleanup | 2 hours (on load) | `lib/knowledgeStore.ts` |
| Max sessions before pruning | 50 | `lib/knowledgeStore.ts` |
| OpenAI temperature | 0.3 | `app/api/chat/route.ts` |
| OpenAI max tokens | 150 | `app/api/chat/route.ts` |

---

## 📝 Prompt Templates

### Sales / Lead Gen — `prompts/sales.ts`

Used when `type === "sales"` and no knowledge base context is found. Guides the AI to qualify leads, ask clarifying questions, and encourage contact with sales.

### FAQ / Knowledge Base — `prompts/faq.ts`

Default fallback prompt. Instructs the AI to answer clearly, admit uncertainty, and avoid hallucination.

### RAG-Enhanced Prompt

When relevant knowledge chunks are found, the chat API overrides both templates with a grounded prompt that instructs the model to use **only** the retrieved information and say "I don't have information about that in my knowledge base" when the answer isn't present.

---

## 📦 Embed Widget

`public/embed.js` provides a demo-only embeddable chat widget. It renders:

- A floating toggle button (bottom-right, gradient circle)
- A chat window (350×500px) with header, message area, and input field
- Configurable via `window.AgentForgeConfig` (agentId, position, theme, welcomeMessage)

**Standard embed:**
```html
<script src="https://your-agent.vercel.app/embed.js" data-agent-id="your-agent-id"></script>
```

**Advanced embed with config:**
```html
<script>
  window.AgentForgeConfig = {
    agentId: "your-agent-id",
    position: "bottom-right",
    theme: "dark",
    welcomeMessage: "Hello! How can I help you today?"
  };
</script>
<script src="https://your-agent.vercel.app/embed.js"></script>
```

---

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 📄 License

This project is a portfolio MVP / demo application.

---

**Built with Next.js 16, TypeScript, OpenAI, and modern RAG architecture**
