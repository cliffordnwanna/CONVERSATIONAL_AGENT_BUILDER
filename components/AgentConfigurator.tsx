"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeUpload from "@/components/KnowledgeUpload";

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
  onKnowledgeUpdate?: (files: any[]) => void;
}

export default function AgentConfigurator({ onConfigUpdate, initialTemplate, onComplete, knowledgeFilesCount, sessionId, onKnowledgeUpdate }: AgentConfiguratorProps) {
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚡ Agent Configuration
          <Badge variant="secondary">4 Steps</Badge>
        </CardTitle>
        <CardDescription>
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
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            Step {step} of 4
          </span>
        </div>

        {/* Step 1: Use Case */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                What's your primary use case?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useCases.map((useCase) => (
                  <div
                    key={useCase.id}
                    onClick={() => handleConfigUpdate({ useCase: useCase.id })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      config.useCase === useCase.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{useCase.icon}</span>
                      <span className="font-medium">{useCase.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{useCase.description}</p>
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
              <h3 className="text-lg font-semibold mb-4">
                How should your agent communicate?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tones.map((tone) => (
                  <div
                    key={tone.id}
                    onClick={() => handleConfigUpdate({ tone: tone.id })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      config.tone === tone.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium mb-2">{tone.title}</div>
                    <p className="text-sm text-gray-600">{tone.description}</p>
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
              <h3 className="text-lg font-semibold mb-4">
                What's your main goal?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleConfigUpdate({ goal: goal.id })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      config.goal === goal.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium mb-2">{goal.title}</div>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Selection (Optional) */}
            <div>
              <h4 className="font-medium mb-3">Industry (Optional)</h4>
              <select
                value={config.industry}
                onChange={(e) => handleConfigUpdate({ industry: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry...</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Knowledge Upload */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Upload your knowledge base
              </h3>
              {sessionId && onKnowledgeUpdate && (
                <KnowledgeUpload
                  sessionId={sessionId}
                  onKnowledgeUpdate={onKnowledgeUpdate}
                />
              )}
            </div>
          </div>
        )}

        {/* Configuration Requirements */}
        {!canCompleteConfiguration() && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Requirements for Completion:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              {!config.useCase && <p>• Select a use case</p>}
              {!config.tone && <p>• Choose a communication tone</p>}
              {!config.goal && <p>• Define your main goal</p>}
              {(!knowledgeFilesCount || knowledgeFilesCount === 0) && <p>• Upload at least one file to knowledge base</p>}
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
          ) : (
            <Button 
              onClick={() => onComplete?.()} 
              disabled={!canCompleteConfiguration()} 
              className={`${canCompleteConfiguration() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {canCompleteConfiguration() ? "✅ Complete Configuration" : "⚠️ Complete Configuration"}
            </Button>
          )}
        </div>

        {/* Configuration Summary */}
        {config.useCase && config.tone && config.goal && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Configuration Summary:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Use Case:</strong> {useCases.find(uc => uc.id === config.useCase)?.title}</p>
              <p><strong>Tone:</strong> {tones.find(t => t.id === config.tone)?.title}</p>
              <p><strong>Goal:</strong> {goals.find(g => g.id === config.goal)?.title}</p>
              {config.industry && <p><strong>Industry:</strong> {config.industry}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
