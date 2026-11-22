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

Production runs in **live mode** with a spending-capped key; the key is never committed or exposed to the browser.

1. Import the GitHub repository in Vercel (framework preset: Next.js, Node 22.13+).
2. Create an OpenAI project with a spending cap and a restricted key. Add it as `OPENAI_API_KEY` for **Production and Preview**, type **Sensitive**. Do not add it to Development (Vercel stores Development values as readable).
3. Push to `main`; Vercel builds and deploys production. Check `GET /api/health`: with a working key it returns `"mode":"live","degraded":false`.
4. Run `BASE_URL=https://<your-url> E2E_REPEAT=20 npm run e2e`. In live mode this makes a few dozen small paid calls.

To run a keyless public demo instead, leave `OPENAI_API_KEY` unset; health then reports `"mode":"demo"` and no AI requests are made.

If a key is rejected or out of quota the app degrades to labelled keyword retrieval for 5 minutes (`degraded: true`). Rotate the key in OpenAI and Vercel, then redeploy.

**Rollback:** Vercel dashboard, Deployments, choose the previous production deployment, Instant Rollback. Tag `baseline-v0` marks the reviewed pre-deployment baseline; `release-v1.0.0` marks the first verified live release.

Serverless instances do not share memory, so uploaded knowledge can be lost between requests on a cold start. Twenty sequential upload-then-ask runs in production lost nothing, but concurrent traffic has not been tested.

Evaluate a local instance at an exact commit with the evaluator, not the public site: the public site's spend is real, and it is shared capacity.
