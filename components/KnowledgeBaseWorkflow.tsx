import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KnowledgeSource {
  id: string;
  type: "url" | "text" | "file";
  content: string;
  title: string;
  status: "pending" | "processing" | "completed" | "error";
  url?: string;
  metadata?: {
    description?: string;
    lastScraped?: string;
    wordCount?: number;
  };
}

export default function KnowledgeBaseWorkflow({ 
  sessionId, 
  onKnowledgeUpdate 
}: { 
  sessionId: string;
  onKnowledgeUpdate: (sources: KnowledgeSource[]) => void;
}) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
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
        // Add to knowledge base via API
        const knowledgeResponse = await fetch("/api/knowledge", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId,
            source: {
              id: crypto.randomUUID(),
              title: data.title || websiteUrl,
              content: data.content,
              type: "url",
              url: websiteUrl,
              status: "completed",
              metadata: {
                description: data.description,
                lastScraped: new Date().toISOString(),
                wordCount: data.content.split(/\s+/).length,
              },
            },
          }),
        });

        const knowledgeData = await knowledgeResponse.json();
        
        if (knowledgeData.success) {
          const newSource: KnowledgeSource = {
            id: knowledgeData.source.id,
            type: "url",
            content: knowledgeData.source.content,
            title: knowledgeData.source.title,
            status: "completed",
            url: websiteUrl,
            metadata: knowledgeData.source.metadata,
          };
          
          setSources(prev => [...prev, newSource]);
          onKnowledgeUpdate([...sources, newSource]);
          setUrl("");
        } else {
          throw new Error(knowledgeData.error || "Failed to save scraped content");
        }
      } else {
        throw new Error(data.error || "Failed to scrape website");
      }
    } catch (error) {
      console.error("Scraping error:", error);
      // Add error state source
      const errorSource: KnowledgeSource = {
        id: crypto.randomUUID(),
        type: "url",
        content: "",
        title: websiteUrl,
        status: "error",
        url: websiteUrl,
      };
      setSources(prev => [...prev, errorSource]);
    } finally {
      setIsProcessing(false);
    }
  };

  const addPlainText = async () => {
    if (!plainText.trim()) return;
    
    try {
      const response = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          source: {
            id: crypto.randomUUID(),
            title: `Plain Text ${sources.filter(s => s.type === "text").length + 1}`,
            content: plainText,
            type: "text",
            status: "completed",
            metadata: {
              wordCount: plainText.split(/\s+/).length,
            },
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newSource: KnowledgeSource = {
          id: data.source.id,
          type: "text",
          content: data.source.content,
          title: data.source.title,
          status: "completed",
          metadata: data.source.metadata,
        };
        
        setSources(prev => [...prev, newSource]);
        onKnowledgeUpdate([...sources, newSource]);
        setPlainText("");
      } else {
        throw new Error(data.error || "Failed to save text content");
      }
    } catch (error) {
      console.error("Text save error:", error);
    }
  };

  const removeSource = async (id: string) => {
    try {
      const response = await fetch("/api/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          itemId: id,
          itemType: "source",
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSources(prev => prev.filter(s => s.id !== id));
        onKnowledgeUpdate(sources.filter(s => s.id !== id));
      } else {
        throw new Error(data.error || "Failed to remove source");
      }
    } catch (error) {
      console.error("Remove error:", error);
    }
  };

  const retryScraping = async (id: string, url: string) => {
    setSources(prev => prev.map(s => 
      s.id === id ? { ...s, status: "pending" } : s
    ));
    
    // Re-scrape the website
    await scrapeWebsite(url);
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Website URL</label>
                  <Input
                    placeholder="https://example.com or https://docs.example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={() => scrapeWebsite(url)}
                  disabled={!url.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? "🔄 Scraping..." : "🕷️ Scrape Website"}
                </Button>
                <p className="text-xs text-gray-500">
                  Extracts main content from the website. Supports documentation sites, blogs, and company pages.
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
                            <p className="text-xs text-blue-600 mb-2 truncate">{source.url}</p>
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
