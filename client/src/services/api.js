
const BASE_URL = "http://localhost:5000/api";

// Get mentors
export async function getMentors(skill) {
  const url = skill
    ? `${BASE_URL}/mentors?skill=${encodeURIComponent(skill)}`
    : `${BASE_URL}/mentors`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch mentors");
  }

  return response.json();
}

// Match mentors
export async function matchMentors(skills, days) {
  const response = await fetch(`${BASE_URL}/mentors/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ skills, days })
  });

  if (!response.ok) {
    throw new Error("Matching failed");
  }

  return response.json();
}

// Create mentorship request
export async function createRequest(requestData) {
  const response = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send request");
  }

  return data;
}

// Register user
export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

// Login user
export async function loginUser(loginData) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}
