
import { useState } from "react";

import MentorSearch from "./pages/MentorSearch";
import MatchMentors from "./pages/MatchMentors";
import SeniorDashboard from "./pages/SeniorDashboard";
import JuniorDashboard from "./pages/JuniorDashboard";

import { loginUser, registerUser } from "./services/api";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("match");
  const [showRegister, setShowRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("junior");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileData, setProfileData] = useState({
    company: "",
    jobRole: "",
    experience: "",
    skills: "",
    availability: "",
    bio: ""
  });

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const result = await registerUser({
        name,
        email,
        password,
        role
      });

      setMessage(result.message + ". Please login.");
      setShowRegister(false);
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const result = await loginUser({
        email,
        password
      });

      localStorage.setItem("token", result.token);
      setUser(result.user);

      setActiveTab(
        result.user.role === "senior" ? "senior" : "match"
      );

      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setEmail("");
    setPassword("");
    setActiveTab("match");
    setMessage("");
    setError("");
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setError("");
    setSavingProfile(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            company: profileData.company,
            jobRole: profileData.jobRole,
            experience: profileData.experience,
            skills: profileData.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            availability: profileData.availability
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            bio: profileData.bio
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save profile");
      }

      setUser((previous) => ({
        ...previous,
        profileCompleted: true
      }));

      setMessage("Your mentor profile was saved successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  // Login and registration screen
  if (!user) {
    return (
      <div className="app-layout">
        <main className="auth-container">
          <h1>PeerMentor</h1>
          <p>Learn together. Grow together.</p>

          <div className="auth-card">
            <h2>
              {showRegister ? "Create Account" : "Welcome Back"}
            </h2>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={showRegister ? handleRegister : handleLogin}>
              {showRegister && (
                <>
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </>
              )}

              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {showRegister && (
                <>
                  <label>Select Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="junior">Junior Student</option>
                    <option value="senior">Senior Mentor</option>
                  </select>
                </>
              )}

              <button type="submit" className="auth-button">
                {showRegister ? "Register" : "Login"}
              </button>
            </form>

            <p className="auth-switch">
              {showRegister
                ? "Already have an account?"
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() => {
                  setShowRegister(!showRegister);
                  setMessage("");
                  setError("");
                }}
              >
                {showRegister ? "Login" : "Register"}
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Senior profile completion screen
  if (user.role === "senior" && !user.profileCompleted) {
    return (
      <div className="app-layout">
        <main className="auth-container">
          <h1>PeerMentor</h1>
          <p>Complete your mentor profile</p>

          <div className="auth-card">
            <h2>Mentor Details</h2>

            <p>Welcome, {user.name}! Please provide your professional details.</p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleProfileSubmit}>
              <label>Company Name</label>
              <input
                name="company"
                value={profileData.company}
                onChange={handleProfileChange}
                placeholder="e.g. Google"
                required
              />

              <label>Job Role</label>
              <input
                name="jobRole"
                value={profileData.jobRole}
                onChange={handleProfileChange}
                placeholder="e.g. Software Engineer"
                required
              />

              <label>Years of Experience</label>
              <input
                type="number"
                name="experience"
                min="0"
                step="0.5"
                value={profileData.experience}
                onChange={handleProfileChange}
                required
              />

              <label>Technical Skills</label>
              <input
                name="skills"
                value={profileData.skills}
                onChange={handleProfileChange}
                placeholder="Java, DSA, React"
                required
              />

              <label>Availability</label>
              <input
                name="availability"
                value={profileData.availability}
                onChange={handleProfileChange}
                placeholder="Monday 6-8 PM, Saturday 10 AM"
                required
              />

              <label>About Me</label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                placeholder="Tell students about yourself"
                rows="4"
                required
              />

              <button
                type="submit"
                className="auth-button"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving Profile..." : "Save Profile"}
              </button>
            </form>

            <button
              type="button"
              className="auth-switch"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Main application after login
  return (
    <div className="app-layout">
      <main className="app-content">

        <div className="user-header">
          <span>
            Welcome, {user.name} ({user.role})
          </span>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>

        {message && <p className="success-message">{message}</p>}

        {user.role === "junior" && (
          <>
            {activeTab === "match" && <MatchMentors user={user} />}
            {activeTab === "browse" && <MentorSearch />}
            {activeTab === "junior" && <JuniorDashboard />}
          </>
        )}

        {user.role === "senior" && (
          <>
            {activeTab === "senior" && (
              <SeniorDashboard user={user} />
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {user.role === "junior" && (
          <>
            <button
              className={activeTab === "match" ? "active" : ""}
              onClick={() => setActiveTab("match")}
            >
              Smart Match
            </button>

            <button
              className={activeTab === "browse" ? "active" : ""}
              onClick={() => setActiveTab("browse")}
            >
              Browse Mentors
            </button>

            <button
              className={activeTab === "junior" ? "active" : ""}
              onClick={() => setActiveTab("junior")}
            >
              My Dashboard
            </button>
          </>
        )}

        {user.role === "senior" && (
          <button
            className="active"
            onClick={() => setActiveTab("senior")}
          >
            Senior Dashboard
          </button>
        )}
      </nav>
    </div>
  );
}

export default App;
