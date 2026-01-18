import { openai } from "@/lib/openai";

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and normalize text
    const cleanText = text.replace(/\n/g, " ").trim();
    
    if (!cleanText) {
      throw new Error("Cannot create embedding for empty text");
    }
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // Cheapest model
      input: cleanText
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding error:", error);
    throw new Error("Failed to create embedding");
  }
}

export async function createBatchEmbeddings(texts: string[]): Promise<number[][]> {
  // Filter out empty texts to avoid wasting tokens (Adjustment 3)
  const validTexts = texts.filter(text => text.trim().length > 0);
  
  if (validTexts.length === 0) {
    return [];
  }
  
  const embeddings = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < validTexts.length; i += 10) {
    const batch = validTexts.slice(i, i + 10);
    
    try {
      const batchEmbeddings = await Promise.all(
        batch.map(text => createEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    } catch (error) {
      console.error("Batch embedding error:", error);
      // Continue with other batches
      continue;
    }
  }
  
  return embeddings;
}
