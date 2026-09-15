const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

function generateToken(user) {
  return jwt.sign(
    { id: user._id, userId: user._id, email: user.email },
    process.env.JWT_SECRET || "skilltwin_super_secret_jwt_key_2026",
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const name = req.body.name || req.body.fullName;
    const { email, password, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email address." });
    }

    const user = new User({
      name,
      email,
      password,
      college: college || ""
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || "Failed to create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const targetId = req.user?.id || req.user?.userId;
    const { name, fullName, college } = req.body;
    const updatedName = name || fullName;

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (updatedName) user.name = updatedName;
    if (college !== undefined) user.college = college;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
