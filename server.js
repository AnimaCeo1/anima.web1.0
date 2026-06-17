const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8000);
const DB_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DB_DIR, "anima-db.json");
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ANIMA <onboarding@resend.dev>";
const TEXT_EXTENSIONS = new Set([".html", ".js", ".css", ".json", ".svg", ".txt"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

const staticCache = new Map();
let dbLoaded = false;
let dbTextCache = "null";
let dbWriteChain = Promise.resolve();

function ensureDbFile() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "null", "utf8");
}

function ensureDbCache() {
  if (dbLoaded) return;
  ensureDbFile();
  dbTextCache = fs.readFileSync(DB_FILE, "utf8");
  dbLoaded = true;
}

function queueDbWrite(nextText) {
  dbTextCache = nextText;
  dbLoaded = true;
  dbWriteChain = dbWriteChain
    .catch(() => {})
    .then(() => fs.promises.writeFile(DB_FILE, nextText, "utf8"))
    .catch((error) => console.error("DB write failed:", error));
}

function acceptsEncoding(req, token) {
  return (req.headers["accept-encoding"] || "").includes(token);
}

function toBuffer(body) {
  return Buffer.isBuffer(body) ? body : Buffer.from(String(body));
}

function compressIfAccepted(req, bodyBuffer, contentType) {
  if (!contentType || !TEXT_EXTENSIONS.has(path.extname(`x.${contentType.split("/")[1]?.split(";")[0] || ""}`))) {
    return { body: bodyBuffer, encoding: "" };
  }
  if (bodyBuffer.length < 1024) return { body: bodyBuffer, encoding: "" };
  if (acceptsEncoding(req, "br")) {
    return { body: zlib.brotliCompressSync(bodyBuffer), encoding: "br" };
  }
  if (acceptsEncoding(req, "gzip")) {
    return { body: zlib.gzipSync(bodyBuffer), encoding: "gzip" };
  }
  return { body: bodyBuffer, encoding: "" };
}

function send(req, res, status, body, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  const raw = toBuffer(body);
  const { body: payload, encoding } = compressIfAccepted(req, raw, contentType);
  const headers = {
    "Content-Type": contentType,
    "Content-Length": payload.length,
    "Access-Control-Allow-Origin": "*",
    Vary: "Accept-Encoding",
    ...extraHeaders,
  };
  if (encoding) headers["Content-Encoding"] = encoding;
  res.writeHead(status, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(payload);
}

function requestLogger(req, res) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`${req.method} ${req.url} -> ${res.statusCode} took ${duration}ms`);
  });
}

function dbHeaders() {
  return {
    "Cache-Control": "no-store",
  };
}

function serveDb(req, res) {
  const startedAt = Date.now();
  ensureDbCache();
  if (req.method === "GET" || req.method === "HEAD") {
    console.log(`[perf][server] serveDb:${req.method} cache-bytes=${Buffer.byteLength(dbTextCache || "", "utf8")} prep=${Date.now() - startedAt}ms`);
    return send(req, res, 200, dbTextCache, MIME[".json"], dbHeaders());
  }
  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        JSON.parse(body || "null");
        queueDbWrite(body || "null");
        console.log(`[perf][server] serveDb:POST body-bytes=${Buffer.byteLength(body || "", "utf8")} prep=${Date.now() - startedAt}ms`);
        send(req, res, 200, JSON.stringify({ ok: true }), MIME[".json"], dbHeaders());
      } catch {
        send(req, res, 400, JSON.stringify({ ok: false, error: "Invalid JSON" }), MIME[".json"], dbHeaders());
      }
    });
    return;
  }
  if (req.method === "OPTIONS") return send(req, res, 204, "", "text/plain; charset=utf-8", dbHeaders());
  send(req, res, 405, "Method Not Allowed", "text/plain; charset=utf-8", dbHeaders());
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function sendResendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "RESEND_SEND_FAILED");
  }
  return payload;
}

