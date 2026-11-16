export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError("Expected a JSON object");
  return value as Record<string, unknown>;
}

export function text(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new RequestError(`${name} must contain 1–${maxLength} characters`);
  }
  return value.trim();
}

export function sessionId(value: unknown): string {
  const id = text(value, "Session ID", 100);
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) throw new RequestError("Invalid session ID");
  return id;
}

export async function readJson(request: Request, maxBytes = 1_100_000): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("JSON body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError("Request body too large", 413);
      }
      chunks.push(value);
    }
    return object(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("Invalid JSON body");
  } finally {
    reader.releaseLock();
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status });
  const upstreamStatus = error && typeof error === "object" && "status" in error ? error.status : undefined;
  if (upstreamStatus === 429) return Response.json({ error: "AI provider rate or billing limit reached. Try later or check the server API account." }, { status: 503 });
  return Response.json({ error: "Unable to complete the request. Check the server API configuration and try again." }, { status: 502 });
}
