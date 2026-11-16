"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentConfig } from "@/lib/browserSession";

interface AgentConfiguratorProps {
  config: AgentConfig;
  onConfigUpdate: (config: AgentConfig) => void;
  disabled?: boolean;
}

export default function AgentConfigurator({ config, onConfigUpdate, disabled }: AgentConfiguratorProps) {
  const [expanded, setExpanded] = useState(true);
  const update = (values: Partial<AgentConfig>) => onConfigUpdate({ ...config, ...values });
  return (
    <Card className="border-white/10 bg-slate-800/80 text-white backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>1. Shape your assistant</span>
          <Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls="agent-settings" onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse" : "Edit"}</Button>
        </CardTitle>
        <CardDescription className="text-slate-300">Settings save in this browser and accompany every chat request. Tone and goal shape generated answers in live mode; offline excerpts are unchanged.</CardDescription>
      </CardHeader>
      {expanded && <CardContent id="agent-settings" className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
          <div className="space-y-2"><label htmlFor="agent-name" className="text-sm font-medium">Agent name</label><Input id="agent-name" value={config.name} maxLength={80} onChange={e => update({ name: e.target.value })} /></div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">Use case</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['faq', 'FAQ & support'], ['sales', 'Sales assistant']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={config.useCase === value} onClick={() => update({ useCase: value })} className={`rounded-lg border p-3 text-sm text-left focus-visible:outline-2 focus-visible:outline-blue-400 ${config.useCase === value ? "border-blue-400 bg-blue-500/20" : "border-slate-600 bg-slate-700/50"}`}>{label}</button>)}
            </div>
          </fieldset>
          <div className="space-y-2"><label htmlFor="agent-tone" className="text-sm font-medium">Tone</label><select id="agent-tone" className="w-full rounded-lg border border-slate-600 bg-slate-800 p-2 text-white" value={config.tone} onChange={e => update({ tone: e.target.value as AgentConfig['tone'] })}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="direct">Direct</option></select></div>
          <div className="space-y-2"><label htmlFor="agent-goal" className="text-sm font-medium">Goal</label><Textarea id="agent-goal" rows={3} value={config.goal} maxLength={500} onChange={e => update({ goal: e.target.value })} /><p className="text-xs text-slate-400">{config.goal.length}/500 characters</p></div>
          <div className="space-y-2"><label htmlFor="agent-industry" className="text-sm font-medium">Industry <span className="text-slate-400">(optional)</span></label><Input id="agent-industry" value={config.industry} maxLength={100} onChange={e => update({ industry: e.target.value })} placeholder="e.g. Coworking" /></div>
        </fieldset>
      </CardContent>}
    </Card>
  );
}
