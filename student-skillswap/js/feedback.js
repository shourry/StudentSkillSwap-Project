/**
 * Student SkillSwap - Rating & Feedback Module (Module 9)
 * Handles star ratings (1-5), peer reviews, and automated profile rating calculations.
 */

let currentUser = null;
let currentSession = null;
let ratedPeer = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  await Auth.initNavbar();
  Auth.initFooter();

  await loadFeedbackSession();
  setupFeedbackForm();
});

async function loadFeedbackSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("sessionId");

  if (!sessionId) {
    SkillSwapUtils.showToast("No session specified for feedback.", "warning");
    setTimeout(() => {
      window.location.href = "schedule.html";
    }, 1500);
    return;
  }

  currentSession = await DB.get("sessions", "sessionId", sessionId);
  if (!currentSession) {
    SkillSwapUtils.showToast("Session not found.", "danger");
    setTimeout(() => {
      window.location.href = "schedule.html";
    }, 1500);
    return;
  }

  // Determine who is being rated
  const isCurrentUserProvider = currentSession.providerId === currentUser.uid;
  const ratedUserId = isCurrentUserProvider ? currentSession.seekerId : currentSession.providerId;

  ratedPeer = await DB.get("users", "uid", ratedUserId);
  if (!ratedPeer) {
    SkillSwapUtils.showToast("Peer user record not found.", "danger");
    return;
  }

  // Check if current user already submitted a rating for this session
  const existingRating = await DB.query(
    "ratings",
    (r) => r.sessionId === sessionId && r.raterId === currentUser.uid
  );

  if (existingRating.length > 0) {
    const r = existingRating[0];
    document.getElementById("feedback-form-container").innerHTML = `
      <div class="card p-4 text-center">
        <div class="fs-1 text-success mb-2">✓</div>
        <h4>You already submitted feedback for this session!</h4>
        <div class="my-3">
          <div class="fs-3 text-warning">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
          <p class="text-muted fst-italic">"${SkillSwapUtils.escapeHtml(r.review || "No written review.")}"</p>
        </div>
        <div>
          <a href="schedule.html" class="btn btn-primary">Return to Sessions</a>
        </div>
      </div>
    `;
    return;
  }

  // Populate session & peer details on the UI
  document.getElementById("peer-name").textContent = ratedPeer.name;
  document.getElementById("peer-role").textContent = isCurrentUserProvider
    ? "Peer Learner"
    : "Skill Mentor";
  document.getElementById("session-skill").textContent = currentSession.skillName;
  document.getElementById("session-date-time").textContent = `${SkillSwapUtils.formatDate(
    currentSession.date
  )} at ${currentSession.time} (${currentSession.mode})`;

  const avatarContainer = document.getElementById("peer-avatar-container");
  if (avatarContainer) {
    avatarContainer.innerHTML = ratedPeer.profilePhoto
      ? `<img src="${ratedPeer.profilePhoto}" alt="${ratedPeer.name}" class="rounded-circle" style="width: 70px; height: 70px; object-fit: cover;">`
      : `<div class="avatar avatar-lg">${ratedPeer.name[0]}</div>`;
  }
}

function setupFeedbackForm() {
  const form = document.getElementById("feedback-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentSession || !ratedPeer) return;

    const stars = Number(form.stars.value || 5);
    const review = form.review.value.trim();

    // Create rating record
    await DB.add(
      "ratings",
      {
        sessionId: currentSession.sessionId,
        skillName: currentSession.skillName,
        raterId: currentUser.uid,
        raterName: currentUser.name,
        ratedUserId: ratedPeer.uid,
        stars,
        review
      },
      "ratingId"
    );

    // Recalculate and update the peer's average rating in their profile
    await DB.updateUserRating(ratedPeer.uid);

    SkillSwapUtils.showToast("Thank you for your rating & review!", "success");
    setTimeout(() => {
      window.location.href = "schedule.html";
    }, 1200);
  });
}
