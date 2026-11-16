"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson, getBrowserSession, type SessionAnalytics } from "@/lib/browserSession";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    const session = getBrowserSession();
    setSessionId(session.id); setStorageWarning(!session.persistent); setBusy(true); setError("");
    try {
      const data = await fetchJson<SessionAnalytics>(`/api/analytics?sessionId=${encodeURIComponent(session.id)}`, { signal });
      if (!signal?.aborted) { setAnalytics(data); setUpdatedAt(new Date().toLocaleTimeString()); }
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load session analytics."); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { if (!controller.signal.aborted) void load(controller.signal); });
    const refresh = () => { void load(controller.signal); };
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, [load]);
  const ratings = analytics ? analytics.thumbsUp + analytics.thumbsDown : 0;
  const metrics = analytics ? [
    ["Conversations", analytics.conversations.toLocaleString(), "Conversations tracked in the current server session"],
    ["Messages", analytics.messages.toLocaleString(), "Successful user messages, not a traffic estimate"],
    ["Helpful ratings", ratings ? `${Math.round(analytics.thumbsUp / ratings * 100)}%` : "No ratings", `${analytics.thumbsUp} helpful · ${analytics.thumbsDown} unhelpful`],
    ["Average response time", analytics.messages ? `${analytics.avgResponseTime.toFixed(2)} s` : "—", "Measured end-to-end server response time"],
    ["Knowledge usage", analytics.messages ? `${analytics.knowledgeUsage.toFixed(0)}%` : "—", "Responses that used knowledge sources"],
    ["Model tokens", analytics.totalTokens.toLocaleString(), "No model tokens are used in offline demo mode"],
    ["Estimated model cost", `$${analytics.estimatedCostUsd.toFixed(6)}`, "Estimate in USD, not a bill; excludes hosting and ingestion"],
    ["Messages remaining", `${analytics.remainingMessages} / 6`, "Allowance for this temporary session"],
  ] : [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <main className="container mx-auto space-y-6 px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Session analytics</h1><p className="mt-2 text-sm text-slate-300">Actual activity for browser session {sessionId ? sessionId.slice(0, 8) : "loading…"}</p></div><nav aria-label="Analytics navigation" className="flex gap-4 text-sm text-blue-200"><Link href="/builder">Playground</Link><Link href="/deploy">Export</Link><Link href="/">Home</Link></nav></header>
        <Card className="border-white/10 bg-white/5 text-white"><CardHeader><CardTitle>A session snapshot, not a production dashboard</CardTitle><CardDescription className="text-slate-300">Metrics come from the current in-memory server session. They expire after 10 minutes or a server restart and may differ between server instances. Browser-saved chat is not included after server data expires. No historical trends, ROI, or visitor counts are inferred.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-4"><Button disabled={busy} onClick={() => load()}>{busy ? "Loading…" : "Refresh metrics"}</Button>{updatedAt && <p className="text-xs text-slate-300">{error ? "Last successful update" : "Updated"}: {updatedAt}</p>}{analytics?.expiresAt && <p className="text-xs text-slate-300">Expires: {new Date(analytics.expiresAt).toLocaleString()}</p>}</CardContent></Card>
        {storageWarning && <p role="alert" className="text-sm text-amber-200">Browser storage is unavailable; session identity may not survive navigation or reload.</p>}
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error} {analytics ? "The figures below are the last successful snapshot, not current data." : "Use Refresh metrics to retry."}</p>}
        {busy && <p role="status" className="text-sm text-blue-200">Fetching session metrics…</p>}
        {analytics && analytics.messages === 0 && <section className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-6"><h2 className="text-lg font-semibold">No activity in this server session yet</h2><p className="mt-2 text-sm text-slate-300">Try the fictional sample in the playground and send a message. If you already chatted, the temporary server data may have expired.</p><Button asChild className="mt-4 bg-blue-600 text-white"><Link href="/builder">Open playground</Link></Button></section>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, description]) => <Card key={label} className="min-w-0 border-white/10 bg-white/5 text-white backdrop-blur-sm"><CardHeader><CardTitle className="text-sm font-medium text-slate-300">{label}</CardTitle></CardHeader><CardContent><p className="break-words text-3xl font-bold">{value}</p><p className="mt-3 text-xs text-slate-400">{description}</p></CardContent></Card>)}</div>
      </main>
    </div>
  );
}
