import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import express from "express";
import {
  hasErrors,
  normalizeInquiry,
  validateInquiry,
  type InquiryInput,
  type ProjectType,
} from "../src/lib/validate.ts";

function loadEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const adminPassword = process.env.ADMIN_PASSWORD ?? "";
if (adminPassword.length < 10 || adminPassword.length > 128) {
  console.error("ADMIN_PASSWORD .env içinde 10 ile 128 karakter arasında olmalı.");
  process.exit(1);
}

const port = Number(process.env.API_PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("API_PORT geçersiz.");
  process.exit(1);
}

const passwordHash = crypto.scryptSync(adminPassword, "aylin-gedik-yonetim", 32);
const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "inquiries.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT NOT NULL,
    project_name TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT NOT NULL,
    budget TEXT
  )
`);

type StoredInquiry = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  projectType: ProjectType;
  projectName: string;
  description: string;
  features: string;
  budget: string | null;
};

const sessions = new Map<string, number>();
const hits = new Map<string, { count: number; reset: number }>();

function text(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, 4000);
}

function clientIp(req: express.Request) {
  return req.socket.remoteAddress || "local";
}

function pruneMaps(now: number) {
  for (const [key, value] of hits) {
    if (now > value.reset) hits.delete(key);
  }
  for (const [token, expiry] of sessions) {
    if (now > expiry) sessions.delete(token);
  }
  while (hits.size > 500) {
    const oldest = hits.keys().next().value;
    if (!oldest) break;
    hits.delete(oldest);
  }
  while (sessions.size > 20) {
    const oldest = sessions.keys().next().value;
    if (!oldest) break;
    sessions.delete(oldest);
  }
}

function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 200 || sessions.size > 20) pruneMaps(now);
  const current = hits.get(key);
  if (!current || now > current.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

function passwordMatches(input: string) {
  if (input.length < 10 || input.length > 128) return false;
  const hash = crypto.scryptSync(input, "aylin-gedik-yonetim", 32);
  return crypto.timingSafeEqual(hash, passwordHash);
}

function readCookie(req: express.Request, name: string) {
  const raw = req.headers.cookie;
  if (!raw) return "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return "";
      }
    }
  }
  return "";
}

function sessionValid(token: string) {
  const expiry = sessions.get(token);
  if (!expiry || Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function setSession(res: express.Response, token: string | null) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = token
    ? `ag_session=${token}; HttpOnly; Path=/; Max-Age=${12 * 60 * 60}; SameSite=Strict${secure}`
    : `ag_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`;
  res.setHeader("Set-Cookie", cookie);
}

type InquiryRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  project_type: ProjectType;
  project_name: string;
  description: string;
  features: string;
  budget: string | null;
};

const insertInquiry = db.prepare(
  `INSERT OR IGNORE INTO inquiries
   (id, created_at, name, email, project_type, project_name, description, features, budget)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

function migrateJson() {
  const jsonFile = path.join(dataDir, "inquiries.json");
  if (!fs.existsSync(jsonFile)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8").replace(/^\uFEFF/, "")) as StoredInquiry[];
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (!item?.id || !item.email) continue;
      try {
        insertInquiry.run(
          item.id,
          item.createdAt,
          item.name,
          item.email,
          item.projectType,
          item.projectName,
          item.description,
          item.features,
          item.budget,
        );
      } catch {
        continue;
      }
    }
  } catch {
    return;
  }
}

migrateJson();

const selectInquiries = db.prepare(
  `SELECT id, created_at, name, email, project_type, project_name, description, features, budget
   FROM inquiries ORDER BY created_at DESC LIMIT 500`,
);

function readInquiries(): StoredInquiry[] {
  const rows = selectInquiries.all() as InquiryRow[];
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    projectType: row.project_type,
    projectName: row.project_name,
    description: row.description,
    features: row.features,
    budget: row.budget,
  }));
}

function saveInquiry(entry: StoredInquiry) {
  const result = insertInquiry.run(
    entry.id,
    entry.createdAt,
    entry.name,
    entry.email,
    entry.projectType,
    entry.projectName,
    entry.description,
    entry.features,
    entry.budget,
  );
  if (!result.changes) throw new Error("kayıt yazılamadı");
}

function requireAdmin(req: express.Request, res: express.Response) {
  if (!sessionValid(readCookie(req, "ag_session"))) {
    res.status(401).json({ message: "Bu kayıtları görmek için giriş yapın." });
    return false;
  }
  return true;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
  }
  next();
});

app.post("/api/inquiries", (req, res) => {
  if (limited(`post:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    res.status(429).json({ message: "Çok fazla deneme yapıldı. Biraz sonra yeniden deneyin." });
    return;
  }
  const body = req.body as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ message: "Geçersiz istek." });
    return;
  }
  const input: InquiryInput = {
    name: text(body.name),
    email: text(body.email),
    projectType: body.projectType === "web" || body.projectType === "mobile" ? body.projectType : "",
    projectName: text(body.projectName),
    description: text(body.description),
    features: text(body.features),
    budget: text(body.budget),
    company: text(body.company),
  };
  const normalized = normalizeInquiry(input);
  if (normalized.company) {
    res.status(201).json({ ok: true });
    return;
  }
  const fields = validateInquiry(normalized);
  if (hasErrors(fields)) {
    res.status(400).json({ message: "Formdaki alanları kontrol edin.", fields });
    return;
  }
  const entry: StoredInquiry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: normalized.name,
    email: normalized.email,
    projectType: normalized.projectType as ProjectType,
    projectName: normalized.projectName,
    description: normalized.description,
    features: normalized.features,
    budget: normalized.budget || null,
  };
  try {
    saveInquiry(entry);
  } catch {
    res.status(500).json({ message: "Talep kaydedilemedi." });
    return;
  }
  res.status(201).json({ ok: true });
});

app.post("/api/admin/login", (req, res) => {
  if (limited(`login:${clientIp(req)}`, 6, 10 * 60 * 1000)) {
    res.status(429).json({ message: "Çok fazla deneme yapıldı. Biraz sonra yeniden deneyin." });
    return;
  }
  const password = text((req.body as { password?: unknown } | null)?.password);
  if (!passwordMatches(password)) {
    res.status(401).json({ message: "Şifre hatalı." });
    return;
  }
  pruneMaps(Date.now());
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
  setSession(res, token);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  sessions.delete(readCookie(req, "ag_session"));
  setSession(res, null);
  res.json({ ok: true });
});

app.get("/api/inquiries", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ inquiries: readInquiries() });
});

const dist = path.join(process.cwd(), "dist");
const indexFile = path.join(dist, "index.html");
if (process.env.NODE_ENV === "production" && fs.existsSync(indexFile)) {
  app.use(express.static(dist, { dotfiles: "deny", maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || path.extname(req.path)) {
      res.status(404).json({ message: "Bulunamadı." });
      return;
    }
    res.sendFile(indexFile);
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status =
    typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 500;
  const code = status === 400 || status === 413 ? status : 500;
  res.status(code).json({
    message: code === 413 ? "İstek çok büyük." : code === 400 ? "Geçersiz istek." : "Sunucu hatası.",
  });
});

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`API http://127.0.0.1:${port}`);
});
server.on("error", () => {
  console.error("API başlatılamadı.");
  process.exit(1);
});
