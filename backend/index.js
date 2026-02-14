import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env regardless of current working directory.
dotenv.config({ path: path.join(__dirname, ".env") });
// Optional fallback if someone also keeps a repo-root .env.
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend (main folder)
app.use(express.static(path.join(__dirname, '../')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.log("❌ MongoDB connection error:", err.message);
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

// Handle all other frontend routes
app.get("/:page", (req, res) => {
  const page = req.params.page;
  if (page.endsWith('.html') || page.endsWith('.css') || page.endsWith('.js')) {
    res.sendFile(path.join(__dirname, '../', page));
  } else {
    res.status(404).json({ message: "Page not found" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌐 Frontend available`);
});
