"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Export your demo</h1><p className="mt-2 text-sm text-slate-300">Take a local snapshot. Nothing is published.</p></div><nav aria-label="Export navigation" className="flex flex-wrap gap-4 text-sm text-blue-200"><Link href="/builder">Playground</Link><Link href="/analytics">Analytics</Link><Link href="/">Home</Link></nav></header>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">This portfolio demo has no authentication, database, billing, or persistent public agents. There is no production deployment or public embed to activate.</div>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white"><CardHeader><CardTitle>Agent configuration JSON</CardTitle><CardDescription className="text-slate-300">Export the settings saved by this browser. The file is a portable reference for development; it does not provision an agent.</CardDescription></CardHeader><CardContent className="space-y-4">
            {!ready ? <p role="status">Loading browser snapshot…</p> : <dl className="space-y-3 text-sm"><div><dt className="text-slate-400">Name</dt><dd className="break-words">{config.name}</dd></div><div><dt className="text-slate-400">Use case / tone</dt><dd>{config.useCase} / {config.tone}</dd></div><div><dt className="text-slate-400">Goal</dt><dd className="whitespace-pre-wrap break-words">{config.goal}</dd></div><div><dt className="text-slate-400">Browser-cached sources</dt><dd>{knowledge.length}</dd></div></dl>}
            <label className="flex items-start gap-3 rounded-lg border border-slate-600 p-3 text-sm"><input type="checkbox" className="mt-1" checked={includeKnowledge} onChange={event => setIncludeKnowledge(event.target.checked)} disabled={!ready || !knowledge.length} /><span>Include full knowledge content ({knowledge.length} sources). I understand this can expose private or proprietary data.</span></label>
            <p className="text-xs text-amber-200">Settings alone may contain sensitive instructions. Review the JSON before sharing it. Exported files are not encrypted.</p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={!ready} onClick={download}>Download {includeKnowledge ? "config + knowledge" : "configuration"} JSON</Button>
            {notice && <p role="status" className="text-sm text-blue-200">{notice}</p>}{error && <p role="alert" className="text-sm text-red-200">{error}</p>}
          </CardContent></Card>
          <div className="space-y-6">
            <Card className="border-white/10 bg-slate-800/80 text-white"><CardHeader><CardTitle>Widget concept</CardTitle><CardDescription className="text-slate-300">Visual mockup only — not connected to a public agent.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-xl border border-slate-600"><div className="break-words bg-gradient-to-r from-blue-600 to-purple-600 p-4 font-semibold">{config.name}</div><div className="space-y-4 bg-slate-900 p-4"><p className="rounded-lg bg-slate-700 p-3 text-sm">A website assistant could live here. Test the actual demo in the playground instead.</p><Button asChild variant="outline" className="w-full"><Link href="/builder">Open interactive playground</Link></Button></div></div></CardContent></Card>
            <Card className="border-white/10 bg-white/5 text-white"><CardHeader><CardTitle>Before a real deployment</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-2 pl-5 text-sm text-slate-300"><li>Add authentication and isolate tenant data.</li><li>Persist configuration, knowledge, and conversations in a database.</li><li>Add monitoring, durable quotas, privacy controls, and deletion policies.</li><li>Evaluate answer quality and design a human handoff.</li></ul></CardContent></Card>
          </div>
        </div>
      </main>
    </div>
  );
}
