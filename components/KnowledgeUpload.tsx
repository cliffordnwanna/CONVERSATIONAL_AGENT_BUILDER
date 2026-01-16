"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: string;
}

interface KnowledgeUploadProps {
  sessionId: string;
  onKnowledgeUpdate: (files: KnowledgeFile[]) => void;
}

export default function KnowledgeUpload({ sessionId, onKnowledgeUpdate }: KnowledgeUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<KnowledgeFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    // Limit to 3 files at once
    setFiles(selectedFiles.slice(0, 3));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0 && !pastedText.trim()) {
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      
      files.forEach((file) => {
        formData.append("files", file);
      });
      
      if (pastedText.trim()) {
        formData.append("pastedText", pastedText);
      }

      const response = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadedFiles(data.files);
        onKnowledgeUpdate(data.files);
        setFiles([]);
        setPastedText("");
      } else {
        console.error("Upload failed:", data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧠 Knowledge Base
          <Badge variant="secondary">Max 5 files • 10MB total</Badge>
        </CardTitle>
        <CardDescription>
          Upload documents or paste text to ground your AI agent with your business data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="text-4xl mb-2">📁</div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PDF, TXT, DOCX (Max 3MB per file)
                </p>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Files:</h4>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {file.type === "application/pdf" ? "📄" : 
                         file.name.endsWith(".docx") ? "📝" : "📄"}
                      </span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Or paste your text directly:
              </label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your documentation, FAQs, product descriptions, or any text content..."
                className="min-h-[200px]"
                maxLength={5000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {pastedText.length}/5000 characters
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || (files.length === 0 && !pastedText.trim())}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Add to Knowledge Base"}
          </Button>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Knowledge Base ({uploadedFiles.length}/5 files):</h4>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
              >
                <span className="text-2xl">
                  {file.type === "application/pdf" ? "📄" : 
                   file.type === "text/plain" ? "📝" : "📄"}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Added {new Date(file.uploadedAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
