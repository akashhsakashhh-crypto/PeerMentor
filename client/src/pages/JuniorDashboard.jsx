
import { useEffect, useState } from "react";
import "./JuniorDashboard.css";

const API_URL = "http://localhost:5000/api";

function JuniorDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [student, setStudent] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      // Get the currently logged-in student's MongoDB profile
      const profileResponse = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Unable to fetch student profile. Please log in again.");
      }

      const profileData = await profileResponse.json();
      const studentProfile = profileData.user;

      setStudent(studentProfile);

      // Use the logged-in student's MongoDB ID dynamically
      const studentId = studentProfile._id || studentProfile.id;

      if (!studentId) {
        throw new Error("Student ID not found.");
      }

      // Fetch requests and sessions belonging to this student
      const [requestResponse, sessionResponse] = await Promise.all([
        fetch(`${API_URL}/requests/student/${studentId}`),
        fetch(`${API_URL}/sessions/student/${studentId}`)
      ]);

      if (!requestResponse.ok || !sessionResponse.ok) {
        throw new Error("Failed to load requests or sessions.");
      }

      const requestData = await requestResponse.json();
      const sessionData = await sessionResponse.json();

      setRequests(requestData.requests || []);
      setSessions(sessionData.sessions || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Request statistics
  const pending = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const accepted = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  const rejected = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  // Session statistics
  const upcomingSessions = sessions.filter(
    (session) => session.status === "upcoming"
  ).length;

  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  ).length;

  if (loading) {
    return <p className="junior-loading">Loading dashboard...</p>;
  }

  if (error) {
    return (
      <div className="junior-error">
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="junior-dashboard">

      {/* Dashboard Header */}
      <header className="junior-header">
        <div>
          <h1>Junior Dashboard</h1>
          <p>Welcome back, {student?.name || "Student"}!</p>
        </div>

        <button onClick={fetchDashboardData}>
          Refresh
        </button>
      </header>

      {/* Request Statistics */}
      <section className="junior-stats">

        <div className="junior-stat-card">
          <h3>Total Requests</h3>
          <p>{requests.length}</p>
        </div>

        <div className="junior-stat-card">
          <h3>Pending</h3>
          <p>{pending}</p>
        </div>

        <div className="junior-stat-card">
          <h3>Accepted</h3>
          <p>{accepted}</p>
        </div>

        <div className="junior-stat-card">
          <h3>Rejected</h3>
          <p>{rejected}</p>
        </div>

      </section>

      {/* Mentorship Requests */}
      <section className="junior-requests">
        <h2>My Mentorship Requests</h2>

        {requests.length === 0 ? (
          <p>You haven't sent any mentorship requests yet.</p>
        ) : (
          requests.map((request) => (
            <div
              className="junior-request-card"
              key={request._id || request.id}
            >

              <div className="junior-request-top">
                <h3>{request.mentorName}</h3>

                <span className={`request-status ${request.status}`}>
                  {request.status}
                </span>
              </div>

              <p>
                <strong>Your message:</strong> {request.message}
              </p>

              <p>
                <strong>Request ID:</strong> {request._id || request.id}
              </p>

              <p>
                <strong>Sent on:</strong>{" "}
                {request.createdAt
                  ? new Date(request.createdAt).toLocaleString()
                  : "Not available"}
              </p>

            </div>
          ))
        )}
      </section>

      {/* Mentorship Sessions */}
      <section className="junior-sessions">

        <div className="junior-sessions-heading">
          <h2>My Mentorship Sessions</h2>
          <p>View your scheduled sessions with mentors.</p>
        </div>

        {/* Session Statistics */}
        <div className="junior-stats">

          <div className="junior-stat-card">
            <h3>Total Sessions</h3>
            <p>{sessions.length}</p>
          </div>

          <div className="junior-stat-card">
            <h3>Upcoming</h3>
            <p>{upcomingSessions}</p>
          </div>

          <div className="junior-stat-card">
            <h3>Completed</h3>
            <p>{completedSessions}</p>
          </div>

        </div>

        {/* Session Cards */}
        {sessions.length === 0 ? (
          <p>No mentorship sessions scheduled yet.</p>
        ) : (
          sessions.map((session) => (
            <article
              className="junior-session-card"
              key={session._id || session.id}
            >

              <div className="junior-session-top">
                <h3>{session.mentorName}</h3>

                <span className={`session-status ${session.status}`}>
                  {session.status}
                </span>
              </div>

              <p>
                <strong>Session Date:</strong> {session.date}
              </p>

              <p>
                <strong>Session Time:</strong> {session.time}
              </p>

              <p>
                <strong>Session ID:</strong> {session._id || session.id}
              </p>

              {session.status !== "completed" && session.meetingLink && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="meeting-link"
                >
                  Join Meeting
                </a>
              )}

              {session.status === "completed" && (
                <p>Session completed successfully.</p>
              )}

            </article>
          ))
        )}

      </section>

    </div>
  );
}

export default JuniorDashboard;
