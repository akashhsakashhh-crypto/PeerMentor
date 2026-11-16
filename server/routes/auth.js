
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Verify JWT token
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}


// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    if (!["junior", "senior"].includes(role)) {
      return res.status(400).json({
        message: "Role must be junior or senior"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted
      }
    });

  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    res.status(500).json({
      message: "Server error during registration"
    });
  }
});


// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT secret is not configured"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error during login"
    });
  }
});


// GET /api/auth/profile
// Get the currently logged-in user's profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({ user });

  } catch (error) {
    console.error("Fetch profile error:", error.message);

    res.status(500).json({
      message: "Could not fetch profile"
    });
  }
});


// PUT /api/auth/profile
// Save senior mentor profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "senior") {
      return res.status(403).json({
        message: "Only senior mentors can create mentor profiles"
      });
    }

    const {
      company,
      jobRole,
      experience,
      skills,
      availability,
      bio
    } = req.body;

    if (
      !company?.trim() ||
      !jobRole?.trim() ||
      experience === undefined ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !Array.isArray(availability) ||
      availability.length === 0 ||
      !bio?.trim()
    ) {
      return res.status(400).json({
        message: "Please complete all mentor profile fields"
      });
    }

    if (
      !Number.isFinite(Number(experience)) ||
      Number(experience) < 0 ||
      skills.some(skill => typeof skill !== "string" || !skill.trim()) ||
      availability.some(slot => typeof slot !== "string" || !slot.trim())
    ) {
      return res.status(400).json({
        message: "Please provide valid profile details"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        company: company.trim(),
        jobRole: jobRole.trim(),
        experience: Number(experience),
        skills: skills.map(skill => skill.trim()),
        availability: availability.map(slot => slot.trim()),
        bio: bio.trim(),
        profileCompleted: true
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Senior account not found"
      });
    }

    res.json({
      message: "Mentor profile saved successfully",
      user
    });

  } catch (error) {
    console.error("Profile save error:", error.message);

    res.status(500).json({
      message: "Could not save mentor profile"
    });
  }
});

module.exports = router;
