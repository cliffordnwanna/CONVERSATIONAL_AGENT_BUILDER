"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson, readBrowserData, writeBrowserData, SAMPLE_KNOWLEDGE, type KnowledgeSource } from "@/lib/browserSession";

interface ApiSource {
  id: string;
  title?: string;
  name?: string;
  content: string;
  type?: string;
  url?: string;
  source?: string;
}
interface KnowledgeResponse { files?: ApiSource[]; sources?: ApiSource[]; source?: ApiSource; id?: string; title?: string; content?: string }

function normalize(item: ApiSource): KnowledgeSource {
  return {
    id: item.id,
    title: item.content.startsWith("Atlas Studio — fictional demo company") ? "Atlas Studio (fictional sample)" : item.title || item.name || "Knowledge source",
    content: item.content,
    type: item.type === "url" ? "url" : item.type === "text" ? "text" : "file",
    source: item.url || item.source || item.name || item.title,
    localOnly: false,
  };
}
function responseSources(data: KnowledgeResponse): KnowledgeSource[] {
  const items = data.sources || data.files ? [...(data.files ?? []), ...(data.sources ?? [])] : data.source ? [data.source] : data.id && typeof data.content === "string" ? [{ id: data.id, title: data.title, content: data.content, type: "text" }] : [];
  return items.filter(item => typeof item.id === "string" && typeof item.content === "string").map(normalize);
}

