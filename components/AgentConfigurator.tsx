"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeBaseWorkflow from "@/components/KnowledgeBaseWorkflow";

interface AgentConfig {
  useCase: string;
  tone: string;
  goal: string;
  industry?: string;
}

interface AgentConfiguratorProps {
  onConfigUpdate: (config: AgentConfig) => void;
  initialTemplate?: string;
  onComplete?: () => void;
  knowledgeFilesCount?: number;
  sessionId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onKnowledgeUpdate?: (files: any[]) => void;
  renderKnowledgeBaseStep?: () => React.ReactNode;
}

export default function AgentConfigurator({ onConfigUpdate, initialTemplate, onComplete, knowledgeFilesCount, sessionId, onKnowledgeUpdate, renderKnowledgeBaseStep }: AgentConfiguratorProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<AgentConfig>({
    useCase: "",
    tone: "professional",
    goal: "",
    industry: "",
  });

  const useCases = [
    { 
      id: "support", 
      title: "Customer Support", 
      description: "Handle tickets, FAQs, and customer inquiries",
      icon: "💼",
      color: "blue"
    },
    { 
      id: "sales", 
      title: "Sales Assistant", 
      description: "Qualify leads and close deals",
      icon: "💰",
      color: "green"
    },
    { 
      id: "knowledge", 
      title: "Knowledge Base", 
      description: "Answer questions from documentation",
      icon: "📚",
      color: "purple"
    },
    { 
      id: "hr", 
      title: "HR Assistant", 
      description: "Company policies and employee questions",
      icon: "👥",
      color: "orange"
    },
  ];

  const tones = [
    { id: "professional", title: "Professional", description: "Formal and business-like" },
    { id: "friendly", title: "Friendly", description: "Warm and approachable" },
    { id: "casual", title: "Casual", description: "Relaxed and conversational" },
    { id: "expert", title: "Expert", description: "Authoritative and detailed" },
  ];

  const goals = [
    { id: "lead-gen", title: "Generate Leads", description: "Capture and qualify potential customers" },
    { id: "support", title: "Provide Support", description: "Answer questions and resolve issues" },
    { id: "inform", title: "Share Information", description: "Educate and inform users" },
    { id: "convert", title: "Drive Conversions", description: "Guide users to specific actions" },
  ];

  const industries = [
    "Technology", "Healthcare", "Finance", "Retail", "Education", 
    "Real Estate", "Consulting", "Manufacturing", "Other"
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfigUpdate = (updates: Partial<AgentConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigUpdate(newConfig);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return config.useCase !== "";
      case 2: return config.tone !== "";
      case 3: return config.goal !== "";
      case 4: return true; // Knowledge upload step is always valid
      default: return false;
    }
  };

  const canCompleteConfiguration = () => {
    return config.useCase && config.tone && config.goal && (knowledgeFilesCount || 0) > 0;
  };

  return (
    <Card className="w-full border-white/10 bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          ⚡ Agent Configuration
          <Badge variant="secondary">4 Steps</Badge>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Answer 3 simple questions and upload knowledge base to create your perfect AI agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step
                    ? "bg-blue-500 text-white"
                    : "bg-slate-600 text-gray-300"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-400">
            Step {step} of 4
          </span>
        </div>

        {/* Step 1: Use Case */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                What&apos;s your primary use case?
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {useCases.map((useCase) => (
                  <div
                    key={useCase.id}
                    onClick={() => handleConfigUpdate({ useCase: useCase.id })}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      config.useCase === useCase.id
                        ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30"
                        : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl flex-shrink-0">{useCase.icon}</span>
                      <span className="font-medium text-white text-sm truncate">{useCase.title}</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tone */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                How should your agent communicate?
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {tones.map((tone) => (
                  <div
                    key={tone.id}
                    onClick={() => handleConfigUpdate({ tone: tone.id })}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      config.tone === tone.id
                        ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30"
                        : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                    }`}
                  >
                    <div className="font-medium text-white text-sm mb-1">{tone.title}</div>
                    <p className="text-xs text-gray-300 line-clamp-2">{tone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                What&apos;s your main goal?
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleConfigUpdate({ goal: goal.id })}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      config.goal === goal.id
                        ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30"
                        : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                    }`}
                  >
                    <div className="font-medium text-white text-sm mb-1">{goal.title}</div>
                    <p className="text-xs text-gray-300 line-clamp-2">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Selection (Optional) */}
            <div>
              <h4 className="font-medium text-white mb-3">Industry (Optional)</h4>
              <select
                value={config.industry}
                onChange={(e) => handleConfigUpdate({ industry: e.target.value })}
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-slate-700 text-white">Select industry...</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry} className="bg-slate-700 text-white">
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Knowledge Base */}
        {step === 4 && (
          <div className="space-y-6">
            {renderKnowledgeBaseStep && renderKnowledgeBaseStep()}
          </div>
        )}

        {/* Configuration Requirements */}
        {!canCompleteConfiguration() && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="font-medium text-yellow-300 mb-2">⚠️ Requirements for Completion:</h4>
            <div className="text-sm text-yellow-200/80 space-y-1">
              {!config.useCase && <p>• Select a use case</p>}
              {!config.tone && <p>• Choose a communication tone</p>}
              {!config.goal && <p>• Define your main goal</p>}
              {(!knowledgeFilesCount || knowledgeFilesCount === 0) && <p>• Add at least one knowledge source (file, text, or website)</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Next Step
            </Button>
          ) : null}
        </div>

        {/* Configuration Summary */}
        {config.useCase && config.tone && config.goal && (
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h4 className="font-medium text-white mb-2">Configuration Summary:</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong className="text-white">Use Case:</strong> {useCases.find(uc => uc.id === config.useCase)?.title}</p>
              <p><strong className="text-white">Tone:</strong> {tones.find(t => t.id === config.tone)?.title}</p>
              <p><strong className="text-white">Goal:</strong> {goals.find(g => g.id === config.goal)?.title}</p>
              {config.industry && <p><strong className="text-white">Industry:</strong> {config.industry}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
