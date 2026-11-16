import { getSession, sessionAnalytics } from "@/lib/sessionStore";
import { errorResponse, sessionId } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const id = sessionId(new URL(req.url).searchParams.get("sessionId"));
    return Response.json(sessionAnalytics(getSession(id)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
