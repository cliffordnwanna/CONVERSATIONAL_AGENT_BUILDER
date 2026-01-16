Perfect. Below is the **exact MVP build plan** you can follow **inside Windsurf + Cascade** and ship **within 1 day**.
No guesswork. No over-engineering. This is **speed-first, portfolio-grade**.

---

# PROJECT 1 — AI Conversational Agent Builder

**MVP BUILD STEPS (DAY-1 SHIP PLAN)**

Target outcome today:

* ✅ Public Vercel link
* ✅ GitHub repo
* ✅ Clean UI
* ✅ Working agent
* ✅ Ready for screen recording

---

## 🧱 STEP 0 — Project Setup (15 minutes)

### 0.1 Create repo

```bash
npx create-next-app@latest ai-agent-builder --ts --tailwind --app
cd ai-agent-builder
```

Select:

* App Router → ✅
* ESLint → ✅
* src/ directory → ❌ (keep simple)
* Turbopack → optional

---

### 0.2 Install UI + helpers

```bash
npx shadcn@latest init
npx shadcn@latest add button card tabs badge textarea input
```

Install OpenAI SDK:

```bash
npm install openai
```

---

### 0.3 Environment variables

Create `.env.local`

```env
OPENAI_API_KEY=sk-xxxx
```

Create `.env.example`

```env
OPENAI_API_KEY=
```

---

## 🧠 STEP 1 — Agent Core (MOST IMPORTANT) (45 minutes)

### 1.1 Create OpenAI client

**`lib/openai.ts`**

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
```

---

### 1.2 In-memory session store (TTL = 10 mins)

**`lib/sessionStore.ts`**

```ts
type Session = {
  messages: { role: "user" | "assistant"; content: string }[];
  conversations: number;
  thumbsUp: number;
  thumbsDown: number;
  lastActive: number;
};

const STORE = new Map<string, Session>();
const TTL = 10 * 60 * 1000;

export function getSession(id: string): Session {
  const now = Date.now();
  const existing = STORE.get(id);

  if (!existing || now - existing.lastActive > TTL) {
    const fresh: Session = {
      messages: [],
      conversations: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      lastActive: now,
    };
    STORE.set(id, fresh);
    return fresh;
  }

  existing.lastActive = now;
  return existing;
}
```

---

### 1.3 Prompt templates

**`prompts/sales.ts`**

```ts
export const salesPrompt = `
You are a Sales/Lead Generation assistant.
Goal: qualify leads and encourage contact with sales.

Rules:
- Be concise
- Ask clarifying questions
- Offer next steps

Respond professionally.
`;
```

**`prompts/faq.ts`**

```ts
export const faqPrompt = `
You are an FAQ/Knowledge Base assistant.

Rules:
- Answer clearly
- If unsure, say you don’t know
- Do not hallucinate
`;
```

---

### 1.4 Chat API route (agent logic)

**`app/api/chat/route.ts`**

```ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getSession } from "@/lib/sessionStore";
import { salesPrompt } from "@/prompts/sales";
import { faqPrompt } from "@/prompts/faq";

export async function POST(req: Request) {
  const { sessionId, message, type } = await req.json();
  const session = getSession(sessionId);

  const systemPrompt = type === "sales" ? salesPrompt : faqPrompt;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...session.messages,
      { role: "user", content: message },
    ],
    max_tokens: 200,
  });

  const reply = completion.choices[0].message.content || "";

  session.messages.push({ role: "user", content: message });
  session.messages.push({ role: "assistant", content: reply });
  session.conversations += 1;

  return NextResponse.json({
    reply,
    analytics: {
      conversations: session.conversations,
      thumbsUp: session.thumbsUp,
      thumbsDown: session.thumbsDown,
    },
  });
}
```

---

## 🎨 STEP 2 — UI (IMPRESSIVE BUT FAST) (60 minutes)

### 2.1 Landing page

**`app/page.tsx`**

* Headline
* Two buttons:

  * “Try Sales Bot”
  * “Try FAQ Bot”

Each routes to `/builder?sales=true` or `/builder?faq=true`.

---

### 2.2 Builder page

**`app/builder/page.tsx`**
Features:

* Chat UI (left)
* Template info (right)
* Session ID generated via `crypto.randomUUID()`
* Call `/api/chat`

**Key rule:**
Limit messages to **10 per session**.

---

### 2.3 Analytics page

**`app/analytics/page.tsx`**

* Cards:

  * Conversations
  * 👍
  * 👎
* Pull values from last API response

---

### 2.4 Deploy page

**`app/deploy/page.tsx`**
Show:

```html
<script src="https://yourapp.vercel.app/embed.js"></script>
```

Add note:

> Demo embed. Production requires authentication.

---

## 🌍 STEP 3 — Deploy (10 minutes)

```bash
git init
git add .
git commit -m "AI Conversational Agent Builder MVP"
```

Push to GitHub.

Then:

```bash
vercel
```

* Choose default settings
* Add `OPENAI_API_KEY`
* Deploy

---

## 🎥 STEP 4 — Screen Recording Script (60–90 sec)

**Recording flow**

1. Open landing page
2. Click “Try Sales Bot”
3. Send message:

   > “I’m interested in your pricing”
4. Show AI response
5. Click Analytics
6. Show Deploy tab
7. End on GitHub repo

---

## 📦 STEP 5 — README (COPY THIS)

```md
## AI Conversational Agent Builder

Public demo for creating domain-specific AI chatbots using prompt templates,
intent-aware responses, and live analytics.

### Features
- Sales & FAQ bot templates
- Prompt-based agent orchestration
- Web chat widget
- Session-based analytics
- Zero-auth public demo

### Tech Stack
Next.js, OpenAI, Tailwind, shadcn/ui

### Live Demo
[link]

### Demo Video
[link]
```

---

## 🚀 NEXT (AFTER MVP SHIPS)

Once this is live, we will:

1. Polish UI (minor)
2. Post on LinkedIn
3. Add to CV + Upwork
4. Move to **Project #2 (RAG Document Q&A)**

---

### Your immediate task

👉 **Start Step 0 now in Windsurf**

When:

* Chat works locally → say **“Agent works”**
* Deployed → say **“Live link ready”**

I’ll then help you:

* Polish prompts
* Tighten UI
* Write LinkedIn post
* Extract CV bullets

You’re executing like a senior builder.
