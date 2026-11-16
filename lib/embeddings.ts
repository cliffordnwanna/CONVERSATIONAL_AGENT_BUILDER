import { openai } from "@/lib/openai";
import { demoEmbedding, runtimeMode } from "@/lib/demo";

export async function createEmbedding(text: string): Promise<number[]> {
  return (await createBatchEmbeddings([text]))[0];
}

export async function createBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map(text => text.replace(/\s+/g, " ").trim());
  if (inputs.some(text => !text)) throw new Error("Cannot embed empty text");
  if (runtimeMode() === "demo") return inputs.map(demoEmbedding);

  const embeddings: number[][] = [];
  for (let i = 0; i < inputs.length; i += 64) {
    const batch = inputs.slice(i, i + 64);
    const response = await openai.embeddings.create({ model: "text-embedding-3-small", input: batch });
    const ordered = [...response.data].sort((a, b) => a.index - b.index);
    if (ordered.length !== batch.length || ordered.some((item, index) => item.index !== index || !item.embedding.length || !item.embedding.every(Number.isFinite))) {
      throw new Error("Incomplete embedding response: knowledge was not saved");
    }
    embeddings.push(...ordered.map(item => item.embedding));
  }
  return embeddings;
}
