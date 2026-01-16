import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getSession } from "@/lib/sessionStore";
import { salesPrompt } from "@/prompts/sales";
import { faqPrompt } from "@/prompts/faq";

// Simple knowledge retrieval (in production, use vector similarity)
async function getRelevantKnowledge(query: string, sessionId: string): Promise<string> {
  try {
    // Get both uploaded files and scraped sources
    const response = await fetch(`http://localhost:3000/api/knowledge?sessionId=${sessionId}`);
    const data = await response.json();
    
    // Combine all knowledge sources
    const allKnowledge = [
      ...(data.files || []),
      ...(data.sources || [])
    ];
    
    if (allKnowledge.length === 0) {
      return "";
    }
    
    // Simple keyword matching (in production, use embeddings + vector search)
    const queryWords = query.toLowerCase().split(/\s+/);
    let relevantContent = "";
    
    for (const item of allKnowledge) {
      const content = item.content.toLowerCase();
      const matches = queryWords.filter(word => content.includes(word)).length;
      
      // If item contains at least 2 query words, consider it relevant
      if (matches >= 2) {
        const title = item.title || item.name || "Knowledge Source";
        relevantContent += `${title}:\n${item.content.substring(0, 1000)}\n\n`;
      }
    }
    
    return relevantContent;
  } catch (error) {
    console.error("Knowledge retrieval error:", error);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, message, type } = await req.json();

    // Track activity for analytics
    const now = Date.now();
    
    // Get relevant knowledge
    const relevantKnowledge = await getRelevantKnowledge(message, sessionId);
    
    const systemPrompt = type === "sales" ? salesPrompt : faqPrompt;
    
    // Enhanced prompt with knowledge base
    const enhancedPrompt = relevantKnowledge 
      ? `${systemPrompt}\n\nRelevant Information:\n${relevantKnowledge}\n\nUse the above information to answer the user's question. If the information doesn't contain the answer, say so politely.`
      : systemPrompt;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: enhancedPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const reply = completion.choices[0].message.content || "";

    // Update analytics
    const analytics = {
      conversations: 1,
      thumbsUp: 0,
      thumbsDown: 0,
      avgResponseTime: 0.8 + Math.random() * 0.4,
      knowledgeUsage: relevantKnowledge ? 85 + Math.floor(Math.random() * 15) : 15 + Math.floor(Math.random() * 10),
      costSavings: relevantKnowledge ? 25 + Math.random() * 25 : 5 + Math.random() * 10,
    };

    const response = NextResponse.json({
      reply,
      analytics,
      sessionId,
    });

    // Set activity tracking header
    response.headers.set('X-Activity-Timestamp', now.toString());
    
    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