async function serveSendEmail(req, res) {
  if (req.method !== "POST") {
    return send(req, res, 405, JSON.stringify({ ok: false, error: "Method Not Allowed" }), MIME[".json"], dbHeaders());
  }
  try {
    const body = await readJsonBody(req);
    const to = String(body.to || "").trim();
    const subject = String(body.subject || "").trim();
    const html = String(body.html || "").trim();
    if (!to || !subject || !html) {
      return send(req, res, 400, JSON.stringify({ ok: false, error: "Missing fields" }), MIME[".json"], dbHeaders());
    }
    const result = await sendResendEmail({ to, subject, html });
    return send(req, res, 200, JSON.stringify({ ok: true, data: result }), MIME[".json"], dbHeaders());
  } catch (error) {
    const code = error?.message || "SEND_FAILED";
    const status = code === "RESEND_NOT_CONFIGURED" ? 503 : 500;
    return send(req, res, status, JSON.stringify({ ok: false, error: code }), MIME[".json"], dbHeaders());
  }
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let full = path.join(ROOT, normalized);
  if (full.endsWith(path.sep)) full = path.join(full, "index.html");
  return full;
}

function staticCacheControl(ext, search) {
  if (ext === ".html") return "no-cache";
  if (search) return "public, max-age=31536000, immutable";
  if (TEXT_EXTENSIONS.has(ext)) return "public, max-age=3600";
  return "public, max-age=2592000";
}

function loadStaticEntry(filePath) {
  const stat = fs.statSync(filePath);
  const cacheKey = filePath;
  const cached = staticCache.get(cacheKey);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached;

  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  const etag = `"${crypto.createHash("sha1").update(buffer).digest("hex")}"`;
  const entry = {
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    ext,
    contentType: MIME[ext] || "application/octet-stream",
    buffer,
    etag,
    br: TEXT_EXTENSIONS.has(ext) && buffer.length > 1024 ? zlib.brotliCompressSync(buffer) : null,
    gzip: TEXT_EXTENSIONS.has(ext) && buffer.length > 1024 ? zlib.gzipSync(buffer) : null,
  };
  staticCache.set(cacheKey, entry);
  return entry;
}

function serveStatic(req, res, urlObj) {
  const startedAt = Date.now();
  let pathname = urlObj.pathname;
  if (/^\/[^/]+\/detail\/?$/.test(pathname)) {
    pathname = "/detail.html";
  }
  const filePath = safePath(pathname === "/" ? "/index.html" : pathname);
  if (!filePath.startsWith(ROOT)) return send(req, res, 403, "Forbidden");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(req, res, 404, "Not Found");
  }
  const entry = loadStaticEntry(filePath);
  console.log(`[perf][server] serveStatic ${pathname} ext=${entry.ext} bytes=${entry.size} prep=${Date.now() - startedAt}ms`);
  if (req.headers["if-none-match"] === entry.etag) {
    res.writeHead(304, {
      ETag: entry.etag,
      "Cache-Control": staticCacheControl(entry.ext, urlObj.search),
      Vary: "Accept-Encoding",
    });
    res.end();
    return;
  }

  let body = entry.buffer;
  const headers = {
    "Cache-Control": staticCacheControl(entry.ext, urlObj.search),
    ETag: entry.etag,
  };
  if (acceptsEncoding(req, "br") && entry.br) {
    body = entry.br;
    headers["Content-Encoding"] = "br";
  } else if (acceptsEncoding(req, "gzip") && entry.gzip) {
    body = entry.gzip;
    headers["Content-Encoding"] = "gzip";
  }

  headers["Content-Length"] = body.length;
  headers.Vary = "Accept-Encoding";
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Content-Type"] = entry.contentType;
  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(body);
}

function getLanUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];
  Object.values(interfaces).forEach((group) => {
    (group || []).forEach((item) => {
      if (!item || item.internal) return;
      if (item.family !== "IPv4") return;
      urls.push(`http://${item.address}:${port}`);
    });
  });
  return [...new Set(urls)];
}

http.createServer((req, res) => {
  requestLogger(req, res);
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/db") return serveDb(req, res);
  if (url.pathname === "/api/auth/send-email") return serveSendEmail(req, res);
  return serveStatic(req, res, url);
}).listen(PORT, "0.0.0.0", () => {
  console.log(`ANIMA server running on http://localhost:${PORT}`);
  getLanUrls(PORT).forEach((url) => console.log(`LAN access: ${url}`));
});
