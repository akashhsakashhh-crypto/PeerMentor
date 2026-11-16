
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["junior", "senior"],
      required: true
    },

    // Senior mentor profile details
    company: {
      type: String,
      default: ""
    },

    jobRole: {
      type: String,
      default: ""
    },

    experience: {
      type: Number,
      default: 0
    },

    skills: {
      type: [String],
      default: []
    },

    availability: {
      type: [String],
      default: []
    },

    bio: {
      type: String,
      default: ""
    },

    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
