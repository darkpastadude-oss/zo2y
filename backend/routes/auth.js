// authRoutes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendWelcomeEmail } from "../lib/email/service.js";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";
import { createRateLimiter } from "../lib/guardrails.js";

const router = express.Router();
router.use(express.json({ limit: "48kb" }));
router.use(createRateLimiter({
  keyPrefix: "auth",
  windowMs: 60_000,
  max: 30
}));

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFullName(value) {
  return String(value || "").trim().slice(0, 80);
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function mapSupabaseSignupError(error) {
  const message = String(error?.message || "").trim() || "Signup failed";
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return { status: 409, message: "This email is already registered. Please log in instead." };
  }
  if (normalized.includes("password")) {
    return { status: 400, message };
  }
  if (normalized.includes("email")) {
    return { status: 400, message };
  }
  return { status: Number(error?.status || 500) || 500, message };
}

router.post("/password-signup", async (req, res) => {
  try {
    const fullName = normalizeFullName(req.body?.fullName);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: "Signup service is not configured."
      });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        name: fullName
      }
    });

    if (error || !data?.user?.id) {
      const mapped = mapSupabaseSignupError(error);
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Signup failed"
    });
  }
});

// ===== SIGNUP =====
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const safeEmail = normalizeEmail(email);
    const safeUsername = String(username || "").trim();

    if (!safeUsername || safeUsername.length < 3 || safeUsername.length > 40) {
      return res.status(400).json({ message: "Username must be between 3 and 40 characters." });
    }
    if (!/\S+@\S+\.\S+/.test(safeEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (String(password || "").length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existingUser = await User.findOne({ email: safeEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: safeUsername,
      email: safeEmail,
      password: hashedPassword,
    });
    await newUser.save();

    if (String(process.env.AUTO_SEND_WELCOME_EMAIL || "").toLowerCase() === "true") {
      sendWelcomeEmail({
        to: newUser.email,
        name: newUser.username,
        appUrl: process.env.APP_BASE_URL || "https://zo2y.com",
      }).catch((error) => {
        console.error("Welcome email failed:", error.message);
      });
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const safeEmail = String(email || "").trim().toLowerCase();
    if (!safeEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: safeEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== PROTECTED ROUTE =====
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(403).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Invalid token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Token is valid", user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
