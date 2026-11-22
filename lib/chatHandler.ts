import { openai } from "@/lib/openai";
import { buildSystemPrompt, parseChat, retrieve } from "@/lib/chat";
import { markProviderDegraded, providerDegraded, runtimeMode } from "@/lib/demo";
import { getSession, MESSAGE_LIMIT, sessionAnalytics } from "@/lib/sessionStore";
import { errorResponse, readJson, RequestError } from "@/lib/validation";

export async function handleChat(req: Request): Promise<Response> {
  let release: (() => void) | undefined;
  try {
    const input = parseChat(await readJson(req));
    const session = getSession(input.sessionId);
    if (session.inFlight) throw new RequestError("A reply is already being generated. Please wait.", 409);
    if (session.turns.length >= MESSAGE_LIMIT) throw new RequestError("Demo limit reached (6 messages). This session resets after 10 minutes of inactivity.", 429);
    session.inFlight = true;
    session.lastActive = Date.now();
    release = () => { session.inFlight = false; };
    const started = performance.now();
    const { chunks, retrievalMode, hasKnowledge } = await retrieve(input);
    let mode = runtimeMode();
    const history = session.messages.length ? session.messages : input.history;
    let promptTokens = 0;
    let completionTokens = 0;
    let reply: string;
    const demoReply = () => {
      return chunks.length
        ? `Offline demo — matching source excerpts (not AI-generated):\n\n${chunks.map((chunk, index) => `[${index + 1}] ${chunk.preview}`).join("\n\n")}`
        : hasKnowledge
          ? "No matching source excerpt was found. Offline demo uses keyword matching, not semantic understanding. Try words that appear in your sources."
          : "Upload knowledge or load the sample to explore this offline demo. Configure OPENAI_API_KEY on the server to enable AI-generated answers.";
    };
    if (mode === "demo") {
      reply = demoReply();
    } else if (hasKnowledge && !chunks.length) {
      reply = "I don't have information about that in my knowledge base. Try rephrasing your question or adding a relevant source.";
    } else {
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: buildSystemPrompt(input, chunks, hasKnowledge) }, ...history.slice(-12), { role: "user", content: input.message }],
          temperature: 0.3,
          max_tokens: 500,
        });
      } catch (error) {
        // Unusable key (401/403/quota): answer from the offline path and say so, instead of a 502.
        if (!markProviderDegraded(error)) throw error;
        mode = "demo";
        completion = null;
      }
      if (!completion) {
        reply = demoReply();
      } else {
        reply = completion.choices[0]?.message.content?.trim() || "I couldn't generate an answer. Please rephrase your question.";
        promptTokens = completion.usage?.prompt_tokens ?? 0;
        completionTokens = completion.usage?.completion_tokens ?? 0;
      }
    }
    const messageId = crypto.randomUUID();
    session.messages = [...history, { role: "user" as const, content: input.message }, { role: "assistant" as const, content: reply }].slice(-12);
    session.turns.push({ id: messageId, feedback: null, usedKnowledge: chunks.length > 0, durationMs: performance.now() - started, promptTokens, completionTokens });
    session.lastActive = Date.now();
    const analytics = sessionAnalytics(session);
    return Response.json({ reply, messageId, remainingMessages: analytics.remainingMessages, usedKnowledge: chunks.length > 0, chunks, chunkPreviews: chunks, analytics, retrievalMode, mode, degraded: providerDegraded() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  } finally {
    release?.();
  }
}
