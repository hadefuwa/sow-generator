const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT_DIR, "data"));
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || "").trim();

const JSON_FILES = {
  topics: "topics.json",
  hardware: "hardware.json",
  templates: "templates.json"
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, {
        ok: true,
        env: {
          dataDir: DATA_DIR,
          adminTokenConfigured: Boolean(ADMIN_TOKEN)
        }
      });
    }

    if (pathname.startsWith("/api/")) {
      const key = pathname.replace("/api/", "");
      if (!Object.prototype.hasOwnProperty.call(JSON_FILES, key)) {
        return sendJson(res, 404, { error: "Unknown API resource" });
      }
      if (req.method === "GET") {
        return handleGetJson(key, res);
      }
      if (req.method === "PUT") {
        return handlePutJson(req, res, key);
      }
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    return serveStatic(pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

async function handleGetJson(key, res) {
  const filePath = path.join(DATA_DIR, JSON_FILES[key]);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return sendJson(res, 200, parsed);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendJson(res, 404, { error: `${JSON_FILES[key]} not found` });
    }
    return sendJson(res, 500, { error: `Could not read ${JSON_FILES[key]}` });
  }
}

async function handlePutJson(req, res, key) {
  if (!ADMIN_TOKEN) {
    return sendJson(res, 500, { error: "ADMIN_TOKEN is not configured on the server" });
  }
  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Invalid JSON body" });
  }

  if (!Array.isArray(body)) {
    return sendJson(res, 400, { error: "Payload must be a JSON array" });
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, JSON_FILES[key]);
    await fs.writeFile(filePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    return sendJson(res, 200, { ok: true, saved: JSON_FILES[key], count: body.length });
  } catch (error) {
    return sendJson(res, 500, { error: `Could not write ${JSON_FILES[key]}` });
  }
}

function isAuthorized(req) {
  const tokenHeader = String(req.headers["x-admin-token"] || "").trim();
  const authHeader = String(req.headers.authorization || "").trim();
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const token = tokenHeader || bearer;
  return token && token === ADMIN_TOKEN;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    throw new Error("Request body cannot be empty");
  }
  return JSON.parse(raw);
}

async function serveStatic(pathname, res) {
  const candidatePath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(candidatePath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = path.join(ROOT_DIR, safePath);

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    return await sendFile(res, filePath);
  } catch (_) {
    // SPA fallback for client-side navigation.
    return sendFile(res, path.join(ROOT_DIR, "index.html"));
  }
}

async function sendFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300"
    });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
