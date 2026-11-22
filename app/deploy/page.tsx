"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONFIG, getBrowserSession, readBrowserData, readConfig, type AgentConfig, type KnowledgeSource } from "@/lib/browserSession";

export default function DeployPage() {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>([]);
  const [includeKnowledge, setIncludeKnowledge] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const session = getBrowserSession();
      setConfig(readConfig(session.id));
      const saved = readBrowserData<KnowledgeSource[]>(session.id, "knowledge", []);
      setKnowledge(Array.isArray(saved) ? saved : []);
      setReady(true);
      if (!session.persistent) setNotice("Browser storage is unavailable. Only data retained in this open app can be exported.");
    });
    return () => { active = false; };
  }, []);
  const download = () => {
    setError(""); setNotice("");
    try {
      const exported = {
        schemaVersion: 1,
        kind: "agentforge-portfolio-demo",
        exportedAt: new Date().toISOString(),
        note: "Local configuration snapshot, not a hosted agent or deployment credential. No API key, browser session identifier, or chat history is included.",
        config,
        ...(includeKnowledge ? { knowledge: knowledge.map(({ title, content, type, source }) => ({ title, content, type, source })) } : {}),
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "agent-demo-config.json"; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Download requested. Keep this file private if it contains proprietary instructions or source material.");
    } catch { setError("The browser could not create the download. Please retry in a browser that supports file downloads."); }
  };
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Export your demo</h1>
        <p className="text-sm text-muted-foreground">Take a local snapshot of your assistant&apos;s settings. Nothing is published.</p>
      </header>
      <p className="max-w-3xl rounded-md border bg-warn-surface p-4 text-sm text-warn">This portfolio demo has no authentication, database, billing, or persistent public agents. There is no production deployment or public embed to activate.</p>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <section aria-labelledby="export-heading" className="space-y-4 rounded-lg border bg-card p-5">
          <div className="space-y-1">
            <h2 id="export-heading" className="text-base font-semibold">Agent configuration JSON</h2>
            <p className="text-sm text-muted-foreground">Export the settings saved by this browser. The file is a portable reference for development; it does not provision an agent.</p>
          </div>
          {!ready ? <p role="status" className="text-sm text-muted-foreground">Loading browser snapshot…</p> : (
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd className="break-words">{config.name}</dd></div>
              <div><dt className="text-muted-foreground">Use case / tone</dt><dd>{config.useCase} / {config.tone}</dd></div>
              <div><dt className="text-muted-foreground">Goal</dt><dd className="whitespace-pre-wrap break-words">{config.goal}</dd></div>
              <div><dt className="text-muted-foreground">Browser-cached sources</dt><dd className="tnum">{knowledge.length}</dd></div>
            </dl>
          )}
          <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <input type="checkbox" className="mt-1 size-4 accent-primary" checked={includeKnowledge} onChange={event => setIncludeKnowledge(event.target.checked)} disabled={!ready || !knowledge.length} />
            <span>Include full knowledge content ({knowledge.length} sources). I understand this can expose private or proprietary data.</span>
          </label>
          <p className="text-xs text-warn">Settings alone may contain sensitive instructions. Review the JSON before sharing it. Exported files are not encrypted.</p>
          <Button className="w-full" disabled={!ready} onClick={download}>Download {includeKnowledge ? "config + knowledge" : "configuration"} JSON</Button>
          {notice && <p role="status" className="text-sm text-accent-foreground">{notice}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </section>
        <section aria-labelledby="deploy-heading" className="space-y-3 rounded-lg border bg-card p-5">
          <h2 id="deploy-heading" className="text-base font-semibold">Before a real deployment</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Add authentication and isolate tenant data.</li>
            <li>Persist configuration, knowledge, and conversations in a database.</li>
            <li>Add monitoring, durable quotas, privacy controls, and deletion policies.</li>
            <li>Evaluate answer quality and design a human handoff.</li>
          </ul>
          <Button asChild variant="outline"><Link href="/builder">Back to the builder</Link></Button>
        </section>
      </div>
    </main>
  );
}
