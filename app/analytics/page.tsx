"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Session analytics</h1>
        <p className="text-sm text-muted-foreground">Actual activity for browser session <span className="tnum">{sessionId ? sessionId.slice(0, 8) : "loading…"}</span></p>
      </header>

      <section className="max-w-3xl space-y-3 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">A session snapshot, not a production dashboard.</span> Metrics come from the current in-memory server session. They expire after 10 minutes or a server restart and may differ between server instances. Browser-saved chat is not included after server data expires. No historical trends, ROI, or visitor counts are inferred.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button variant="outline" disabled={busy} onClick={() => load()}>{busy ? "Loading…" : "Refresh metrics"}</Button>
          {updatedAt && <p className="tnum text-xs">{error ? "Last successful update" : "Updated"}: {updatedAt}</p>}
          {analytics?.expiresAt && <p className="tnum text-xs">Expires: {new Date(analytics.expiresAt).toLocaleString()}</p>}
        </div>
      </section>

      {storageWarning && <p role="alert" className="text-sm text-warn">Browser storage is unavailable; session identity may not survive navigation or reload.</p>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-card p-4 text-sm text-destructive">{error} {analytics ? "The figures below are the last successful snapshot, not current data." : "Use Refresh metrics to retry."}</p>}
      {busy && <p role="status" className="text-sm text-muted-foreground">Fetching session metrics…</p>}
      {analytics && analytics.messages === 0 && (
        <section className="max-w-3xl space-y-3 rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">No activity in this server session yet</h2>
          <p className="text-sm text-muted-foreground">Add a document in the builder, or try the sample, and send a message. If you already chatted, the temporary server data may have expired.</p>
          <Button asChild><Link href="/builder">Open the builder</Link></Button>
        </section>
      )}

      {metrics.length > 0 && (
        <dl className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 lg:grid-cols-4 [&>div]:border-b [&>div]:p-5 sm:[&>div:nth-child(odd)]:border-r lg:[&>div]:border-r lg:[&>div:nth-child(4n)]:border-r-0 sm:max-lg:[&>div:nth-child(even)]:border-r-0">
          {metrics.map(([label, value, description]) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="tnum mt-1 break-words text-3xl font-semibold tracking-tight">{value}</dd>
              <dd className="mt-2 text-xs text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  );
}
