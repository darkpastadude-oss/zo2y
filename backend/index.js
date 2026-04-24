import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  attachRequestContext,
  applySecurityHeaders,
  createRateLimiter,
  jsonErrorHandler,
  requestLogger,
  notFoundJson
} from "./lib/guardrails.js";

// Fix for ES modules and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env regardless of current working directory.
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "authRoutes/.env") });
// Optional fallback if someone also keeps a repo-root .env.
dotenv.config();

const app = express();

function parseCorsOrigins() {
  const raw = String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const defaults = [
    String(process.env.APP_BASE_URL || "").trim(),
    "https://zo2y.com",
    "https://www.zo2y.com",
    "http://localhost:3000",
    "http://localhost:5000"
  ].filter(Boolean);
  return new Set([...defaults, ...raw]);
}

const corsAllowAll = String(process.env.CORS_ALLOW_ALL || "").trim().toLowerCase() === "true";
const allowedCorsOrigins = parseCorsOrigins();
const corsOptions = corsAllowAll
  ? { origin: true, credentials: true }
  : {
      origin(origin, callback) {
        // Allow non-browser requests (curl, server-to-server).
        if (!origin) return callback(null, true);
        if (allowedCorsOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    };

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.disable("x-powered-by");
app.use(attachRequestContext);
app.use(applySecurityHeaders);
app.use(requestLogger);
app.use("/api", createRateLimiter({
  keyPrefix: "backend",
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.API_RATE_LIMIT_MAX || 240),
  skip: (req) => req.method === "OPTIONS"
}));

// Serve static files from frontend (main folder)
app.use(express.static(path.join(__dirname, '../')));

function normalizeMongoUri(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
}

function hasValidMongoScheme(uri) {
  return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
}

// Connect to MongoDB
const connectDB = async () => {
  const mongoUri = normalizeMongoUri(process.env.MONGO_URI);
  if (!mongoUri) {
    console.log('[WARN] MONGO_URI is empty. Skipping MongoDB connection.');
    console.log('[WARN] Set MONGO_URI in backend/.env to mongodb://... or mongodb+srv://...');
    return;
  }
  if (!hasValidMongoScheme(mongoUri)) {
    console.log('[WARN] MONGO_URI has an invalid scheme. Expected mongodb:// or mongodb+srv://');
    console.log('[WARN] Current value in backend/.env is malformed. Fix it and restart the server.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.log('MongoDB connection error:', err.message);
  }
};
connectDB();

// Import auth routes
import authRoutes from "./routes/auth.js";
app.use("/api/auth", authRoutes);
import igdbRoutes from "./routes/igdb.js";
app.use("/api/igdb", igdbRoutes);
import musicRoutes from "./routes/music.js";
app.use("/api/music", musicRoutes);
import emailRoutes from "./routes/emails.js";
app.use("/api/emails", emailRoutes);
import analyticsRoutes from "./routes/analytics.js";
app.use("/api/analytics", analyticsRoutes);
import supportRoutes from "./routes/support.js";
app.use("/api/support", supportRoutes);
import booksRoutes from "./routes/books.js";
app.use("/api/books", booksRoutes);
import openLibraryRoutes from "./routes/openlibrary.js";
app.use("/api/openlibrary", openLibraryRoutes);

// Serve frontend routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get("/sign-up.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../sign-up.html'));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

app.get("/restraunts.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../restraunts.html'));
});

app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "zo2y-backend",
    uptime_seconds: Math.round(process.uptime()),
    now: new Date().toISOString()
  });
});

// Handle all other frontend routes
app.get("/:page", (req, res) => {
  const page = req.params.page;
  if (page.endsWith('.html') || page.endsWith('.css') || page.endsWith('.js')) {
    res.sendFile(path.join(__dirname, '../', page));
  } else {
    res.status(404).json({ message: "Page not found" });
  }
});

app.use((req, res) => notFoundJson(req, res));
app.use(jsonErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Frontend available");
});
