"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Globe, Trash2, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ACCEPTED = ".txt,.md,.markdown,.pdf,.docx";
const labelClass = "text-sm font-medium";
const helpClass = "text-xs text-muted-foreground";

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
  const [dragging, setDragging] = useState(false);
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
      setNotice("Added. You can now ask questions about it.");
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
  const hasSample = sources.some(item => item.content === SAMPLE_KNOWLEDGE);

  const handleFiles = (files: File[]) => {
    if (!files.length || unavailable || full) return;
    if (files.length + sources.length > 20) { setError("This demo supports up to 20 sources. Remove a source or select fewer files."); return; }
    if (files.length > 5) { setError("Choose at most 5 files per upload."); return; }
    if (files.some(file => file.size > 5 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) { setError("Choose files up to 5 MB each, and at most 10 MB per upload."); return; }
    const body = new FormData(); body.append("sessionId", sessionId); files.forEach(file => body.append("files", file));
    void ingest({ method: "POST", body });
  };

  const sourceIcon = (type: KnowledgeSource["type"]) => type === "url" ? Globe : type === "text" ? Type : FileText;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">Add knowledge</h2>
          <p className={`${helpClass} tnum`}>{sources.length} of 20 sources</p>
        </div>
        <p className="text-sm text-muted-foreground">PDF, Word (DOCX), text, Markdown, pasted text, or a public web page.</p>
      </div>

      {!sources.length && !restoring && (
        <Button className="w-full" size="lg" disabled={unavailable || full || hasSample} onClick={() => addText(SAMPLE_KNOWLEDGE)}>
          Try the sample document
        </Button>
      )}

      <Tabs defaultValue="file">
        <TabsList>
          <TabsTrigger value="file"><Upload aria-hidden="true" />Files</TabsTrigger>
          <TabsTrigger value="text"><Type aria-hidden="true" />Text</TabsTrigger>
          <TabsTrigger value="url"><Globe aria-hidden="true" />Website</TabsTrigger>
        </TabsList>
        <TabsContent value="file" className="space-y-3 pt-3">
          <label
            htmlFor="knowledge-files"
            onDragOver={event => { event.preventDefault(); if (!unavailable && !full) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => { event.preventDefault(); setDragging(false); handleFiles(Array.from(event.dataTransfer.files)); }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${dragging ? "border-primary bg-accent" : "border-input bg-card hover:bg-secondary"} ${unavailable || full ? "pointer-events-none opacity-60" : ""}`}
          >
            <Upload aria-hidden="true" className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Drop files here, or <span className="text-primary underline underline-offset-2">choose files</span></span>
            <span className={helpClass}>Up to 5 files, 5 MB each. Scanned or image-only PDFs may contain no readable text.</span>
            <input
              id="knowledge-files"
              type="file"
              accept={ACCEPTED}
              multiple
              disabled={unavailable || full}
              className="sr-only"
              onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; handleFiles(files); }}
            />
          </label>
        </TabsContent>
        <TabsContent value="text" className="space-y-3 pt-3">
          <label htmlFor="knowledge-text" className={labelClass}>Paste knowledge</label>
          <Textarea id="knowledge-text" value={text} maxLength={8000} rows={6} disabled={unavailable || full} onChange={e => setText(e.target.value)} placeholder="A short FAQ, policy, or product description…" />
          <div className="flex items-center justify-between gap-3">
            <p className={`${helpClass} tnum`}>{text.length}/8,000 characters</p>
            <Button disabled={unavailable || full || !text.trim()} onClick={() => addText(text.trim(), () => setText(""))}>Add text</Button>
          </div>
        </TabsContent>
        <TabsContent value="url" className="space-y-3 pt-3">
          <label htmlFor="knowledge-url" className={labelClass}>Public web page address</label>
          <Input id="knowledge-url" type="url" inputMode="url" maxLength={2000} value={url} disabled={unavailable || full} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/help" />
          <div className="flex items-start justify-between gap-3">
            <p className={helpClass}>One page only, not a whole site. Login-protected and JavaScript-only pages may not be readable. Only import content you have permission to use.</p>
            <Button
              disabled={unavailable || full || !url.trim()}
              onClick={() => {
                try { const parsed = new URL(url); if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(); }
                catch { setError("Enter a complete public HTTP or HTTPS URL."); return; }
                void ingest({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, url: url.trim() }) }, () => setUrl(""));
              }}
            >
              Import page
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {full && <p className="text-sm text-warn">Source limit reached. Remove a source to add another.</p>}
      {(busy || restoring) && <p role="status" className="text-sm text-muted-foreground">{restoring ? "Restoring session knowledge…" : "Reading and indexing…"}</p>}
      {error && (
        <div role="alert" className="space-y-2 rounded-md border border-destructive/30 bg-card p-3 text-sm text-destructive">
          <p>{error}</p>
          <Button size="sm" variant="outline" disabled={unavailable} onClick={() => { setRestoring(true); setReload(value => value + 1); }}>Retry session sync</Button>
        </div>
      )}
      {notice && <p role="status" className="text-sm text-accent-foreground">{notice}</p>}

      {sources.length > 0 && (
        <div className="space-y-2">
          <h3 className={labelClass}>Your sources</h3>
          <ul className="divide-y rounded-lg border bg-card">
            {sources.map(item => {
              const Icon = sourceIcon(item.type);
              return (
                <li key={item.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <details className="min-w-0 flex-1">
                      <summary className="cursor-pointer break-words text-sm font-medium">{item.title}</summary>
                      <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">{item.content}</p>
                    </details>
                    <Button size="icon-sm" variant="ghost" disabled={unavailable} aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <p className={`${helpClass} tnum mt-1 pl-7`}>
                    {item.localOnly ? "Browser copy, keyword fallback" : "Indexed for this session"} · {item.content.length.toLocaleString()} characters
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!restoring && !sources.length && <p className="text-sm text-muted-foreground">No sources yet. Add a file, paste text, or try the sample.</p>}
      {sources.length > 0 && !hasSample && !full && (
        <Button variant="ghost" size="sm" disabled={unavailable} onClick={() => addText(SAMPLE_KNOWLEDGE)}>Also add the sample document</Button>
      )}
      <p className={helpClass}>
        Up to 20 sources and 100,000 extracted characters per session. In live mode, uploaded content is sent to OpenAI for indexing.
      </p>
    </div>
  );
}
