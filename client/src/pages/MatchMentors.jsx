
import { useState } from "react";
import { matchMentors, createRequest } from "../services/api";
import "./MatchMentors.css";

const SKILLS = [
  "Java", "DSA", "Web Development",
  "Cloud", "Placement", "Projects"
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toggle(list, item) {
  return list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list, item];
}

export default function MatchMentors({ user }) {
  const [skills, setSkills] = useState([]);
  const [days, setDays] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [success, setSuccess] = useState("");

  async function handleMatch() {
    setError("");
    setSuccess("");

    if (skills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    setLoading(true);

    try {
      // Convert Mon to Monday, Tue to Tuesday, etc.
      const fullDays = days.map((day) => {
        const dayMap = {
          Mon: "Monday",
          Tue: "Tuesday",
          Wed: "Wednesday",
          Thu: "Thursday",
          Fri: "Friday",
          Sat: "Saturday",
          Sun: "Sunday"
        };

        return dayMap[day];
      });

      const data = await matchMentors(skills, fullDays);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(mentor) {
    setError("");
    setSuccess("");

    if (!user || !user.id) {
      setError("User information not found. Please login again.");
      return;
    }

    const message = window.prompt(
      `Why do you want mentorship from ${mentor.name}?`
    );

    if (!message || !message.trim()) {
      return;
    }

    setRequestingId(mentor.id);

    try {
      const result = await createRequest({
        studentId: user.id,
        studentName: user.name,
        mentorId: mentor.id,
        message: message.trim()
      });

      setSuccess(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <div className="match-container">

      <header className="match-header">
        <h1>Smart Match</h1>
        <p>Find the right senior to guide you.</p>
      </header>

      <h3>What do you need help with?</h3>

      <div className="match-options">
        {SKILLS.map((skill) => (
          <button
            key={skill}
            className={skills.includes(skill) ? "selected" : ""}
            onClick={() => setSkills(toggle(skills, skill))}
          >
            {skill}
          </button>
        ))}
      </div>

      <h3>Which days are you available?</h3>

      <div className="match-options">
        {DAYS.map((day) => (
          <button
            key={day}
            className={days.includes(day) ? "selected" : ""}
            onClick={() => setDays(toggle(days, day))}
          >
            {day}
          </button>
        ))}
      </div>

      <button
        className="find-button"
        onClick={handleMatch}
        disabled={loading}
      >
        {loading ? "Finding mentors..." : "Find My Best Match"}
      </button>

      {error && <p className="match-error">{error}</p>}
      {success && <p className="match-success">{success}</p>}

      <div className="match-results">
        {results.map((mentor) => (
          <div className="match-card" key={mentor.id}>
            <div className="match-card-top">
              <div>
                <h3>{mentor.name}</h3>
                <p>
                  {mentor.company} · {mentor.experience} Years
                </p>
              </div>

              <span>{mentor.matchPercent}% Match</span>
            </div>

            <h4>Why this mentor?</h4>

            <ul>
              {mentor.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>

            <button
              className="find-button"
              onClick={() => handleRequest(mentor)}
              disabled={requestingId === mentor.id}
            >
              {requestingId === mentor.id
                ? "Sending..."
                : "Request Mentorship"}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
