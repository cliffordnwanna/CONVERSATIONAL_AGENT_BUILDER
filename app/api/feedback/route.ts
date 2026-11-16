import { getSession, sessionAnalytics } from "@/lib/sessionStore";
import { errorResponse, readJson, RequestError, sessionId, text } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await readJson(req, 2048);
    const id = sessionId(body.sessionId);
    const messageId = text(body.messageId, "Message ID", 100);
    if (body.value !== "up" && body.value !== "down" && body.value !== null) throw new RequestError("Feedback must be up, down or null");
    const session = getSession(id);
    const turn = session.turns.find(item => item.id === messageId);
    if (!turn) throw new RequestError("Message not found or session expired", 404);
    turn.feedback = body.value;
    return Response.json({ analytics: sessionAnalytics(session) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
