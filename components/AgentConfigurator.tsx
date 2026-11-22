"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentConfig } from "@/lib/browserSession";

interface AgentConfiguratorProps {
  config: AgentConfig;
  onConfigUpdate: (config: AgentConfig) => void;
  disabled?: boolean;
}

const labelClass = "text-sm font-medium";
const helpClass = "text-xs text-muted-foreground";

export default function AgentConfigurator({ config, onConfigUpdate, disabled }: AgentConfiguratorProps) {
  const update = (values: Partial<AgentConfig>) => onConfigUpdate({ ...config, ...values });
  return (
    <div className="space-y-5">
      <p className={helpClass}>
        Saved in this browser and sent with every message. In live mode, tone and goal shape the answers; offline excerpts are unchanged.
      </p>
      <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
        <div className="space-y-1.5">
          <label htmlFor="agent-name" className={labelClass}>Assistant name</label>
          <Input id="agent-name" value={config.name} maxLength={80} onChange={e => update({ name: e.target.value })} />
        </div>
        <fieldset className="space-y-1.5">
          <legend className={labelClass}>Use case</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {([["faq", "FAQ & support"], ["sales", "Sales assistant"]] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={config.useCase === value}
                onClick={() => update({ useCase: value })}
                className={`h-10 rounded-md border px-3 text-left text-sm font-medium transition-colors ${config.useCase === value ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card text-foreground hover:bg-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor="agent-tone" className={labelClass}>Tone</label>
          <select
            id="agent-tone"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring"
            value={config.tone}
            onChange={e => update({ tone: e.target.value as AgentConfig["tone"] })}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="agent-goal" className={labelClass}>Goal</label>
          <Textarea id="agent-goal" rows={3} value={config.goal} maxLength={500} onChange={e => update({ goal: e.target.value })} />
          <p className={`${helpClass} tnum`}>{config.goal.length}/500 characters</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="agent-industry" className={labelClass}>
            Industry <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input id="agent-industry" value={config.industry} maxLength={100} onChange={e => update({ industry: e.target.value })} placeholder="e.g. Coworking" />
        </div>
      </fieldset>
    </div>
  );
}
