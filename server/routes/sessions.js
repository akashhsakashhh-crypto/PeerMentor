
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// =====================================
// MENTORSHIP REQUEST MODEL
// =====================================

const requestSchema = new mongoose.Schema(
  {
    studentId: String,
    studentName: String,
    mentorId: String,
    mentorName: String,
    message: String,
    status: String
  },
  { timestamps: true }
);

const Request =
  mongoose.models.Request ||
  mongoose.model("Request", requestSchema);


// =====================================
// SESSION MODEL
// =====================================

const sessionSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    mentorId: {
      type: String,
      required: true
    },
    mentorName: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    meetingLink: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: "upcoming"
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Session =
  mongoose.models.Session ||
  mongoose.model("Session", sessionSchema);


// =====================================
// 1. SCHEDULE A SESSION
// POST /api/sessions
// =====================================

router.post("/", async (req, res) => {
  try {
    const {
      requestId,
      date,
      time,
      meetingLink
    } = req.body;

    if (!requestId || !date || !time || !meetingLink) {
      return res.status(400).json({
        message: "Please provide all session details"
      });
    }

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({
        message: "Invalid mentorship request ID"
      });
    }

    // Find request in MongoDB
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Mentorship request not found"
      });
    }

    // Only accepted requests can have sessions
    if (request.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted requests can be scheduled"
      });
    }

    // Prevent duplicate sessions
    const existingSession = await Session.findOne({
      requestId: request._id.toString()
    });

    if (existingSession) {
      return res.status(409).json({
        message: "A session already exists for this request"
      });
    }

    const newSession = await Session.create({
      requestId: request._id.toString(),
      studentId: request.studentId,
      studentName: request.studentName,
      mentorId: request.mentorId,
      mentorName: request.mentorName,
      date,
      time,
      meetingLink,
      status: "upcoming"
    });

    res.status(201).json({
      message: "Session scheduled successfully",
      session: newSession
    });

  } catch (error) {
    console.error("Schedule session error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A session already exists for this request"
      });
    }

    res.status(500).json({
      message: "Could not schedule session"
    });
  }
});


// =====================================
// 2. GET SESSIONS FOR A STUDENT
// GET /api/sessions/student/:studentId
// =====================================

router.get("/student/:studentId", async (req, res) => {
  try {
    const sessions = await Session.find({
      studentId: req.params.studentId
    }).sort({ createdAt: -1 });

    res.json({
      totalSessions: sessions.length,
      sessions
    });

  } catch (error) {
    console.error("Fetch student sessions error:", error);

    res.status(500).json({
      message: "Could not fetch student sessions"
    });
  }
});


// =====================================
// 3. GET SESSIONS FOR A MENTOR
// GET /api/sessions/mentor/:mentorId
// =====================================

router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({
        message: "Invalid mentor ID"
      });
    }

    const sessions = await Session.find({
      mentorId
    }).sort({ createdAt: -1 });

    res.json({
      totalSessions: sessions.length,
      sessions
    });

  } catch (error) {
    console.error("Fetch mentor sessions error:", error);

    res.status(500).json({
      message: "Could not fetch mentor sessions"
    });
  }
});


// =====================================
// 4. MARK SESSION AS COMPLETED
// PATCH /api/sessions/:id/complete
// =====================================

router.patch("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid session ID"
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    if (session.status === "completed") {
      return res.status(409).json({
        message: "Session is already completed"
      });
    }

    session.status = "completed";
    session.completedAt = new Date();

    await session.save();

    res.json({
      message: "Session marked as completed",
      session
    });

  } catch (error) {
    console.error("Complete session error:", error);

    res.status(500).json({
      message: "Could not update session"
    });
  }
});

module.exports = router;
