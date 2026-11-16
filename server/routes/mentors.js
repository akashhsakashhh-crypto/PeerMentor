
const express = require("express");
const User = require("../models/User");
const { readDB, writeDB } = require("../utils/db");
const { matchMentors } = require("../services/matchingService");

const router = express.Router();

// ==========================================
// 1. GET /api/mentors
// Get all completed senior mentor profiles
// GET /api/mentors?skill=Java
// ==========================================

router.get("/", async (req, res) => {
  try {
    const { skill } = req.query;

    const filter = {
      role: "senior",
      profileCompleted: true
    };

    if (skill) {
      filter.skills = {
        $elemMatch: {
          $regex: `^${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i"
        }
      };
    }

    const mentors = await User.find(filter).select("-password");

    const result = mentors.map((mentor) => ({
      id: mentor._id.toString(),
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      company: mentor.company,
      jobRole: mentor.jobRole,
      experience: mentor.experience,
      skills: mentor.skills,
      availability: mentor.availability,
      bio: mentor.bio,
      profileCompleted: mentor.profileCompleted
    }));

    res.json(result);

  } catch (error) {
    console.error("Fetch mentors error:", error);

    res.status(500).json({
      message: "Could not fetch mentors"
    });
  }
});


// ==========================================
// 2. POST /api/mentors/match
// Smart Match mentors from MongoDB
// ==========================================

router.post("/match", async (req, res) => {
  try {
    const { skills = [], days = [] } = req.body;

    if (!Array.isArray(skills) || !Array.isArray(days)) {
      return res.status(400).json({
        message: "Skills and days must be arrays"
      });
    }

    if (skills.length === 0) {
      return res.status(400).json({
        message: "Select at least one skill"
      });
    }

    const mentors = await User.find({
      role: "senior",
      profileCompleted: true
    }).select("-password");

    const formattedMentors = mentors.map((mentor) => ({
      id: mentor._id.toString(),
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      company: mentor.company,
      jobRole: mentor.jobRole,
      experience: mentor.experience,
      skills: mentor.skills,
      availability: mentor.availability,
      bio: mentor.bio,
      profileCompleted: mentor.profileCompleted
    }));

    const results = matchMentors(formattedMentors, {
      skills,
      days
    });

    res.json(results);

  } catch (error) {
    console.error("Mentor matching error:", error);

    res.status(500).json({
      message: "Could not match mentors"
    });
  }
});


// ==========================================
// 3. GET /api/mentors/:id
// Legacy JSON mentor lookup
// ==========================================

router.get("/:id", (req, res) => {
  try {
    const mentorId = Number(req.params.id);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({
        message: "Invalid mentor ID"
      });
    }

    const db = readDB();

    const mentor = db.users.find(
      (user) =>
        user.id === mentorId &&
        user.role === "senior"
    );

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found"
      });
    }

    res.json(mentor);

  } catch (error) {
    console.error("Fetch mentor error:", error);

    res.status(500).json({
      message: "Could not fetch mentor"
    });
  }
});


// ==========================================
// 4. PUT /api/mentors/:id
// Legacy JSON mentor profile update
// ==========================================

router.put("/:id", (req, res) => {
  try {
    const mentorId = Number(req.params.id);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({
        message: "Invalid mentor ID"
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
      typeof company !== "string" ||
      !company.trim() ||
      typeof jobRole !== "string" ||
      !jobRole.trim() ||
      experience === undefined ||
      !Array.isArray(skills) ||
      !Array.isArray(availability) ||
      typeof bio !== "string"
    ) {
      return res.status(400).json({
        message: "Please provide all required profile fields"
      });
    }

    if (
      !Number.isFinite(Number(experience)) ||
      Number(experience) < 0 ||
      skills.some(
        (skill) =>
          typeof skill !== "string" || !skill.trim()
      ) ||
      availability.some(
        (slot) =>
          typeof slot !== "string" || !slot.trim()
      )
    ) {
      return res.status(400).json({
        message: "Please provide valid experience, skills and availability"
      });
    }

    const db = readDB();

    const mentor = db.users.find(
      (user) =>
        user.id === mentorId &&
        user.role === "senior"
    );

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found"
      });
    }

    mentor.company = company.trim();
    mentor.jobRole = jobRole.trim();
    mentor.experience = Number(experience);
    mentor.skills = skills.map((skill) => skill.trim());
    mentor.availability = availability.map((slot) => slot.trim());
    mentor.bio = bio.trim();

    writeDB(db);

    res.json({
      message: "Mentor profile updated successfully",
      mentor
    });

  } catch (error) {
    console.error("Update mentor profile error:", error);

    res.status(500).json({
      message: "Could not update mentor profile"
    });
  }
});

module.exports = router;
