import { performance } from "node:perf_hooks";
import { chunkKnowledge } from "../lib/chunking";
import { createBatchEmbeddings, createEmbedding } from "../lib/embeddings";
import { lexicalScore } from "../lib/demo";
import { InMemoryVectorStore } from "../lib/vectorStore";

const live = process.argv.includes("--live");
if (!live) process.env.OPENAI_API_KEY = "";
if (live && !process.env.OPENAI_API_KEY) throw new Error("Live evaluation requires OPENAI_API_KEY and makes paid embedding calls.");

const documents = [
  { id: "returns", title: "Returns", content: "Refund policy: unused products can be returned within 30 days of delivery. Refunds are issued to the original payment method." },
  { id: "shipping", title: "Shipping", content: "Standard shipping costs $5. Delivery takes 3 to 5 business days. Express shipping costs $15 and takes 1 business day." },
  { id: "support", title: "Support", content: "Customer support email is help@example.test. Support hours are Monday to Friday, 9am to 5pm UTC." },
  { id: "warranty", title: "Warranty", content: "The hardware warranty lasts 12 months and covers manufacturing defects. Accidental damage is excluded from warranty coverage." },
];
const cases = [
  { query: "What is the refund policy?", expected: "returns" },
  { query: "When are refunds issued?", expected: "returns" },
  { query: "How much does express shipping cost?", expected: "shipping" },
  { query: "How long does standard delivery take?", expected: "shipping" },
  { query: "What is the support email?", expected: "support" },
  { query: "What are your support hours?", expected: "support" },
  { query: "How long does the hardware warranty last?", expected: "warranty" },
  { query: "Is accidental damage covered?", expected: "warranty" },
  { query: "Who won the football championship?", expected: null },
  { query: "Describe quantum entanglement", expected: null },
];

async function main() {
  const chunks = chunkKnowledge(documents.map(item => ({ ...item, type: "text" as const, status: "completed" as const, addedAt: 0 })));
  const store = new InMemoryVectorStore();
  if (live) {
    const embeddings = await createBatchEmbeddings(chunks.map(chunk => chunk.content));
    store.add("evaluation", chunks.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] })));
  }
  const rows = [];
  for (const item of cases) {
    const started = performance.now();
    const results = live
      ? store.search("evaluation", await createEmbedding(item.query), 3)
      : chunks.map(chunk => ({ ...chunk, score: lexicalScore(item.query, chunk.content) })).filter(chunk => chunk.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    const rank = item.expected ? results.findIndex(chunk => chunk.metadata.knowledgeId === item.expected) + 1 : 0;
    rows.push({ query: item.query, expected: item.expected, topSource: results[0]?.metadata.knowledgeId ?? null, rank, passed: item.expected ? rank === 1 : results.length === 0, latencyMs: Math.round(performance.now() - started) });
  }
  const positives = rows.filter(row => row.expected);
  const negatives = rows.filter(row => !row.expected);
  const report = {
    mode: live ? "OpenAI semantic retrieval (paid)" : "Offline lexical retrieval (no AI calls)",
    dataset: "10 synthetic cases / 4 documents; smoke baseline, NOT a production accuracy claim",
    hitAt1: positives.filter(row => row.rank === 1).length / positives.length,
    recallAt3: positives.filter(row => row.rank > 0).length / positives.length,
    mrrAt3: positives.reduce((sum, row) => sum + (row.rank ? 1 / row.rank : 0), 0) / positives.length,
    noMatchAccuracy: negatives.filter(row => row.passed).length / negatives.length,
    cases: rows,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.hitAt1 < 0.75 || report.noMatchAccuracy < 0.5) process.exitCode = 1;
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Evaluation failed"); process.exitCode = 1; });
