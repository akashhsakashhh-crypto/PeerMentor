
import { useEffect, useState } from "react";
import { getMentors, createRequest } from "../services/api";
import "./MentorSearch.css";

const SKILLS = [
  "All",
  "Java",
  "DSA",
  "Web Development",
  "Cloud",
  "Placement",
  "Projects"
];

export default function MentorSearch() {
  const [mentors, setMentors] = useState([]);
  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(null);

  const [requestMessage, setRequestMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [sending, setSending] = useState(false);

  // Send mentorship request to backend
  async function handleSendRequest() {
    if (!requestMessage.trim()) {
      setRequestStatus("Please enter a message.");
      return;
    }

    try {
      setSending(true);
      setRequestStatus("");

      const result = await createRequest({
        studentId: 101,
        studentName: "Akash",
        mentorId: selectedMentor.id,
        message: requestMessage.trim()
      });

      setRequestStatus(result.message);
      setRequestMessage("");

    } catch (error) {
      setRequestStatus(error.message || "Something went wrong.");

    } finally {
      setSending(false);
    }
  }

  // Load mentors from backend
  useEffect(() => {
    setLoading(true);
    setError("");

    getMentors(active === "All" ? "" : active)
      .then(setMentors)
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));

  }, [active]);

  // Display selected mentor profile
  if (selectedMentor) {
    const m = selectedMentor;

    return (
      <div className="app-container">

        <header className="app-header">
          <h1>Mentor Profile</h1>
          <p>Get to know your mentor.</p>
        </header>

        <section className="mentor-card profile-card">

          <h2>{m.name}</h2>
          <p>{m.company} | Year {m.year}</p>

          <h3>About Me</h3>
          <p className="mentor-bio">{m.bio}</p>

          <h3>Skills and Expertise</h3>
          <div className="mentor-skills">
            {m.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>

          <h3>Availability</h3>
          <div className="availability">
            {m.availability.map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>

          <h3>Mentor Rating</h3>
          <p>Rating: {m.rating} / 5</p>

          <h3>Send a Mentorship Request</h3>

          <textarea
            placeholder="Why do you want mentorship?"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            rows={4}
            disabled={sending}
          />

          <button
            className="request-button"
            onClick={handleSendRequest}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Mentorship Request"}
          </button>

          {requestStatus && (
            <p role="status">{requestStatus}</p>
          )}

          <button
            className="back-button"
            onClick={() => {
              setSelectedMentor(null);
              setRequestMessage("");
              setRequestStatus("");
            }}
          >
            Back to Mentors
          </button>

        </section>
      </div>
    );
  }

  // Display all mentors
  return (
    <div className="app-container">

      <header className="app-header">
        <h1>PeerMentor</h1>
        <p>Learn together. Grow together.</p>
      </header>

      <section className="search-section">
        <h2>Find Your Mentor</h2>
        <p>Connect with experienced seniors.</p>

        <div className="skill-filters">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              className={active === skill ? "active" : ""}
              onClick={() => setActive(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </section>

      {loading && <p>Loading mentors...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && mentors.length === 0 && !error && (
        <p>No mentors found.</p>
      )}

      <section className="mentor-list">
        {mentors.map((m) => (
          <div className="mentor-card" key={m.id}>

            <div className="mentor-top">
              <div>
                <h3>{m.name}</h3>
                <p>{m.company} | Year {m.year}</p>
              </div>

              <span className="rating">
                Rating: {m.rating}
              </span>
            </div>

            <p className="mentor-bio">{m.bio}</p>

            <div className="mentor-skills">
              {m.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <div className="availability">
              <strong>Availability</strong>
              <p>{m.availability.join(" | ")}</p>
            </div>

            <button
              className="request-button"
              onClick={() => {
                setSelectedMentor(m);
                setRequestMessage("");
                setRequestStatus("");
              }}
            >
              View Profile
            </button>

          </div>
        ))}
      </section>

    </div>
  );
}
