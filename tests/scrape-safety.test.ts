import assert from "node:assert/strict";
import { test } from "node:test";
import { extractWebContent, isPublicAddress, pinnedLookup, resolvePublicAddress, scrapeWebsite, validatePublicUrl } from "../lib/scrape";

const privateAddresses = [
  "0.0.0.0", "0.1.2.3", "10.20.30.40", "100.64.0.1", "100.127.255.255", "127.0.0.1", "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.0.0.1", "192.0.2.1", "192.168.0.1", "192.88.99.1", "198.18.0.1", "198.19.255.1", "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255",
  "::", "::1", "fc00::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1", "2001::1", "2001:20::1", "2002:7f00:1::", "3fff::1", "64:ff9b::7f00:1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:c0a8:101", "::127.0.0.1", "fe80::1%eth0", "not-an-ip",
];

test("address policy blocks private, local, reserved, transition and mapped-local IPs", () => {
  for (const address of privateAddresses) assert.equal(isPublicAddress(address), false, address);
});

test("address policy accepts public IPv4, IPv6 and mapped public IPv4", () => {
  for (const address of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "100.128.0.1", "2001:4860:4860::8888", "2606:4700:4700::1111", "::ffff:8.8.8.8", "::ffff:808:808"]) assert.equal(isPublicAddress(address), true, address);
});

test("URL validation rejects credentials, alternate loopback syntax and non-HTTP protocols", () => {
  for (const url of [null, {}, "", "file:///etc/passwd", "ftp://example.com", "https://user:password@example.com", "http://127.1", "http://2130706433", "http://0x7f000001", "http://[::1]", "http://[::ffff:127.0.0.1]", "https://example.com/" + "x".repeat(2048)]) assert.throws(() => validatePublicUrl(url));
  assert.equal(validatePublicUrl("https://example.com/path#section").href, "https://example.com/path");
});

test("DNS validation rejects mixed public/private answers and empty resolution", async () => {
  const url = new URL("https://example.com");
  for (const answers of [[], [{ address: "127.0.0.1", family: 4 }], [{ address: "8.8.8.8", family: 4 }, { address: "::1", family: 6 }], [{ address: "8.8.8.8", family: 6 }]]) {
    await assert.rejects(resolvePublicAddress(url, async () => answers));
  }
  await assert.rejects(resolvePublicAddress(url, async () => { throw new Error("DNS failure"); }));
});

test("resolved public address is pinned without a second DNS query", async () => {
  let calls = 0;
  const address = await resolvePublicAddress(new URL("https://example.com"), async () => {
    calls++;
    return [{ address: calls === 1 ? "8.8.8.8" : "127.0.0.1", family: 4 }];
  });
  const lookup = pinnedLookup(address);
  lookup("example.com", {}, (error, ip, family) => { assert.equal(error, null); assert.equal(ip, "8.8.8.8"); assert.equal(family, 4); });
  lookup("example.com", { all: true }, (error, addresses) => { assert.equal(error, null); assert.deepEqual(addresses, [{ address: "8.8.8.8", family: 4 }]); });
  assert.equal(calls, 1);
});

test("literal private URL and redirect destinations are rejected without network access", async () => {
  await assert.rejects(scrapeWebsite("http://127.0.0.1:8000"));
  const original = new URL("https://example.com/path");
  for (const location of ["http://127.0.0.1", "//169.254.169.254/latest", "http://[::ffff:10.0.0.1]", "file:///secret"]) assert.throws(() => validatePublicUrl(new URL(location, original).href));
});

test("HTML extraction strips multiline active content, preserves Unicode, and decodes entities", () => {
  const html = '<html><head><title>A &amp; B</title><meta name="description" content="A description"></head><body><script>\nsecret script\n</script><style>\nsecret css\n</style><template>hidden template</template><p>Héllo 世界 &amp; &#x1F680;</p></body></html>';
  const result = extractWebContent(html, "text/html", new URL("https://example.com"));
  assert.equal(result.title, "A & B");
  assert.equal(result.description, "A description");
  assert.equal(result.content, "Héllo 世界 & 🚀");
});

test("HTML extraction rejects empty pages, including scripts and styles only", () => {
  for (const html of ["", "  ", "<html><head><title>No content</title></head><body><script>anything</script></body></html>", "<script>unclosed script"]) assert.throws(() => extractWebContent(html, "text/html", new URL("https://example.com")));
});

test("plain text is not interpreted as HTML and extracted content is bounded", () => {
  assert.equal(extractWebContent("a < b &amp; c", "text/plain", new URL("https://example.com")).content, "a < b &amp; c");
  assert.equal(extractWebContent("x".repeat(60_000), "text/plain", new URL("https://example.com")).content.length, 50_000);
});
