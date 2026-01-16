"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeUpload from "@/components/KnowledgeUpload";
import AgentConfigurator from "@/components/AgentConfigurator";
import BackButton from "@/components/BackButton";
import KnowledgeBaseWorkflow from "@/components/KnowledgeBaseWorkflow";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usedKnowledge?: boolean;
}

interface Analytics {
  conversations: number;
  thumbsUp: number;
  thumbsDown: number;
}

interface AgentConfig {
  useCase: string;
  tone: string;
  goal: string;
  industry?: string;
}

export default function BuilderClient() {
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "";
  
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    conversations: 0,
    thumbsUp: 0,
    thumbsDown: 0,
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<any[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    useCase: template || "",
    tone: "professional",
    goal: "",
    industry: "",
  });
  const [activeTab, setActiveTab] = useState("configure");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || messages.length >= 3) return;

    setIsLoading(true);
    
    // Track activity for analytics
    localStorage.setItem('lastActivity', Date.now().toString());
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: input,
          type: agentConfig.useCase || "support",
        }),
      });

      const data = await response.json();
      
      const userMessage: Message = {
        role: "user",
        content: input,
        timestamp: new Date().toISOString(),
      };
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
        usedKnowledge: data.analytics?.usedKnowledge || false,
      };
      
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setAnalytics(data.analytics);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    if (type === "up") {
      setAnalytics(prev => ({ ...prev, thumbsUp: prev.thumbsUp + 1 }));
    } else {
      setAnalytics(prev => ({ ...prev, thumbsDown: prev.thumbsDown + 1 }));
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleCompleteConfiguration = () => {
    // Only mark as configured if both agent config AND knowledge base are complete
    if (agentConfig.useCase && agentConfig.tone && agentConfig.goal && (knowledgeFiles.length > 0 || knowledgeSources.length > 0)) {
      setIsConfigured(true);
    }
  };

  const handleResetConfiguration = () => {
    setIsConfigured(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Conversational Agent Builder</h1>
                <p className="text-sm text-gray-500">Session: {sessionId.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BackButton href="/" />
              <Badge variant={(knowledgeFiles.length + knowledgeSources.length) > 0 ? "default" : "secondary"}>
                🧠 {(knowledgeFiles.length + knowledgeSources.length)} Sources
              </Badge>
              <Badge variant={agentConfig.useCase ? "default" : "secondary"}>
                ⚡ {agentConfig.useCase ? "Configured" : "Setup Required"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {!isConfigured ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                  <TabsTrigger value="configure">Configure Agent</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                </TabsList>
                
                <TabsContent value="configure" className="space-y-6">
                  <AgentConfigurator 
                    onConfigUpdate={setAgentConfig}
                    initialTemplate={template}
                    onComplete={handleCompleteConfiguration}
                    knowledgeFilesCount={knowledgeFiles.length + knowledgeSources.length}
                    sessionId={sessionId}
                    onKnowledgeUpdate={setKnowledgeFiles}
                  />
                </TabsContent>
                
                <TabsContent value="knowledge" className="space-y-6">
                  <KnowledgeBaseWorkflow 
                    sessionId={sessionId}
                    onKnowledgeUpdate={async (sources) => {
                      setKnowledgeSources(sources);
                      
                      // Save sources to knowledge API
                      try {
                        for (const source of sources) {
                          await fetch("/api/knowledge", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              sessionId: sessionId,
                              source: source,
                            }),
                          });
                        }
                        
                        // Convert to expected format for existing system
                        const combinedFiles = [...knowledgeFiles, ...sources.map(s => ({
                          name: s.title,
                          content: s.content,
                          type: s.type,
                          url: s.url
                        }))];
                        setKnowledgeFiles(combinedFiles);
                      } catch (error) {
                        console.error("Failed to save knowledge sources:", error);
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration Complete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Agent Ready!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your AI agent is configured and ready to test.
                    </p>
                    <Button onClick={handleResetConfiguration} variant="outline" className="w-full">
                      🔄 Modify Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="font-semibold">{messages.length}/3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">👍 Satisfaction</span>
                    <span className="font-semibold text-green-600">{analytics.thumbsUp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Knowledge Used</span>
                    <span className="font-semibold text-blue-600">
                      {messages.filter(m => m.usedKnowledge).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    💬 Chat Preview
                    {agentConfig.useCase && (
                      <Badge variant="outline">
                        {agentConfig.useCase}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {knowledgeFiles.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🧠 Knowledge Base Active
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      3 Message Limit
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤖</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Ready to test your AI agent!
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Configure your agent and upload knowledge base, then start a conversation to see how it responds.
                      </p>
                    </div>
                  ) : (
                    messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-gray-100 text-gray-900 border border-gray-200"
                        }`}>
                          {message.usedKnowledge && (
                            <div className="flex items-center gap-2 mb-2 text-xs">
                              <Badge variant="secondary" className="text-xs">
                                🧠 Used Knowledge Base
                              </Badge>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-60 mt-2">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-3">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message to test the agent..."
                      className="flex-1 min-h-[60px] resize-none"
                      disabled={isLoading || messages.length >= 3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!input.trim() || isLoading || messages.length >= 3}
                      className="self-end"
                    >
                      {isLoading ? "..." : "Send"}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {messages.length >= 3 
                        ? "Session limit reached (3 messages)"
                        : `${messages.length}/3 messages used`
                      }
                    </span>
                    
                    {messages.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFeedback("up")}
                        >
                          👍
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFeedback("down")}
                        >
                          👎
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" asChild>
            <a href="/analytics">📊 View Analytics</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/deploy">🚀 Deploy Agent</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
