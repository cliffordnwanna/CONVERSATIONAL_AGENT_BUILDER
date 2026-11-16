import { runtimeMode } from "@/lib/demo";
import { MESSAGE_LIMIT, SESSION_TTL } from "@/lib/sessionStore";

export async function GET() {
  return Response.json({ mode: runtimeMode(), storage: "memory", messageLimit: MESSAGE_LIMIT, sessionTtlMinutes: SESSION_TTL / 60000 }, { headers: { "Cache-Control": "no-store" } });
}
