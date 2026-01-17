"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Use the same unified interface as BuilderClient
interface UnifiedKnowledge {
  id: string;
  type: "file" | "url" | "text";
  title: string;
  content: string;
  status: "pending" | "completed" | "error";
  url?: string; // Keep url for backward compatibility
  source?: string; // URL or filename  
  metadata?: {
    wordCount?: number;
    description?: string;
    lastScraped?: string;
  };
  addedAt: number;
}

export default function KnowledgeBaseWorkflow({ 
  sessionId, 
  onKnowledgeUpdate 
}: { 
  sessionId: string;
  onKnowledgeUpdate: (sources: UnifiedKnowledge[]) => void;
}) {
  const [sources, setSources] = useState<UnifiedKnowledge[]>([]);
  const [activeTab, setActiveTab] = useState("url");
  const [url, setUrl] = useState("");
  const [plainText, setPlainText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const scrapeWebsite = async (websiteUrl: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newSource: UnifiedKnowledge = {
          id: crypto.randomUUID(),
          type: "url",
          content: data.content,
          title: data.title || websiteUrl,
          status: "completed",
          url: websiteUrl,
          source: websiteUrl,
          addedAt: Date.now(),
          metadata: {
            description: data.description,
            lastScraped: new Date().toISOString(),
            wordCount: data.content.split(/\s+/).length,
          },
        };
        
        setSources(prev => {
          const updated = [...prev, newSource];
          onKnowledgeUpdate(updated);
          return updated;
        });
        setUrl("");
      } else {
        throw new Error(data.error || "Failed to scrape website");
      }
    } catch (error) {
      console.error("Scraping error:", error);
      // Add error state source
      const errorSource: UnifiedKnowledge = {
        id: crypto.randomUUID(),
        type: "url",
        content: "",
        title: websiteUrl,
        status: "error",
        url: websiteUrl,
        source: websiteUrl,
        addedAt: Date.now(),
      };
      setSources(prev => {
        const updated = [...prev, errorSource];
        onKnowledgeUpdate(updated);
        return updated;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addPlainText = () => {
    if (!plainText.trim()) return;
    
    const newSource: UnifiedKnowledge = {
      id: crypto.randomUUID(),
      type: "text",
      content: plainText,
      title: `Plain Text ${sources.filter(s => s.type === "text").length + 1}`,
      status: "completed",
      addedAt: Date.now(),
      metadata: {
        wordCount: plainText.split(/\s+/).length,
      },
    };
    
    setSources(prev => {
      const updated = [...prev, newSource];
      onKnowledgeUpdate(updated);
      return updated;
    });
    setPlainText("");
  };

  const removeSource = (id: string) => {
    setSources(prev => {
      const updated = prev.filter(s => s.id !== id);
      onKnowledgeUpdate(updated);
      return updated;
    });
  };

  const retryScraping = (id: string, url: string) => {
    setSources(prev => prev.map(s => 
      s.id === id ? { ...s, status: "pending" } : s
    ));
    
    // Re-scrape the website
    scrapeWebsite(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧠 Knowledge Base Workflow
            <Badge variant="secondary">{sources.length} Sources</Badge>
          </CardTitle>
          <CardDescription>
            Add knowledge from websites, plain text, or documents. AI agents will use this information for accurate responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">🌐 Website</TabsTrigger>
              <TabsTrigger value="text">📝 Text</TabsTrigger>
              <TabsTrigger value="manage">📚 Manage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <Input
                  placeholder="https://example.com or https://docs.example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
                <Button 
                  onClick={() => scrapeWebsite(url)}
                  disabled={!url.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? "🔄 Scraping..." : "🕷️ Scrape Website"}
                </Button>
                <p className="text-xs text-gray-500">
                  Extracts main content from website. Supports documentation sites, blogs, and company pages.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plain Text Content</label>
                  <Textarea
                    placeholder="Paste your knowledge base content here..."
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={addPlainText}
                  disabled={!plainText.trim()}
                  className="w-full"
                >
                  📝 Add Text
                </Button>
                <p className="text-xs text-gray-500">
                  Add FAQ documents, product information, policies, or any text content.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="space-y-4">
              <div className="space-y-3">
                {sources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No knowledge sources added yet. Start by scraping a website or adding text.
                  </div>
                ) : (
                  sources.map((source) => (
                    <Card key={source.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              source.status === "completed" ? "default" : 
                              source.status === "error" ? "destructive" : "secondary"
                            }>
                              {source.type === "url" ? "🌐" : "📝"} {source.type}
                            </Badge>
                            <h4 className="font-medium truncate">{source.title}</h4>
                          </div>
                          
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline mb-2 truncate block hover:text-blue-800"
                            >
                              {source.url}
                            </a>
                          )}
                          
                          {source.status === "error" && (
                            <p className="text-xs text-red-600 mb-2">Failed to scrape. Try again.</p>
                          )}
                          
                          {source.metadata?.wordCount && (
                            <p className="text-xs text-gray-500">
                              {source.metadata.wordCount.toLocaleString()} words
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {source.status === "error" && source.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryScraping(source.id, source.url!)}
                            >
                              🔄 Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSource(source.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              
              {sources.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Knowledge Base Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Sources:</span>
                      <span className="font-medium">{sources.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Websites:</span>
                      <span className="font-medium">{sources.filter(s => s.type === "url").length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Text Docs:</span>
                      <span className="font-medium">{sources.filter(s => s.type === "text").length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Words:</span>
                      <span className="font-medium">
                        {sources.reduce((acc, s) => acc + (s.metadata?.wordCount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