export default function KnowledgeBaseWorkflow({ sessionId, onKnowledgeUpdate, onReady, disabled = false }: {
  sessionId: string;
  onKnowledgeUpdate: (sources: KnowledgeSource[]) => void;
  onReady?: (ready: boolean) => void;
  disabled?: boolean;
}) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const callback = useRef(onKnowledgeUpdate);
  const readyCallback = useRef(onReady);
  const lock = useRef(false);
  useEffect(() => { callback.current = onKnowledgeUpdate; readyCallback.current = onReady; }, [onKnowledgeUpdate, onReady]);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    readyCallback.current?.(false);
    let saved = readBrowserData<KnowledgeSource[]>(sessionId, "knowledge", []);
    if (!Array.isArray(saved)) saved = [];
    saved = saved.filter(item => typeof item?.id === "string" && typeof item.content === "string").map(item => ({ ...item, localOnly: true }));
    fetchJson<KnowledgeResponse>(`/api/knowledge?sessionId=${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        const remote = responseSources(data);
        const merged = [...remote, ...saved.filter(item => !remote.some(source => source.id === item.id))];
        setSources(merged);
        callback.current(merged);
        if (!writeBrowserData(sessionId, "knowledge", merged)) setNotice("Browser storage is unavailable or full. Knowledge will only last in this open app.");
        setError("");
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setSources(saved);
        callback.current(saved);
        setError(`${err instanceof Error ? err.message : "Could not restore server knowledge."} Cached sources, if any, remain available inline.`);
      })
      .finally(() => { if (!controller.signal.aborted) { setRestoring(false); readyCallback.current?.(true); } });
    return () => controller.abort();
  }, [sessionId, reload]);

  const save = (next: KnowledgeSource[]) => {
    setSources(next);
    callback.current(next);
    if (!writeBrowserData(sessionId, "knowledge", next)) setNotice("Browser storage is unavailable or full. Knowledge will only last in this open app.");
  };
  const ingest = async (init: RequestInit, clear?: () => void) => {
    if (lock.current || disabled || restoring || sources.length >= 20) return;
    lock.current = true;
    setBusy(true); setError(""); setNotice(""); readyCallback.current?.(false);
    try {
      const data = await fetchJson<KnowledgeResponse>("/api/knowledge", init);
      const added = responseSources(data);
      if (!added.length) throw new Error("No readable knowledge was returned. Try a small text document.");
      const next = [...sources];
      for (const item of added) {
        const index = next.findIndex(source => source.id === item.id);
        if (index >= 0) next[index] = item; else next.push(item);
      }
      save(next);
      clear?.();
      setNotice("Knowledge added. Open a source below to inspect its content.");
    } catch (err) { setError(err instanceof Error ? err.message : "Knowledge could not be added. Please retry."); }
    finally { lock.current = false; setBusy(false); readyCallback.current?.(true); }
  };
  const addText = (content: string, clear?: () => void) => ingest({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, text: content }) }, clear);
  const remove = async (id: string) => {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); setError(""); setNotice(""); readyCallback.current?.(false);
    try {
      await fetchJson("/api/knowledge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, id }) });
      save(sources.filter(item => item.id !== id));
      setNotice("Source removed from this browser and the active server session. Existing chat excerpts are unchanged.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete source. It has not been removed locally."); }
    finally { lock.current = false; setBusy(false); readyCallback.current?.(true); }
  };
  const unavailable = !sessionId || busy || restoring || disabled;
  const full = sources.length >= 20;
  return (
    <Card className="border-white/10 bg-slate-800/80 text-white backdrop-blur-sm">
      <CardHeader>
        <CardTitle>2. Add knowledge <span className="text-sm font-normal text-slate-300">({sources.length}/20 demo sources)</span></CardTitle>
        <CardDescription className="text-slate-300">Try fictional sample data, or add your own non-sensitive content. Content is cached in this browser and sent to the server when chatting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={unavailable || full || sources.some(item => item.content === SAMPLE_KNOWLEDGE)} onClick={() => addText(SAMPLE_KNOWLEDGE)}>Load fictional Atlas Studio sample</Button>
        <p className="text-xs text-slate-300">No credentials needed in offline demo mode. Then ask: “What is the cancellation policy?”</p>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="text">Text</TabsTrigger><TabsTrigger value="file">Files</TabsTrigger><TabsTrigger value="url">Website</TabsTrigger></TabsList>
          <TabsContent value="text" className="space-y-3">
            <label htmlFor="knowledge-text" className="text-sm">Paste knowledge</label><Textarea id="knowledge-text" value={text} maxLength={8000} rows={5} disabled={unavailable || full} onChange={e => setText(e.target.value)} placeholder="A short FAQ, policy, or product description…" />
            <p className="text-xs text-slate-400">{text.length}/8,000 characters</p><Button disabled={unavailable || full || !text.trim()} onClick={() => addText(text.trim(), () => setText(""))}>Add text</Button>
          </TabsContent>
          <TabsContent value="file" className="space-y-3">
            <label htmlFor="knowledge-files" className="block text-sm">Choose TXT, Markdown, PDF, or DOCX files</label>
            <input id="knowledge-files" type="file" accept=".txt,.md,.markdown,.pdf,.docx" multiple disabled={unavailable || full} className="block w-full min-w-0 rounded-lg border border-slate-600 p-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-blue-600 file:p-2 file:text-white" onChange={event => {
              const files = Array.from(event.target.files ?? []); event.target.value = "";
              if (!files.length) return;
              if (files.length + sources.length > 20) { setError("This demo supports up to 20 sources. Remove a source or select fewer files."); return; }
              if (files.length > 5) { setError("Choose at most 5 files per upload."); return; }
              if (files.some(file => file.size > 5 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) { setError("Choose files up to 5 MB each, and at most 10 MB per upload."); return; }
              const body = new FormData(); body.append("sessionId", sessionId); files.forEach(file => body.append("files", file)); void ingest({ method: "POST", body });
            }} />
            <p className="text-xs text-slate-300">5 MB per file · 10 MB per upload · 50,000 extracted characters per file. Scanned/image-only PDFs may have no extractable text.</p>
          </TabsContent>
          <TabsContent value="url" className="space-y-3">
            <label htmlFor="knowledge-url" className="text-sm">Public website URL</label><Input id="knowledge-url" type="url" maxLength={2000} value={url} disabled={unavailable || full} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/help" /><Button disabled={unavailable || full || !url.trim()} onClick={() => {
              try { const parsed = new URL(url); if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(); }
              catch { setError("Enter a complete public HTTP or HTTPS URL."); return; }
              void ingest({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, url: url.trim() }) }, () => setUrl(""));
            }}>Import page</Button><p className="text-xs text-slate-300">One public page only, not an entire site. Login-protected and JavaScript-only pages may not be readable. Only import content you have permission to use.</p>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-slate-400">Up to 20 sources and 100,000 extracted characters per server session. Browser copies support keyword-based fallback after a cold start. Live mode sends uploaded content to OpenAI for indexing.</p>
        {full && <p className="text-sm text-amber-200">Demo source limit reached. Remove a source to add another.</p>}
        {(busy || restoring) && <p role="status" className="text-sm text-blue-200">{restoring ? "Restoring session knowledge…" : "Processing knowledge…"}</p>}
        {error && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"><p>{error}</p><Button size="sm" variant="ghost" disabled={unavailable} onClick={() => { setRestoring(true); setReload(value => value + 1); }}>Retry session sync</Button></div>}
        {notice && <p role="status" className="text-sm text-blue-200">{notice}</p>}
        {!restoring && !sources.length && <p className="text-sm text-slate-400">No sources yet. The sample is a good place to start.</p>}
        <div className="space-y-3">{sources.map(item => <div key={item.id} className="rounded-lg border border-slate-600 bg-slate-900/50 p-3">
          <div className="flex items-start gap-2"><details className="min-w-0 flex-1"><summary className="cursor-pointer break-words text-sm font-medium">{item.title}</summary><p className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">{item.content}</p></details><Button size="sm" variant="ghost" disabled={unavailable} aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}>Remove</Button></div>
          <p className="mt-2 text-xs text-slate-400">{item.localOnly ? "Browser copy · inline fallback" : "Indexed in temporary server memory"} · {item.content.length.toLocaleString()} characters</p>
        </div>)}</div>
      </CardContent>
    </Card>
  );
}
