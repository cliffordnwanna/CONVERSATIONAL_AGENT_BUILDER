

# PROJECT 1 — AI Conversational Agent Builder (PUBLIC DEMO MVP)

**Goal (non-negotiable):**

* Public demo link
* Looks like a real SaaS
* Zero / near-zero cost
* Built fast
* Easy to explain in 60–90s screen recording

---

## 1️⃣ MVP SCOPE (LOCKED)

### What users can do (in 2–3 minutes)

1. Open the app (no login)
2. Pick a template:

   * ✅ Sales / Lead Gen Bot
   * ✅ FAQ / Knowledge Base Bot
3. Test the chatbot immediately
4. See **basic analytics**
5. Copy an **embed snippet** (fake but realistic)

### What we deliberately skip (for speed)

* WhatsApp
* File uploads
* Persistent storage
* Background jobs
* Payments
* Fine-tuning (we do prompt-tuning only)

This is a **portfolio MVP**, not a startup.

---

## 2️⃣ TECH STACK (FINAL)

| Layer        | Choice                              | Why                     |
| ------------ | ----------------------------------- | ----------------------- |
| UI + Backend | **Next.js (App Router)**            | One repo, Vercel-native |
| UI           | **React + Tailwind + shadcn/ui**    | SaaS look, fast         |
| LLM          | **OpenAI (gpt-4o-mini or gpt-3.5)** | Cheapest, reliable      |
| State        | **In-memory session (10 min TTL)**  | Zero DB cost            |
| Analytics    | **In-memory counters**              | Enough for demo         |
| Hosting      | **Vercel (Free)**                   | 1-click deploy          |

---

## 3️⃣ CORE UX FLOW (THIS IS WHAT YOU’LL RECORD)

### Screen 1 — Landing

**Headline**

> Build a domain-specific AI chatbot in under 2 minutes

Buttons:

* “Try Sales Bot”
* “Try FAQ Bot”

---

### Screen 2 — Bot Builder

Left panel:

* Bot Name
* Tone selector (Professional / Friendly / Direct)
* Template preview (read-only)

Center:

* **Chat playground**
* User types → AI responds

Right panel:

* Intents (read-only but visible)
* Response templates
* Fallback behavior

👉 This gives the illusion of depth without building a full editor.

---

### Screen 3 — Analytics

Simple but powerful:

* Total conversations (session-based)
* Messages sent
* 👍 / 👎 feedback count

---

### Screen 4 — Deploy

* “Embed widget” section
* Copy-paste `<script>` snippet
* Note: “Demo embed — production deployment requires auth”

This screams **real product**.

---

## 4️⃣ AGENT LOGIC (SIMPLE BUT CORRECT)

We **do not overengineer**.

### Agent pipeline (per message)

```
User message
   ↓
Prompt-based intent classification (OpenAI)
   ↓
Template-based response generation
   ↓
Apply tone + guardrails
   ↓
Return response
   ↓
Update in-memory metrics
```

### Why this is portfolio-strong

* Shows **intent classification**
* Shows **prompt templates**
* Shows **agent orchestration**
* Shows **business logic**, not just chat

---

## 5️⃣ PROMPT DESIGN (VERY IMPORTANT)

You will ship **prompt templates** (clients LOVE this).

### Intent classification prompt (example)

```text
You are an intent classifier for a {BOT_TYPE} chatbot.

Intents:
- pricing
- product_info
- contact_sales
- faq
- unknown

User message:
"{user_message}"

Return JSON:
{
  "intent": "...",
  "confidence": 0.0-1.0
}
```

### Response template prompt

```text
You are a {BOT_TYPE} assistant.

Tone: {tone}

Intent: {intent}

Respond using this template:
{response_template}

User message:
{user_message}
```

👉 These prompts go in `/prompts/`
👉 You will mention **“downloadable prompt pack”** in README

---

## 6️⃣ FILE STRUCTURE (EXACT)

```
ai-agent-builder/
├── app/
│   ├── page.tsx              # landing
│   ├── builder/page.tsx      # bot builder
│   ├── analytics/page.tsx    # metrics
│   ├── api/
│   │   └── chat/route.ts     # agent logic
│
├── components/
│   ├── ChatWidget.tsx
│   ├── BotTemplateCard.tsx
│   ├── AnalyticsCards.tsx
│
├── prompts/
│   ├── intent-classifier.ts
│   ├── sales-bot.ts
│   ├── faq-bot.ts
│
├── lib/
│   ├── openai.ts
│   ├── sessionStore.ts      # in-memory TTL store
│
├── public/
│   └── embed.js              # fake widget script
│
├── README.md
└── .env.example
```

This looks **professional and real** on GitHub.

---

## 7️⃣ COST CONTROL (CRITICAL)

* Use **gpt-4o-mini** or **gpt-3.5-turbo**
* Hard-limit:

  * Max tokens per request
  * Max 10 messages per session
* Session auto-expiry after **10 minutes**
* No DB = no surprise bills

---

## 8️⃣ WHAT YOU WILL SAY ON LINKEDIN (PREVIEW)

> 🚀 Just deployed an AI Conversational Agent Builder
>
> Built a public demo that lets users create domain-specific chatbots (Sales & FAQ) with intent classification, prompt templates, and live analytics — all in a few minutes.
>
> Tech: Next.js, OpenAI, prompt engineering, agent orchestration
>
> Demo: [link]
> GitHub: [link]
>
> #AI #LLMs #PromptEngineering #AIEngineering #SaaS #Upwork

---

## 9️⃣ NEXT ACTION (DO THIS NOW)

**Reply with just:**

> “Give me the MVP build steps”

Then I will give you:

1. Step-by-step build order (Day 1 MVP)
2. Exact `route.ts` agent code
3. Session store code (TTL)
4. UI component checklist
5. Vercel deploy steps
6. 60-second screen recording script

You’re building this **the right way** — fast, focused, and portfolio-optimized.
