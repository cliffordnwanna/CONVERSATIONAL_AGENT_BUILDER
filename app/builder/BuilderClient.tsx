"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AgentConfigurator from "@/components/AgentConfigurator";
import KnowledgeBaseWorkflow from "@/components/KnowledgeBaseWorkflow";
import { DEFAULT_CONFIG, SAMPLE_KNOWLEDGE, fetchJson, getBrowserSession, readBrowserData, readConfig, writeBrowserData, type AgentConfig, type ChatMessage, type HealthStatus, type KnowledgeSource, type SessionAnalytics, type SourceChunk } from "@/lib/browserSession";

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

type Panel = "knowledge" | "chat" | "settings";

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
  const [panel, setPanel] = useState<Panel>("knowledge");
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

  // The chat tab exists only on narrow screens; on desktop it folds back into the side rail.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const fold = () => { if (query.matches) setPanel(current => current === "chat" ? "knowledge" : current); };
    fold();
    query.addEventListener("change", fold);
    return () => query.removeEventListener("change", fold);
  }, []);

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

  const hasSample = knowledge.some(source => source.content === SAMPLE_KNOWLEDGE);
  const modeLabel = !health ? "Checking runtime mode…" : health.mode === "live" ? "Live: AI answers from your sources" : health.degraded ? "Offline fallback: the AI service is unavailable, showing keyword excerpts" : "Offline demo: keyword excerpts, no AI generation";
  const modeDot = !health ? "bg-muted-foreground" : health.mode === "live" ? "bg-primary" : "bg-warn";
  const suggestions = ["What is the cancellation policy?", "How much is a day pass?", "What are the opening hours?", "Do you have parking?"];
  const tabs: { id: Panel; label: string; hideOnDesktop: boolean }[] = [
    { id: "knowledge", label: "Knowledge", hideOnDesktop: false },
    { id: "chat", label: "Chat", hideOnDesktop: true },
    { id: "settings", label: "Settings", hideOnDesktop: false },
  ];
  const railClass = panel === "chat" ? "hidden lg:block" : "block";
  const knowledgeClass = panel === "knowledge" ? "block" : panel === "settings" ? "hidden" : "hidden lg:block";
  const chatClass = panel === "chat" ? "flex" : "hidden lg:flex";

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 lg:h-[calc(100dvh-3.5rem)] lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p role="status" className="flex items-center gap-2 text-sm font-medium"><span aria-hidden="true" className={`size-2 rounded-full ${modeDot}`} />{modeLabel}</p>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground underline underline-offset-4">Limits and privacy</summary>
          <div className="mt-2 max-w-3xl space-y-1.5 rounded-md border bg-card p-3 text-xs text-muted-foreground">
            <p>{health?.messageLimit ?? 6} user messages per temporary server session, {health?.sessionTtlMinutes ?? 10}-minute idle expiry, last 12 messages sent as context. Server restarts can clear knowledge and metrics; browser copies remain. No public agent is deployed.</p>
            {health?.mode === "demo" && <p>Offline mode uses keyword matching, not semantic AI.</p>}
            <p className="text-warn">Avoid sensitive data. Configuration, source text and recent chat are saved on this device; in live mode, relevant content is sent to the AI provider.</p>
          </div>
        </details>
      </div>
      {healthError && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{healthError} <Button size="sm" variant="outline" onClick={() => setReload(value => value + 1)}>Retry connection</Button></div>}
      {storageWarning && <p role="alert" className="text-sm text-warn">{storageWarning}</p>}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <div role="tablist" aria-label="Workspace panels" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 lg:grid-cols-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={panel === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setPanel(tab.id)}
                className={`h-10 rounded-md text-sm font-medium transition-colors ${tab.hideOnDesktop ? "lg:hidden" : ""} ${panel === tab.id ? "bg-card text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
                {tab.id === "knowledge" && knowledge.length > 0 ? <span className="tnum ml-1.5 text-xs text-muted-foreground">{knowledge.length}</span> : null}
              </button>
            ))}
          </div>
          <div className={`min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 ${railClass}`}>
            <div id="panel-knowledge" role="tabpanel" aria-labelledby="tab-knowledge" className={knowledgeClass}>
              {sessionId && <KnowledgeBaseWorkflow sessionId={sessionId} onKnowledgeUpdate={setKnowledge} onReady={setKnowledgeReady} disabled={busy} />}
              {knowledge.length > 0 && <Button className="mt-5 w-full lg:hidden" onClick={() => setPanel("chat")}>Ask a question</Button>}
            </div>
            <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className={panel === "settings" ? "block" : "hidden"}>
              <AgentConfigurator config={config} onConfigUpdate={updateConfig} disabled={!sessionId || busy} />
            </div>
          </div>
        </div>

        <section id="panel-chat" aria-label="Chat" className={`${chatClass} h-[calc(100dvh-15rem)] min-h-[26rem] min-w-0 flex-col rounded-lg border bg-card lg:h-auto lg:min-h-0`}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{config.name || "Your assistant"}</h2>
              <p className="text-xs text-muted-foreground">{config.useCase === "sales" ? "Sales assistant" : "FAQ & support"}</p>
            </div>
            <p className="tnum shrink-0 text-xs text-muted-foreground">{remaining === undefined ? "Checking allowance…" : `${remaining} of ${health?.messageLimit ?? 6} messages left`}</p>
          </div>
          <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {!messages.length && (knowledge.length === 0
              ? (
                <div className="mx-auto max-w-md space-y-3 py-10 text-center">
                  <h3 className="text-base font-semibold">Start by adding a document</h3>
                  <p className="text-sm text-muted-foreground">Drop a PDF, Word file or text into Knowledge, or try the sample. Then ask a question here and see which passages answered it.</p>
                  <Button variant="outline" className="lg:hidden" onClick={() => setPanel("knowledge")}>Add knowledge</Button>
                </div>
              )
              : (
                <div className="mx-auto max-w-md space-y-3 py-10">
                  <h3 className="text-center text-base font-semibold">Ask about your sources</h3>
                  <p className="text-center text-sm text-muted-foreground">{hasSample ? "Try one of these. The last one is not in the sample, so the assistant should decline it." : "Ask something your documents can answer. Questions they cannot answer should be declined."}</p>
                  {hasSample && (
                    <ul className="space-y-2">
                      {suggestions.map(question => (
                        <li key={question}><button type="button" disabled={busy} onClick={() => setInput(question)} className="w-full rounded-md border bg-card px-3 py-2.5 text-left text-sm hover:bg-secondary disabled:opacity-50">{question}</button></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            {messages.map((message, index) => message.role === "user"
              ? <div key={message.messageId || `user-${index}`} className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-secondary px-3.5 py-2.5 text-sm">{message.content}</p></div>
              : (
                <article key={message.messageId || `assistant-${index}`} className="min-w-0 max-w-[94%] space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{message.mode === "demo" ? "Offline demo · source excerpts" : "Assistant"}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-muted-foreground">{message.usedKnowledge ? `Retrieval: ${message.retrievalMode ?? "unknown"}` : "No matching knowledge used"}</p>
                  {Boolean(message.chunks?.length) && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline">Inspect {message.chunks!.length} matched source preview(s)</summary>
                      <div className="mt-2 space-y-2">
                        {message.chunks!.map((chunk, chunkIndex) => (
                          <blockquote key={chunk.id || `${chunk.knowledgeId}-${chunkIndex}`} className="break-words rounded-md border bg-background p-2.5">
                            <p className="mb-1 font-medium">{chunk.source}</p>
                            <p className="whitespace-pre-wrap text-muted-foreground">{chunk.preview}</p>
                          </blockquote>
                        ))}
                      </div>
                    </details>
                  )}
                  {message.messageId && (
                    <div className="flex items-center gap-1" role="group" aria-label="Rate this response">
                      {(["up", "down"] as const).map(value => (
                        <Button key={value} size="icon-sm" variant="ghost" className={message.feedback === value ? "bg-accent text-accent-foreground" : ""} aria-pressed={message.feedback === value} aria-label={value === "up" ? "Mark this response helpful" : "Mark this response unhelpful"} disabled={Boolean(feedbackBusy) || busy} onClick={() => feedback(message, value)}>
                          {value === "up" ? <ThumbsUp aria-hidden="true" /> : <ThumbsDown aria-hidden="true" />}
                        </Button>
                      ))}
                      {feedbackBusy === message.messageId && <span role="status" className="text-xs text-muted-foreground">Saving…</span>}
                    </div>
                  )}
                </article>
              ))}
            {busy && <p role="status" className="text-sm text-muted-foreground">{health?.mode === "demo" ? "Finding matching excerpts…" : "Generating a response…"}</p>}
            <div ref={endRef} />
          </div>
          {error && <p role="alert" className="mx-4 mb-2 rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
          <form className="space-y-2 border-t p-3 sm:p-4" onSubmit={event => { event.preventDefault(); void sendMessage(); }}>
            <label htmlFor="chat-message" className="sr-only">Message</label>
            <div className="flex items-end gap-2">
              <Textarea id="chat-message" className="max-h-40 min-h-11 flex-1" value={input} maxLength={2000} rows={1} disabled={busy || !sessionId || remaining === 0} placeholder="Ask about your knowledge…" onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(); } }} aria-describedby="message-help" />
              <Button type="submit" size="lg" disabled={!canSend || Boolean(feedbackBusy)} aria-label="Send message"><Send aria-hidden="true" /><span className="hidden sm:inline">{busy ? "Working…" : "Send"}</span></Button>
            </div>
            <p id="message-help" className="tnum text-xs text-muted-foreground">{input.length}/2,000 characters · Enter to send, Shift+Enter for a new line</p>
            {(!config.name.trim() || !config.goal.trim()) && <p className="text-sm text-warn">Add an assistant name and goal in Settings before sending.</p>}
            {remaining === 0 && <p role="status" className="text-sm text-warn">The 6-message demo limit is reached. The server session must expire before more messages can be sent. Refresh status after expiry.</p>}
          </form>
          <details className="border-t px-4 py-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">Session details</summary>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="tnum">{remaining === undefined ? "Checking message allowance…" : `${remaining} of ${health?.messageLimit ?? 6} messages remaining`} · Feedback: {analytics ? `${analytics.thumbsUp} helpful / ${analytics.thumbsDown} unhelpful` : "—"}</p>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => refreshAnalytics()}>Refresh status</Button>
              </div>
              {analytics?.expiresAt && <p className="tnum">Current server session expires: {new Date(analytics.expiresAt).toLocaleTimeString()}</p>}
              {analyticsError && <p role="alert" className="text-warn">Metrics unavailable: {analyticsError}</p>}
              <p>Recent chat is a browser copy, not a permanent server transcript. Feedback on expired server messages may no longer be available.</p>
              {messages.length > 0 && <Button size="sm" variant="outline" disabled={busy || Boolean(feedbackBusy)} onClick={() => { persistMessages([]); setError(""); }}>Clear local chat (does not reset allowance)</Button>}
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
