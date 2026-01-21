"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentConfigurator from "@/components/AgentConfigurator";
import BackButton from "@/components/BackButton";
import { Upload, Globe, FileText, FolderOpen } from "lucide-react";

// Unified knowledge interface - SINGLE SOURCE OF TRUTH
interface UnifiedKnowledge {
  id: string;
  type: "file" | "url" | "text";
  title: string;
  content: string;
  status: "pending" | "completed" | "error";
  source?: string; // URL or filename
  metadata?: {
    wordCount?: number;
    description?: string;
    lastScraped?: string;
    chunksCreated?: number;
  };
  addedAt: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usedKnowledge?: boolean;
  sources?: string[];
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

export default function BuilderClient({ template = "" }: { template?: string }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    conversations: 0,
    thumbsUp: 0,
    thumbsDown: 0,
  });
  
  // UNIFIED KNOWLEDGE STATE - SINGLE SOURCE OF TRUTH
  const [knowledge, setKnowledge] = useState<UnifiedKnowledge[]>([]);
  
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    useCase: template || "",
    tone: "professional",
    goal: "",
    industry: "",
  });
  const [isConfigured, setIsConfigured] = useState(false);

  // Knowledge Base Step 4 states
  const [knowledgeTab, setKnowledgeTab] = useState("website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  // Auto-scroll to bottom when messages change (optimized for Windows)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || messages.filter(m => m.role === 'user').length >= 6) return;

    // Normalize input for better embedding similarity
    const normalizedInput = input
      .replace(/["""]/g, '"')
      .replace(/[']/g, "'")
      .trim();

    setIsLoading(true);
    
    // Track activity for analytics
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
    
    try {
      // Send knowledge IDs to ensure RAG can find them
      const knowledgeIds = knowledge.map(k => k.id);
      
      console.log("📤 Sending Chat Request:", {
        sessionId,
        message: normalizedInput,
        knowledgeCount: knowledge.length,
        knowledgeIds,
        knowledgeDetails: knowledge.map(k => ({
          id: k.id,
          title: k.title,
          type: k.type,
          wordCount: k.metadata?.wordCount,
        })),
      });
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: normalizedInput,
          type: agentConfig.useCase || "support",
          knowledgeIds, // Pass knowledge IDs for RAG lookup
          hasKnowledge: knowledge.length > 0, // Flag to enable RAG
        }),
      });

      const data = await response.json();
      
      // Debug logging
      console.log("🔍 Chat Response Debug:", {
        sessionId,
        knowledgeCount: knowledge.length,
        knowledgeIds: knowledge.map(k => k.id),
        usedKnowledge: data.usedKnowledge,
        chunks: data.chunks,
      });
      
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
        sources: data.sources || [],
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
    // Mark as configured if agent config is complete AND there's at least one knowledge source
    if (agentConfig.useCase && agentConfig.tone && agentConfig.goal && knowledge.length > 0) {
      setIsConfigured(true);
    }
  };

  const handleResetConfiguration = () => {
    setIsConfigured(false);
  };

  // Handle website scraping
  const handleScrapeWebsite = async () => {
    if (!websiteUrl.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: websiteUrl,
          sessionId,
        }),
      });
      
      const data = await response.json();
      
      console.log("🌐 Website Scrape Success:", {
        url: websiteUrl,
        knowledgeId: data.id,
        sessionId,
      });
      
      const newKnowledge: UnifiedKnowledge = {
        id: data.id || crypto.randomUUID(),
        type: "url",
        title: data.title || websiteUrl,
        content: data.content,
        status: "completed",
        source: websiteUrl,
        metadata: {
          wordCount: data.metadata?.wordCount || 0,
          lastScraped: new Date().toISOString(),
        },
        addedAt: Date.now(),
      };
      
      setKnowledge(prev => [...prev, newKnowledge]);
      setWebsiteUrl("");
    } catch (error) {
      console.error("Error scraping website:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('sessionId', sessionId);
        
        // Upload to API
        const response = await fetch('/api/knowledge', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log("📁 File Upload Success:", {
          filename: file.name,
          knowledgeId: data.id,
          wordCount: data.metadata?.wordCount,
          chunksCreated: data.metadata?.chunksCreated || 0,
          sessionId,
        });
        
        const newKnowledge: UnifiedKnowledge = {
          id: data.id || crypto.randomUUID(),
          type: "file",
          title: file.name,
          content: data.content || "",
          status: "completed",
          source: file.name,
          metadata: {
            wordCount: data.metadata?.wordCount || 0,
            chunksCreated: data.chunks?.length || 0,
          },
          addedAt: Date.now(),
        };
        
        // Update state immediately and force re-render
        setKnowledge(prev => {
          const updated = [...prev, newKnowledge];
          console.log("📊 Knowledge State Updated:", {
            count: updated.length,
            ids: updated.map(k => k.id),
          });
          return updated;
        });
      } catch (error) {
        console.error("❌ Error processing file:", error);
      }
    }
    
    setIsProcessing(false);
    e.target.value = "";
  };

  // Handle text paste
  const handleAddText = async () => {
    if (!textContent.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: textContent,
          sessionId,
        }),
      });
      
      const data = await response.json();
      
      console.log("📝 Text Add Success:", {
        knowledgeId: data.id,
        sessionId,
      });
      
      const newKnowledge: UnifiedKnowledge = {
        id: data.id || crypto.randomUUID(),
        type: "text",
        title: data.title || `Text Entry ${knowledge.filter(k => k.type === "text").length + 1}`,
        content: textContent,
        status: "completed",
        metadata: {
          wordCount: data.metadata?.wordCount || textContent.split(/\s+/).length,
        },
        addedAt: Date.now(),
      };
      
      setKnowledge(prev => [...prev, newKnowledge]);
      setTextContent("");
    } catch (error) {
      console.error("Error adding text:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete knowledge
  const handleDeleteKnowledge = (id: string) => {
    setKnowledge(prev => prev.filter(k => k.id !== id));
  };

  // Memoized configuration completion check
  const isConfigurationComplete = useMemo(() => {
    return Boolean(
      agentConfig.useCase &&
      agentConfig.tone &&
      agentConfig.goal &&
      knowledge.length > 0
    );
  }, [agentConfig, knowledge]);

  // Knowledge Base Step 4 Component
  const renderKnowledgeBaseStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          🧠 Knowledge Base Workflow
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          <Badge variant="secondary" className="mr-2">{knowledge.length} Sources</Badge>
          Add knowledge from websites, plain text, or documents. AI agents will use this information for accurate responses.
        </p>
      </div>

      <Tabs value={knowledgeTab} onValueChange={setKnowledgeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="website" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            Website
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="text" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-xs">
            <FolderOpen className="w-3 h-3 mr-1" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-3 mt-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Website URL
            </label>
            <Input
              type="url"
              placeholder="https://example.com or https://docs.example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button 
            onClick={handleScrapeWebsite}
            disabled={!websiteUrl.trim() || isProcessing}
            className="w-full"
            size="sm"
          >
            {isProcessing ? "🕷️ Scraping..." : "🕷️ Scrape Website"}
          </Button>
          <p className="text-xs text-gray-500">
            Extracts main content from website. Supports documentation sites, blogs, and company pages.
          </p>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3 mt-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".txt,.pdf,.docx,.md"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer block"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                📁 Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, TXT, DOCX, MD (Max 3MB per file)
              </p>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Max 5 files • 10MB total
          </p>
        </TabsContent>

        <TabsContent value="text" className="space-y-3 mt-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Paste your text content
            </label>
            <Textarea
              placeholder="Paste documentation, policies, product info, or any text content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </div>
          <Button 
            onClick={handleAddText}
            disabled={!textContent.trim()}
            className="w-full"
            size="sm"
          >
            Add to Knowledge Base
          </Button>
        </TabsContent>

        <TabsContent value="manage" className="space-y-3 mt-4">
          {knowledge.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No knowledge sources yet</p>
              <p className="text-xs">Add sources from the other tabs</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">
                  {knowledge.length} {knowledge.length === 1 ? 'Source' : 'Sources'} Added
                </p>
                <Badge variant="default" className="text-xs">
                  ✅ Ready for RAG
                </Badge>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {knowledge.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.type === "url" && <Globe className="w-3 h-3 text-blue-500" />}
                        {item.type === "file" && <Upload className="w-3 h-3 text-green-500" />}
                        {item.type === "text" && <FileText className="w-3 h-3 text-purple-500" />}
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                      </div>
                      {item.source && (
                        <p className="text-xs text-gray-500 truncate">{item.source}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {item.metadata?.wordCount && (
                          <p className="text-xs text-gray-400">
                            📄 {item.metadata.wordCount} words
                          </p>
                        )}
                        {item.metadata?.chunksCreated && (
                          <p className="text-xs text-green-600">
                            ✅ {item.metadata.chunksCreated} chunks
                          </p>
                        )}
                        <p className="text-xs text-blue-600">
                          🆔 {item.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKnowledge(item.id)}
                      className="ml-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-gray-300">Session: {sessionId.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BackButton href="/" />
              <Badge variant={knowledge.length > 0 ? "default" : "secondary"}>
                🧠 {knowledge.length} Sources
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
          {/* Left Panel - Configuration ONLY */}
          <div className="lg:col-span-1 space-y-6">
            {/* Agent Configuration with Knowledge Base as Step 4 */}
            <AgentConfigurator 
              onConfigUpdate={setAgentConfig}
              initialTemplate={template}
              onComplete={handleCompleteConfiguration}
              knowledgeFilesCount={knowledge.length}
              sessionId={sessionId}
              onKnowledgeUpdate={setKnowledge}
              renderKnowledgeBaseStep={renderKnowledgeBaseStep}
            />

            {/* Configuration Complete Status */}
            {isConfigurationComplete && (
              <Card className="mt-6">
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
                    <span className="font-semibold">{messages.filter(m => m.role === 'user').length}/6</span>
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
            <Card className="h-[600px] lg:h-[900px] flex flex-col">
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
                    {knowledge.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🧠 Knowledge Base Active
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      6 Message Limit
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-y-auto">
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
                        <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-3 sm:px-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-gray-100 text-gray-900 border border-gray-200"
                        }`}>
                          {message.usedKnowledge && (
                            <div className="flex items-center gap-2 mb-2 text-xs">
                              <Badge variant="secondary" className="text-xs">
                                Used Knowledge Base
                              </Badge>
                            </div>
                          )}

                          <p className="text-sm leading-relaxed">{message.content}</p>

                          {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="font-medium">Source:</span>{" "}
                              {message.sources.join(", ")}
                            </div>
                          )}

                          <p className="text-xs opacity-60 mt-2">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
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
                      disabled={isLoading || messages.filter(m => m.role === 'user').length >= 6}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!input.trim() || isLoading || messages.filter(m => m.role === 'user').length >= 6}
                      className="self-end"
                    >
                      {isLoading ? "..." : "Send"}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {messages.filter(m => m.role === 'user').length >= 6 
                        ? "Session limit reached (6 messages)"
                        : `${messages.filter(m => m.role === 'user').length}/6 messages used`
                      }
                    </span>
                    
                    {messages.filter(m => m.role === 'user').length > 0 && (
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