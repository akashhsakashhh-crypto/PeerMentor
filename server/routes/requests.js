
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

// MongoDB Request Schema
const requestSchema = new mongoose.Schema(
  {
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
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

const Request = mongoose.models.Request ||
  mongoose.model("Request", requestSchema);


// 1. Create a mentorship request
router.post("/", async (req, res) => {
  try {
    const { studentId, studentName, mentorId, message } = req.body;

    if (!studentId || !studentName || !mentorId || !message) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    if (!mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({
        message: "Invalid mentor ID"
      });
    }

    const mentor = await User.findOne({
      _id: mentorId,
      role: "senior"
    });

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found"
      });
    }

    const newRequest = await Request.create({
      studentId,
      studentName,
      mentorId: mentor._id.toString(),
      mentorName: mentor.name,
      message: message.trim(),
      status: "pending"
    });

    res.status(201).json({
      message: "Mentorship request sent successfully",
      request: newRequest
    });

  } catch (error) {
    console.error("Create request error:", error);

    res.status(500).json({
      message: "Could not create mentorship request"
    });
  }
});


// 2. View all requests
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    console.error("Fetch requests error:", error);

    res.status(500).json({
      message: "Could not fetch requests"
    });
  }
});


// 3. View requests received by a mentor
router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({
        message: "Invalid mentor ID"
      });
    }

    const mentorRequests = await Request.find({
      mentorId
    }).sort({ createdAt: -1 });

    res.json({
      totalRequests: mentorRequests.length,
      requests: mentorRequests
    });

  } catch (error) {
    console.error("Fetch mentor requests error:", error);

    res.status(500).json({
      message: "Could not fetch mentor requests"
    });
  }
});


// 4. View requests sent by a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    const studentRequests = await Request.find({
      studentId
    }).sort({ createdAt: -1 });

    res.json({
      totalRequests: studentRequests.length,
      requests: studentRequests
    });

  } catch (error) {
    console.error("Fetch student requests error:", error);

    res.status(500).json({
      message: "Could not fetch student requests"
    });
  }
});


// 5. Accept or reject a request
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid request ID"
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be accepted or rejected"
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Mentorship request not found"
      });
    }

    if (request.status !== "pending") {
      return res.status(409).json({
        message: "This request has already been processed"
      });
    }

    request.status = status;
    await request.save();

    res.json({
      message: `Mentorship request ${status} successfully`,
      request
    });

  } catch (error) {
    console.error("Update request error:", error);

    res.status(500).json({
      message: "Could not update mentorship request"
    });
  }
});

module.exports = router;
