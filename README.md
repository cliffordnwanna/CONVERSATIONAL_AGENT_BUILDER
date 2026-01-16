# CONVERSATIONAL_AGENT_BUILDER

A public demo platform for building, testing, and deploying **domain-specific AI chatbots** using prompt-engineered agents, intent-aware responses, and session-based analytics.  
This project demonstrates the **full lifecycle of a conversational AI system** — from template selection to live chat, analytics, and deployment.

> ⚠️ This is a **public demo MVP** designed for portfolio and evaluation purposes.  
> Authentication, persistence, and production hardening are intentionally out of scope.

---

## 🚀 Live Demo

👉 **Live App:** https://YOUR_VERCEL_LINK_HERE  
👉 **Demo Video:** https://LINK_TO_SCREEN_RECORDING  
👉 **GitHub Repo:** https://github.com/YOUR_USERNAME/conversational-agent-builder

---

## 📸 Screenshots

> Replace the links below with actual screenshots after deployment.

![Landing Page](./docs/images/landing.png)
![Bot Builder](./docs/images/builder.png)
![Analytics Dashboard](./docs/images/analytics.png)
![Deploy Widget](./docs/images/deploy.png)

---

## 🧠 What This Project Shows

This project was built to demonstrate **real-world conversational AI engineering**, not just chat UIs.

Key concepts showcased:

- Prompt-engineered AI agents
- Intent-aware conversational workflows
- Domain-specific response templates
- Session-based memory and analytics
- Web chat widget deployment
- Cost-controlled LLM usage
- Production-style architecture using modern frameworks

---

## ✨ Features

- **Prebuilt Bot Templates**
  - Sales / Lead Generation Assistant
  - FAQ / Knowledge Base Assistant

- **Live Chat Playground**
  - Test bots instantly without login
  - Real-time AI responses

- **Prompt-Engineered Agent Logic**
  - System prompts per domain
  - Guardrails to reduce hallucinations

- **Session-Based Analytics (10-minute TTL)**
  - Total conversations
  - Message count
  - CSAT (👍 / 👎 feedback)

- **Web Chat Widget (Demo)**
  - Embeddable script snippet
  - Realistic deployment flow

---

## 🏗️ Architecture Overview

User
↓
Web UI (Next.js + React)
↓
API Route (Agent Orchestrator)
↓
Prompt Templates (Sales / FAQ)
↓
OpenAI LLM
↓
Response + Session Metrics

yaml
Copy code

**Key design decisions**
- Stateless, in-memory sessions for zero cost
- Prompt-based orchestration instead of fine-tuning
- Single Next.js app for UI + backend
- Designed for Vercel free-tier deployment

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React |
| UI | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| LLM | OpenAI (GPT-4o-mini / GPT-3.5) |
| State | In-memory session store (TTL) |
| Hosting | Vercel |

---

## 📂 Project Structure

ai-conversational-agent-builder/
├── app/
│ ├── page.tsx # Landing page
│ ├── builder/ # Bot builder UI
│ ├── analytics/ # Analytics dashboard
│ ├── deploy/ # Widget deployment page
│ └── api/chat/route.ts # Agent orchestration
│
├── components/ # Reusable UI components
├── prompts/ # Prompt templates
├── lib/ # OpenAI client & session store
├── public/embed.js # Demo chat widget
└── README.md


---

## 🔐 Session & Cost Control

To keep this demo **safe and free to run**:

- Sessions expire after **10 minutes**
- Max messages per session enforced
- Token limits applied per request
- No database or background workers

---

## ▶️ Getting Started (Local)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/conversational-agent-builder.git
cd ai-conversational-agent-builder

2. Install dependencies
bash
Copy code
npm install

3. Configure environment
Create .env.local:

env
Copy code
OPENAI_API_KEY=your_api_key_here

4. Run locally
bash
Copy code
npm run dev
Visit http://localhost:3000


👤 Author
Chukwuma Clifford Nwanna
AI Engineer / AI Automation Engineer

LinkedIn: https://linkedin.com/in/cliffordnwanna

Portfolio: https://cliffordnwanna.github.io

📄 License
MIT License — free to use for learning and demonstration purposes.
