"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AgentConfigurator from "@/components/AgentConfigurator";
import KnowledgeBaseWorkflow from "@/components/KnowledgeBaseWorkflow";
import { DEFAULT_CONFIG, fetchJson, getBrowserSession, readBrowserData, readConfig, writeBrowserData, type AgentConfig, type ChatMessage, type HealthStatus, type KnowledgeSource, type SessionAnalytics, type SourceChunk } from "@/lib/browserSession";

interface ChatResponse {
  reply: string;
  messageId: string;
  remainingMessages: number;
  usedKnowledge: boolean;
  chunks: SourceChunk[];
  analytics: SessionAnalytics;
  mode: "demo" | "live";
  retrievalMode: "semantic" | "lexical" | "inline" | "none";
}

export default function BuilderClient({ template = "" }: { template?: string }) {
  const search = useSearchParams();
  const selectedTemplate = template || search.get("template") || "";
  const [sessionId, setSessionId] = useState("");
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>([]);
  const [knowledgeReady, setKnowledgeReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState("");
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState("");
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [reload, setReload] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const sendLock = useRef(false);
  const feedbackLock = useRef(false);
  const chatController = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const session = getBrowserSession();
      const savedConfig = readConfig(session.id, selectedTemplate);
      let savedMessages = readBrowserData<ChatMessage[]>(session.id, "messages", []);
      if (!Array.isArray(savedMessages)) savedMessages = [];
      savedMessages = savedMessages.filter(message => ["user", "assistant"].includes(message?.role) && typeof message.content === "string").slice(-12);
      setSessionId(session.id); setConfig(savedConfig); setMessages(savedMessages);
      if (!session.persistent || !writeBrowserData(session.id, "config", savedConfig)) setStorageWarning("Browser storage is unavailable. This session and its settings may be lost when you leave or reload.");
    });
    return () => { active = false; chatController.current?.abort(); };
  }, [selectedTemplate]);

  const refreshAnalytics = useCallback(async (signal?: AbortSignal) => {
    if (!sessionId) return;
    try {
      const data = await fetchJson<SessionAnalytics>(`/api/analytics?sessionId=${encodeURIComponent(sessionId)}`, { signal });
      if (!signal?.aborted) { setAnalytics(data); setAnalyticsError(""); }
    } catch (err) { if (!signal?.aborted) setAnalyticsError(err instanceof Error ? err.message : "Session metrics are unavailable."); }
  }, [sessionId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<HealthStatus>("/api/health", { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) { setHealth(data); setHealthError(""); }
    }).catch(err => { if (!controller.signal.aborted) setHealthError(err instanceof Error ? err.message : "Could not check demo status."); });
    void Promise.resolve().then(() => { if (!controller.signal.aborted) void refreshAnalytics(controller.signal); });
    const refresh = () => { void refreshAnalytics(controller.signal); };
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, [refreshAnalytics, reload]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    if (!writeBrowserData(sessionId, "messages", next)) setStorageWarning("Browser storage is full or unavailable. New conversation changes cannot be saved across reloads.");
  };
  const updateConfig = (next: AgentConfig) => {
    setConfig(next);
    if (!writeBrowserData(sessionId, "config", next)) setStorageWarning("Browser storage is full or unavailable. Configuration changes cannot be saved across reloads.");
  };
  const remaining = analytics?.remainingMessages;
  const canSend = Boolean(sessionId && health && knowledgeReady && config.name.trim() && config.goal.trim() && input.trim() && !busy && !feedbackBusy && remaining !== 0);
  const sendMessage = async () => {
    if (!canSend || sendLock.current) return;
    sendLock.current = true; setBusy(true); setError("");
    const controller = new AbortController(); chatController.current = controller;
    const text = input.trim();
    try {
      const data = await fetchJson<ChatResponse>("/api/chat", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, message: text, type: config.useCase,
          config: { name: config.name.trim(), tone: config.tone, goal: config.goal.trim(), industry: config.industry.trim() },
          knowledgeIds: knowledge.map(source => source.id),
          knowledgeContent: knowledge.map(source => ({ id: source.id, title: source.title.slice(0, 200), content: source.content, source: (source.source || source.title).slice(0, 2048) })),
          history: messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
        }),
      });
      if (typeof data.reply !== "string" || !data.messageId) throw new Error("The server returned an incomplete reply. Please retry.");
      persistMessages([...messages, { role: "user", content: text }, {
        role: "assistant", content: data.reply, messageId: data.messageId,
        chunks: data.chunks ?? [], usedKnowledge: data.usedKnowledge,
        retrievalMode: data.retrievalMode, mode: data.mode, feedback: null,
      }].slice(-12) as ChatMessage[]);
      setAnalytics({ ...data.analytics, remainingMessages: data.remainingMessages });
      setInput("");
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "The message could not be sent. Your text is still here to retry.");
        void refreshAnalytics();
      }
    } finally { sendLock.current = false; setBusy(false); }
  };
  const feedback = async (message: ChatMessage, value: "up" | "down") => {
    if (!message.messageId || feedbackLock.current) return;
    feedbackLock.current = true; setFeedbackBusy(message.messageId); setError("");
    const nextValue = message.feedback === value ? null : value;
    try {
      const data = await fetchJson<{ analytics: SessionAnalytics }>("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, messageId: message.messageId, value: nextValue }) });
      setAnalytics(data.analytics);
      persistMessages(messages.map(item => item.messageId === message.messageId ? { ...item, feedback: nextValue } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Feedback could not be saved. Please retry."); }
    finally { feedbackLock.current = false; setFeedbackBusy(""); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div><h1 className="text-xl font-bold">Agent playground</h1><p className="text-xs text-slate-300">Browser session {sessionId ? sessionId.slice(0, 8) : "loading…"}</p></div>
          <nav aria-label="Playground navigation" className="flex flex-wrap gap-4 text-sm text-blue-200"><Link href="/">Home</Link><Link href="/analytics">Session analytics</Link><Link href="/deploy">Export</Link></nav>
        </div>
      </header>
      <main className="container mx-auto space-y-5 px-4 py-6">
        <div className="space-y-2 rounded-xl border border-blue-400/25 bg-blue-500/10 p-4">
          <p role="status" className="font-medium">{health ? health.mode === "demo" ? "Offline demo — source excerpts, no AI generation" : "Live mode — AI-generated answers with retrieved sources" : "Checking runtime mode…"}</p>
          <p className="text-sm text-slate-300">{health?.messageLimit ?? 6} user messages per temporary server session · {health?.sessionTtlMinutes ?? 10}-minute idle expiry · last 12 messages sent as context. Server restarts can clear knowledge and metrics; browser copies remain. No public agent is deployed.</p>
          {health?.mode === "demo" && <p className="text-xs text-slate-300">Local keyword matching is not semantic AI. Add a source and ask about its contents. Live mode requires the operator to configure an API key.</p>}
          <p className="text-xs text-amber-200">Avoid sensitive data. Configuration, source text, and recent chat are saved on this device; in live mode, relevant content is sent to the AI provider.</p>
          {healthError && <div role="alert" className="text-sm text-red-200">{healthError} <Button size="sm" variant="ghost" onClick={() => setReload(value => value + 1)}>Retry connection</Button></div>}
          {storageWarning && <p role="alert" className="text-sm text-amber-200">{storageWarning}</p>}
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className="min-w-0 space-y-5">
            <AgentConfigurator config={config} onConfigUpdate={updateConfig} disabled={!sessionId || busy} />
            {sessionId && <KnowledgeBaseWorkflow sessionId={sessionId} onKnowledgeUpdate={setKnowledge} onReady={setKnowledgeReady} disabled={busy} />}
          </div>
          <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-800/90 text-white lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2"><span>3. Test {config.name || "your assistant"}</span><Badge variant="secondary">{config.useCase === "sales" ? "Sales" : "FAQ & support"}</Badge></CardTitle>
              <CardDescription className="text-slate-300">{health?.mode === "demo" ? "See the matching source excerpts; this mode does not compose answers or reason about conversation history." : "Inspect answers and matched source previews. Generated answers can be wrong; verify important information."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="max-h-[60vh] min-h-64 space-y-4 overflow-y-auto rounded-lg bg-slate-950/50 p-3 sm:p-4">
                {!messages.length && <div className="space-y-4 py-8 text-center"><p className="text-4xl" aria-hidden="true">✦</p><h2 className="font-semibold">A small, inspectable demo</h2><p className="text-sm text-slate-300">Load the fictional sample, then try a question.</p><Button variant="outline" className="h-auto whitespace-normal" onClick={() => setInput("What is the cancellation policy?")} disabled={busy}>Try: What is the cancellation policy?</Button></div>}
                {messages.map((message, index) => <div key={message.messageId || `user-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><article className={`min-w-0 max-w-[95%] rounded-xl p-3 sm:max-w-[90%] ${message.role === "user" ? "bg-gradient-to-r from-purple-600 to-blue-600" : "border border-slate-600 bg-slate-700"}`}>
                  <p className="mb-2 text-xs font-semibold text-slate-200">{message.role === "user" ? "You" : message.mode === "demo" ? "Offline demo · source excerpts" : "Assistant"}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                  {message.role === "assistant" && <>
                    <p className="mt-3 text-xs text-slate-300">{message.usedKnowledge ? `Retrieval: ${message.retrievalMode ?? "unknown"}` : "No matching knowledge used"}</p>
                    {Boolean(message.chunks?.length) && <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-blue-200">Inspect {message.chunks!.length} matched source preview(s)</summary><div className="mt-2 space-y-2">{message.chunks!.map((chunk, chunkIndex) => <blockquote key={chunk.id || `${chunk.knowledgeId}-${chunkIndex}`} className="break-words rounded border-l-2 border-blue-400 bg-slate-900/40 p-2 text-xs"><p className="mb-1 font-semibold">{chunk.source}</p><p className="whitespace-pre-wrap text-slate-300">{chunk.preview}</p></blockquote>)}</div></details>}
                    {message.messageId && <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Rate this response">{(["up", "down"] as const).map(value => <Button key={value} size="sm" variant={message.feedback === value ? "secondary" : "ghost"} aria-pressed={message.feedback === value} aria-label={value === "up" ? "Mark this response helpful" : "Mark this response unhelpful"} disabled={Boolean(feedbackBusy) || busy} onClick={() => feedback(message, value)}>{value === "up" ? "Helpful" : "Not helpful"}</Button>)}{feedbackBusy === message.messageId && <span role="status" className="text-xs">Saving…</span>}</div>}
                  </>}
                </article></div>)}
                {busy && <p role="status" className="text-sm text-blue-200">{health?.mode === "demo" ? "Finding matching excerpts…" : "Generating a response…"}</p>}
                <div ref={endRef} />
              </div>
              {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
              <form className="space-y-3" onSubmit={event => { event.preventDefault(); void sendMessage(); }}>
                <label htmlFor="chat-message" className="block text-sm font-medium">Message</label>
                <Textarea id="chat-message" value={input} maxLength={2000} rows={3} disabled={busy || !sessionId || remaining === 0} placeholder="Ask about your knowledge…" onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(); } }} aria-describedby="message-help" />
                <div className="flex flex-wrap items-center justify-between gap-3"><p id="message-help" className="text-xs text-slate-300">{input.length}/2,000 characters · Shift+Enter for a new line</p><Button type="submit" disabled={!canSend || Boolean(feedbackBusy)} className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-white">{busy ? "Working…" : "Send message"}</Button></div>
                {(!config.name.trim() || !config.goal.trim()) && <p className="text-sm text-amber-200">Add an agent name and goal before sending.</p>}
                {remaining === 0 && <p role="status" className="text-sm text-amber-200">The 6-message demo limit is reached. The server session must expire before more messages can be sent. Refresh status after expiry.</p>}
              </form>
              <div className="space-y-2 border-t border-slate-600 pt-3 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2"><p>{remaining === undefined ? "Checking message allowance…" : `${remaining} of ${health?.messageLimit ?? 6} messages remaining`} · Feedback: {analytics ? `${analytics.thumbsUp} helpful / ${analytics.thumbsDown} unhelpful` : "—"}</p><Button variant="ghost" size="sm" disabled={busy} onClick={() => refreshAnalytics()}>Refresh status</Button></div>
                {analytics?.expiresAt && <p>Current server session expires: {new Date(analytics.expiresAt).toLocaleTimeString()}</p>}
                {analyticsError && <p role="alert" className="text-amber-200">Metrics unavailable: {analyticsError}</p>}
                <p>Recent chat is a browser copy, not a permanent server transcript. Feedback on expired server messages may no longer be available.</p>
                {messages.length > 0 && <Button size="sm" variant="ghost" disabled={busy || Boolean(feedbackBusy)} onClick={() => { persistMessages([]); setError(""); }}>Clear local chat (does not reset allowance)</Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
