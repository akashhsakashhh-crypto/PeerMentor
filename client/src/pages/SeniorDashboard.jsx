
import { useEffect, useState } from "react";
import "./SeniorDashboard.css";

function SeniorDashboard({ user }) {
  const token = localStorage.getItem("token");

  // Request states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile states
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Profile form
  const [formData, setFormData] = useState({
    company: "",
    jobRole: "",
    experience: "",
    skills: "",
    availability: "",
    bio: ""
  });

  // Session states
  const [sessions, setSessions] = useState([]);
  const [activeScheduleRequestId, setActiveScheduleRequestId] =
    useState(null);

  const [sessionForm, setSessionForm] = useState({
    date: "",
    time: "",
    meetingLink: ""
  });

  const [sessionError, setSessionError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");

  // =====================================
  // 1. FETCH LOGGED-IN MENTOR PROFILE
  // =====================================

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      if (!token) {
        throw new Error("Login token not found. Please login again.");
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setProfile(data.user);

      setFormData({
        company: data.user.company || "",
        jobRole: data.user.jobRole || "",
        experience: data.user.experience ?? "",
        skills: (data.user.skills || []).join(", "),
        availability: (data.user.availability || []).join(", "),
        bio: data.user.bio || ""
      });

      return data.user;

    } catch (err) {
      setProfileError(err.message);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // =====================================
  // 2. FETCH MENTOR REQUESTS
  // =====================================

  const fetchRequests = async (mentorId) => {
    try {
      setLoading(true);
      setError("");

      if (!mentorId) {
        throw new Error("Mentor ID not found.");
      }

      const response = await fetch(
        `http://localhost:5000/api/requests/mentor/${mentorId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch requests");
      }

      setRequests(data.requests || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // 3. FETCH MENTOR SESSIONS
  // =====================================

  const fetchSessions = async (mentorId) => {
    try {
      setSessionError("");

      if (!mentorId) {
        setSessions([]);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/sessions/mentor/${mentorId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sessions");
      }

      setSessions(data.sessions || []);

    } catch (err) {
      setSessionError(err.message);
    }
  };

  // =====================================
  // 4. LOAD DASHBOARD
  // =====================================

  useEffect(() => {
    const loadDashboard = async () => {
      const mentorProfile = await fetchProfile();

      if (mentorProfile?._id) {
        await fetchRequests(mentorProfile._id);
        await fetchSessions(mentorProfile._id);
      } else {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =====================================
  // 5. HANDLE PROFILE INPUT CHANGES
  // =====================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  // =====================================
  // 6. SAVE MENTOR PROFILE
  // =====================================

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setProfileError("");
      setSuccessMessage("");

      const updatedProfile = {
        company: formData.company.trim(),
        jobRole: formData.jobRole.trim(),
        experience: Number(formData.experience),
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        availability: formData.availability
          .split(",")
          .map((slot) => slot.trim())
          .filter(Boolean),
        bio: formData.bio.trim()
      };

      const response = await fetch(
        "http://localhost:5000/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedProfile)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update profile"
        );
      }

      setProfile(data.user);
      setEditing(false);
      setSuccessMessage("Profile updated successfully!");

      setFormData({
        company: data.user.company || "",
        jobRole: data.user.jobRole || "",
        experience: data.user.experience ?? "",
        skills: (data.user.skills || []).join(", "),
        availability: (data.user.availability || []).join(", "),
        bio: data.user.bio || ""
      });

    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // 7. ACCEPT OR REJECT REQUEST
  // =====================================

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update request"
        );
      }

      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === requestId ? data.request : request
        )
      );

    } catch (err) {
      alert(err.message);
    }
  };

  // =====================================
  // 8. SCHEDULE A SESSION
  // =====================================

  const scheduleSession = async (event) => {
    event.preventDefault();

    try {
      setSessionError("");
      setSessionMessage("");

      const response = await fetch(
        "http://localhost:5000/api/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: activeScheduleRequestId,
            date: sessionForm.date,
            time: sessionForm.time,
            meetingLink: sessionForm.meetingLink.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not schedule session"
        );
      }

      setSessionMessage("Session scheduled successfully!");

      setSessionForm({
        date: "",
        time: "",
        meetingLink: ""
      });

      setActiveScheduleRequestId(null);

      await fetchSessions(profile?._id);

    } catch (err) {
      setSessionError(err.message);
    }
  };

  // =====================================
  // 9. MARK SESSION AS COMPLETED
  // =====================================

  const completeSession = async (sessionId) => {
    try {
      setSessionError("");
      setSessionMessage("");

      const response = await fetch(
        `http://localhost:5000/api/sessions/${sessionId}/complete`,
        {
          method: "PATCH"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not complete session"
        );
      }

      setSessionMessage("Session marked as completed!");

      await fetchSessions(profile?._id);

    } catch (err) {
      setSessionError(err.message);
    }
  };

  // =====================================
  // 10. DASHBOARD STATISTICS
  // =====================================

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  const rejectedRequests = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  // =====================================
  // 11. DASHBOARD UI
  // =====================================

  const displayName = profile?.name || user?.name || "Mentor";

  return (
    <div className="senior-dashboard">

      {/* Dashboard Header */}

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">PEERMENTOR</p>
          <h1>Senior Dashboard</h1>
          <p>Welcome back, {displayName}!</p>
        </div>

        <div className="mentor-avatar">
          {displayName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </header>

      {/* Mentor Profile */}

      <section className="mentor-info">

        {profileLoading ? (
          <p>Loading mentor profile...</p>
        ) : profileError && !profile ? (
          <p className="error-message">{profileError}</p>
        ) : profile && (
          <>
            <div className="profile-heading">
              <div>
                <h2>{profile.name}</h2>
                <p>
                  {profile.company} · {profile.jobRole || "Senior Mentor"}
                </p>
              </div>

              {!editing && (
                <button
                  className="edit-profile-button"
                  onClick={() => {
                    setSuccessMessage("");
                    setProfileError("");
                    setEditing(true);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {!editing ? (
              <div className="profile-details">

                <p>
                  <strong>Experience:</strong>{" "}
                  {profile.experience ?? "Not added"}
                  {profile.experience !== undefined ? " years" : ""}
                </p>

                <p>
                  <strong>Skills:</strong>{" "}
                  {(profile.skills || []).join(", ")}
                </p>

                <p>
                  <strong>Availability:</strong>{" "}
                  {(profile.availability || []).join(", ")}
                </p>

                <p>
                  <strong>About:</strong> {profile.bio}
                </p>

              </div>
            ) : (

              <form
                className="profile-form"
                onSubmit={saveProfile}
              >

                <div className="profile-form-grid">

                  <div className="profile-field">
                    <label>Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>Job Role</label>
                    <input
                      type="text"
                      name="jobRole"
                      value={formData.jobRole}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      name="experience"
                      min="0"
                      step="0.5"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>Technical Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="DSA, Java, Python, React"
                      required
                    />
                    <small>Separate skills using commas.</small>
                  </div>

                  <div className="profile-field full-width">
                    <label>Availability</label>
                    <input
                      type="text"
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      placeholder="Monday 6-8 PM, Saturday 10-12 AM"
                      required
                    />
                    <small>Separate time slots using commas.</small>
                  </div>

                  <div className="profile-field full-width">
                    <label>About Me</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      required
                    />
                  </div>

                </div>

                <div className="profile-form-actions">

                  <button
                    type="submit"
                    className="save-profile-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>

                  <button
                    type="button"
                    className="cancel-profile-button"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setProfileError("");

                      setFormData({
                        company: profile.company || "",
                        jobRole: profile.jobRole || "",
                        experience: profile.experience ?? "",
                        skills: (profile.skills || []).join(", "),
                        availability: (profile.availability || []).join(", "),
                        bio: profile.bio || ""
                      });
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>
            )}
          </>
        )}

        {profileError && profile && (
          <p className="error-message">{profileError}</p>
        )}

        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}

      </section>

      {/* Dashboard Statistics */}

      <section className="stats-container">

        <div className="stat-card">
          <h3>{totalRequests}</h3>
          <p>Total Requests</p>
        </div>

        <div className="stat-card pending-stat">
          <h3>{pendingRequests}</h3>
          <p>Pending</p>
        </div>

        <div className="stat-card accepted-stat">
          <h3>{acceptedRequests}</h3>
          <p>Accepted</p>
        </div>

        <div className="stat-card rejected-stat">
          <h3>{rejectedRequests}</h3>
          <p>Rejected</p>
        </div>

      </section>

      {/* Incoming Requests */}

      <section className="requests-section">

        <div className="requests-heading">
          <div>
            <h2>Incoming Requests</h2>
            <p>Manage your mentorship requests.</p>
          </div>

          <button
            className="refresh-button"
            onClick={() => fetchRequests(profile?._id)}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading requests...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <p>No mentorship requests received yet.</p>
        )}

        {!loading && requests.map((request) => (
          <article className="request-card" key={request._id}>

            <div className="request-top">
              <div>
                <h3>{request.studentName}</h3>
                <p>Student ID: {request.studentId}</p>
              </div>

              <span className={`status-badge ${request.status}`}>
                {request.status}
              </span>
            </div>

            <div className="request-message">
              <strong>Message:</strong>
              <p>{request.message}</p>
            </div>

            <p className="request-date">
              Request #{request._id} ·{" "}
              {new Date(request.createdAt).toLocaleDateString()}
            </p>

            {request.status === "pending" && (
              <div className="request-actions">

                <button
                  className="accept-button"
                  onClick={() =>
                    updateRequestStatus(request._id, "accepted")
                  }
                >
                  Accept
                </button>

                <button
                  className="reject-button"
                  onClick={() =>
                    updateRequestStatus(request._id, "rejected")
                  }
                >
                  Reject
                </button>

              </div>
            )}

            {/* Schedule Session */}

            {request.status === "accepted" && (
              <div className="session-scheduling">

                {sessions.some(
                  (session) =>
                    String(session.requestId) === String(request._id)
                ) ? (
                  <p className="session-scheduled-label">
                    Session already scheduled
                  </p>
                ) : (
                  <>
                    {activeScheduleRequestId !== request._id ? (
                      <button
                        className="schedule-session-button"
                        onClick={() => {
                          setActiveScheduleRequestId(request._id);
                          setSessionError("");
                          setSessionMessage("");
                        }}
                      >
                        Schedule Session
                      </button>
                    ) : (
                      <form
                        className="session-form"
                        onSubmit={scheduleSession}
                      >
                        <h3>Schedule Session</h3>

                        <label>Session Date</label>
                        <input
                          type="date"
                          value={sessionForm.date}
                          min={new Date().toLocaleDateString("en-CA")}
                          onChange={(event) =>
                            setSessionForm({
                              ...sessionForm,
                              date: event.target.value
                            })
                          }
                          required
                        />

                        <label>Session Time</label>
                        <input
                          type="time"
                          value={sessionForm.time}
                          onChange={(event) =>
                            setSessionForm({
                              ...sessionForm,
                              time: event.target.value
                            })
                          }
                          required
                        />

                        <label>Google Meet Link</label>
                        <input
                          type="url"
                          placeholder="https://meet.google.com/..."
                          value={sessionForm.meetingLink}
                          onChange={(event) =>
                            setSessionForm({
                              ...sessionForm,
                              meetingLink: event.target.value
                            })
                          }
                          required
                        />

                        <button type="submit">
                          Confirm Session
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveScheduleRequestId(null);
                            setSessionError("");
                          }}
                        >
                          Cancel
                        </button>

                      </form>
                    )}
                  </>
                )}

              </div>
            )}

          </article>
        ))}

      </section>

      {/* Scheduled Sessions */}

      <section className="sessions-section">

        <h2>Scheduled Sessions</h2>

        {sessionError && (
          <p className="error-message">{sessionError}</p>
        )}

        {sessionMessage && (
          <p className="success-message">{sessionMessage}</p>
        )}

        {sessions.length === 0 ? (
          <p>No sessions scheduled yet.</p>
        ) : (
          sessions.map((session) => (
            <article className="session-card" key={session._id}>

              <h3>{session.studentName}</h3>

              <p>
                <strong>Date:</strong> {session.date}
              </p>

              <p>
                <strong>Time:</strong> {session.time}
              </p>

              <p>
                <strong>Status:</strong> {session.status}
              </p>

              <a
                href={session.meetingLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Meeting Link
              </a>

              {session.status !== "completed" && (
                <button
                  className="complete-session-button"
                  onClick={() => completeSession(session._id)}
                >
                  Mark as Completed
                </button>
              )}

            </article>
          ))
        )}

      </section>

    </div>
  );
}

export default SeniorDashboard;
