// authRoutes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../lib/email/service.js";

const router = express.Router();

// ===== SIGNUP =====
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
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

    const user = await User.findOne({ email });
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
