
function getDays(availability = []) {
  return availability.map((item) =>
    item.trim().split(/\s+/)[0].toLowerCase()
  );
}

function scoreMentor(mentor, needs) {
  const wanted = (needs.skills || []).map((skill) =>
    skill.trim().toLowerCase()
  );

  const mentorSkills = (mentor.skills || []).map((skill) =>
    skill.trim().toLowerCase()
  );

  const commonSkills = (needs.skills || []).filter((skill) =>
    mentorSkills.includes(skill.trim().toLowerCase())
  );

  const skillScore = wanted.length
    ? commonSkills.length / wanted.length
    : 0;

  const mentorDays = getDays(mentor.availability);

  const commonDays = (needs.days || []).filter((day) =>
    mentorDays.includes(day.trim().toLowerCase())
  );

  const availScore = commonDays.length > 0 ? 1 : 0;

  // Check whether a valid rating exists
  const hasRating =
    mentor.rating !== undefined &&
    mentor.rating !== null &&
    Number.isFinite(Number(mentor.rating));

  const ratingScore = hasRating
    ? Number(mentor.rating) / 5
    : 0;

  // Exclude rating from the calculation if it is unavailable
  let totalScore = skillScore * 50 + availScore * 30;
  let totalWeight = 80;

  if (hasRating) {
    totalScore += ratingScore * 20;
    totalWeight += 20;
  }

  const percent = totalWeight > 0
    ? Math.round((totalScore / totalWeight) * 100)
    : 0;

  const reasons = [];

  if (commonSkills.length) {
    reasons.push(`Covers ${commonSkills.join(", ")}`);
  } else {
    reasons.push("No skill overlap");
  }

  if (commonDays.length) {
    reasons.push(`Free on ${commonDays.join(", ")}`);
  } else {
    reasons.push("No common day available");
  }

  if (hasRating) {
    reasons.push(`Rated ${mentor.rating}/5`);
  } else {
    reasons.push("Rating not available");
  }

  return {
    ...mentor,
    matchPercent: percent,
    reasons
  };
}

function matchMentors(mentors, needs) {
  return mentors
    .map((mentor) => scoreMentor(mentor, needs))
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

module.exports = { matchMentors };
