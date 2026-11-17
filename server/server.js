
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const mentorRoutes = require("./routes/mentors");
const requestRoutes = require("./routes/requests");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("PeerMentor server is running");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sessions", sessionRoutes);

// Render provides PORT automatically
const PORT = process.env.PORT || 5000;

// Connect MongoDB before starting the server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("PeerMentor server is running!");
      console.log(`Server running on port ${PORT}`);
      console.log("MongoDB connection established.");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
