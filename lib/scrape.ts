import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { isIP, type LookupFunction } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export const SCRAPE_LIMITS = { bytes: 2 * 1024 * 1024, timeoutMs: 10_000, redirects: 3, characters: 50_000 };

export class ScrapeError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ScrapeError";
  }
}

function ipv6Words(address: string): number[] {
  let value = address.toLowerCase();
  if (value.includes(".")) {
    const start = value.lastIndexOf(":") + 1;
    const octets = value.slice(start).split(".").map(Number);
    value = `${value.slice(0, start)}${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const [left, right] = value.split("::");
  const first = left ? left.split(":").map(word => parseInt(word, 16)) : [];
  const last = right ? right.split(":").map(word => parseInt(word, 16)) : [];
  return right === undefined ? first : [...first, ...Array(8 - first.length - last.length).fill(0), ...last];
}

export function isPublicAddress(address: string): boolean {
  if (address.includes("%")) return false;
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (family !== 6) return false;
  const words = ipv6Words(address);
  if (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff) {
    return isPublicAddress(`${words[6] >> 8}.${words[6] & 255}.${words[7] >> 8}.${words[7] & 255}`);
  }
  // Only global unicast; exclude transition, special-purpose and documentation ranges.
  return (words[0] & 0xe000) === 0x2000 &&
    !(words[0] === 0x2001 && (words[1] < 0x200 || words[1] === 0xdb8)) &&
    words[0] !== 0x2002 && !(words[0] === 0x3fff && words[1] < 0x1000);
}

export function validatePublicUrl(input: unknown): URL {
  if (typeof input !== "string" || input.length > 2048 || !input.trim()) {
    throw new ScrapeError("Provide an HTTP or HTTPS URL of at most 2048 characters.");
  }
  let url: URL;
  try { url = new URL(input); } catch { throw new ScrapeError("Invalid website URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new ScrapeError("Only HTTP(S) URLs without credentials are allowed.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!hostname || hostname.includes("%") || (isIP(hostname) && !isPublicAddress(hostname))) {
    throw new ScrapeError("The URL must point to a public Internet address.");
  }
  url.hash = "";
  return url;
}

type Resolver = (hostname: string) => Promise<LookupAddress[]>;
const resolveDns: Resolver = hostname => dnsLookup(hostname, { all: true, verbatim: true });

export async function resolvePublicAddress(url: URL, resolver: Resolver = resolveDns): Promise<LookupAddress> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const family = isIP(hostname);
  let addresses: LookupAddress[];
  try {
    addresses = family ? [{ address: hostname, family }] : await resolver(hostname);
  } catch {
    throw new ScrapeError("The website hostname could not be resolved.", 502);
  }
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address) || isIP(item.address) !== item.family)) {
    throw new ScrapeError("The website resolves to a private or reserved address.");
  }
  return addresses[0];
}

export function pinnedLookup(address: LookupAddress): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [address]);
    else callback(null, address.address, address.family);
  };
}

interface PageResponse { body: string; contentType: string; redirect?: string }

function fetchPinned(url: URL, address: LookupAddress, signal: AbortSignal): Promise<PageResponse> {
  return new Promise((resolve, reject) => {
    // No shared agent, proxy, second DNS lookup or automatic redirect can change the vetted destination.
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      agent: false,
      lookup: pinnedLookup(address),
      family: address.family,
      signal,
      headers: { "User-Agent": "KnowledgeDemo/1.0", Accept: "text/html, text/plain, application/xhtml+xml", "Accept-Encoding": "identity" },
      maxHeaderSize: 16 * 1024,
    }, response => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = response.headers.location;
        response.destroy();
        if (!location) reject(new ScrapeError("The website returned a redirect without a location.", 502));
        else resolve({ body: "", contentType: "", redirect: location });
        return;
      }
      const fail = (message: string, code = 422) => {
        response.destroy();
        reject(new ScrapeError(message, code));
      };
      if (status < 200 || status >= 300) { fail(`The website returned HTTP ${status}.`, 502); return; }
      const contentType = (response.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      if (!["text/html", "text/plain", "application/xhtml+xml"].includes(contentType)) {
        fail("Only HTML and plain-text web pages can be ingested.", 415); return;
      }
      if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity") {
        fail("Compressed website responses are not supported.", 415); return;
      }
      const declared = Number(response.headers["content-length"]);
      if (declared > SCRAPE_LIMITS.bytes) { fail("The website response exceeds the 2 MB limit.", 413); return; }
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > SCRAPE_LIMITS.bytes) { fail("The website response exceeds the 2 MB limit.", 413); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8"), contentType }));
      response.on("error", reject);
      response.on("aborted", () => reject(new ScrapeError("The website response was interrupted.", 502)));
    });
    request.on("error", reject);
    request.end();
  });
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", copy: "©", reg: "®" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()] ?? match;
    const point = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : " ";
  });
}

export function extractWebContent(body: string, contentType: string, url: URL) {
  let title = url.hostname;
  let description = "";
  let text = body;
  if (contentType !== "text/plain") {
    title = decodeEntities(body.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.replace(/<[^>]*>/g, " ") ?? title).trim().slice(0, 300);
    const meta = body.match(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/i)?.[0];
    description = decodeEntities(meta?.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] ?? "").slice(0, 200);
    text = body.replace(/<!--[\s\S]*?(?:-->|$)/g, " ")
      .replace(/<(script|style|head|noscript|template|svg)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, " ")
      .replace(/<[^>]*>/g, " ");
    text = decodeEntities(text);
  }
  const content = text.replace(/\s+/g, " ").trim().slice(0, SCRAPE_LIMITS.characters);
  if (!content) throw new ScrapeError("No readable text was found on this page. Try pasting its text instead.", 422);
  return { title, content, description, success: true as const };
}

export async function scrapeWebsite(input: unknown) {
  let url = validatePublicUrl(input);
  const controller = new AbortController();
  let rejectDeadline: (error: Error) => void = () => {};
  const deadline = new Promise<never>((_resolve, reject) => { rejectDeadline = reject; });
  const timer = setTimeout(() => {
    rejectDeadline(new ScrapeError("The website took too long to respond (10 second limit).", 504));
    controller.abort();
  }, SCRAPE_LIMITS.timeoutMs);
  try {
    return await Promise.race([deadline, (async () => {
      for (let redirects = 0; redirects <= SCRAPE_LIMITS.redirects; redirects++) {
        const address = await resolvePublicAddress(url);
        if (controller.signal.aborted) throw new ScrapeError("Website request timed out.", 504);
        const response = await fetchPinned(url, address, controller.signal);
        if (!response.redirect) return extractWebContent(response.body, response.contentType, url);
        if (redirects === SCRAPE_LIMITS.redirects) throw new ScrapeError("The website redirected too many times.", 422);
        url = validatePublicUrl(new URL(response.redirect, url).href);
      }
      throw new ScrapeError("Unable to read the website.", 502);
    })()]);
  } catch (error) {
    if (error instanceof ScrapeError) throw error;
    throw new ScrapeError("Unable to fetch the website. Check the URL or paste its text instead.", 502);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
