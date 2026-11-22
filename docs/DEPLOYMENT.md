# Deployment

## Local

```powershell
npm ci
npm run dev          # offline mode unless OPENAI_API_KEY is set
```

For live mode, put `OPENAI_API_KEY=...` in `.env.local` (git-ignored). Restart the dev server after changing it. Confirm the mode:

```powershell
curl http://localhost:3000/api/health     # {"mode":"live"|"demo", ...}
```

## Validation before any release

```powershell
npm run lint; npm run typecheck; npm test; npm run eval; npm run build
```

CI (`.github/workflows/ci.yml`) runs the same steps without secrets.

## Vercel

Public deployments stay **keyless**: do not set `OPENAI_API_KEY` in Vercel, so the site runs the offline demo and cannot incur API cost.

1. Import the GitHub repository in Vercel (framework preset: Next.js, Node 22).
2. Add no environment variables.
3. Deploy a **preview** first. Check `/api/health` returns `"mode":"demo"`, load the sample on `/builder`, and ask a question that uses words from the sample.
4. Promote to production only after the preview passes.

Rollback: in the Vercel dashboard, open Deployments, select the previous production deployment and choose "Promote to Production" (or "Instant Rollback").

Serverless instances do not share memory, so uploaded knowledge may be lost between requests. This is a documented limitation of the demo, not a bug to fix with a database.

Do not point `rag-eval-kit` at a public deployment: it would measure the offline demo and consume shared capacity. Evaluate a local instance at an exact commit.
