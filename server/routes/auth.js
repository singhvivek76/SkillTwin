const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const mongoose = require('mongoose');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
//|| "skilltwin_super_secret_jwt_key_2026",

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Defensive password comparison (works whether comparePassword helper exists or not)
    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Ensure JWT secret exists so jwt.sign doesn't crash the server
    const jwtSecret = process.env.JWT_SECRET || 'skilltwin_fallback_secret_key_2026';

    const token = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        email: user.email
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college || user.branch || ''
      }
    });
  } catch (err) {
    console.error('[Login Error Detail]:', err);
    return res.status(500).json({
      message: err.message || 'Server error during login'
    });
  }
});



// POST /api/auth/login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required." });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     const token = generateToken(user);

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         fullName: user.name,
//         email: user.email,
//         college: user.college
//       }
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Login failed" });
//   }
// });


router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid session. Please sign out and sign in again.' });
    }

    const { name, fullName, college, branch } = req.body;

    const updates = {};
    if (name || fullName) {
      updates.name = (name || fullName).trim();
    }
    if (college !== undefined || branch !== undefined) {
      updates.college = (college || branch || '').trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: false }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found in database.' });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        college: updatedUser.college
      }
    });
  } catch (err) {
    console.error('[Profile Update Error]:', err);
    return res.status(500).json({ message: err.message || 'Server error updating profile' });
  }
});


// // PUT /api/auth/profile
// router.put("/profile", authMiddleware, async (req, res) => {
//   try {
//     const targetId = req.user?.id || req.user?.userId;
//     const { name, fullName, college } = req.body;
//     const updatedName = name || fullName;

//     const user = await User.findById(targetId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (updatedName) user.name = updatedName;
//     if (college !== undefined) user.college = college;

//     await user.save();

//     res.json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         fullName: user.name,
//         email: user.email,
//         college: user.college
//       }
//     });
//   } catch (err) {
//     console.error("Profile update error:", err);
//     res.status(500).json({ error: "Failed to update profile" });
//   }
// });

module.exports = router;
