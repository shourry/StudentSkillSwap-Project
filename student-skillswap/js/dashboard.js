/**
 * Student SkillSwap - Dashboard Controller
 * Loads metrics, pending requests, scheduled sessions, and user activity.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = await Auth.requireAuth();
  if (!user) return;

  await Auth.initNavbar("dashboard");
  Auth.initFooter();

  await loadDashboardData(user);

  // Listen for real-time changes
  window.addEventListener("skillswap:datachange", () => {
    loadDashboardData(user);
  });
});

async function loadDashboardData(currentUser) {
  // Fresh user profile fetch
  const user = (await DB.get("users", "uid", currentUser.uid)) || currentUser;

  // Set greeting and header
  const welcomeName = document.getElementById("welcome-name");
  if (welcomeName) welcomeName.textContent = user.name;

  const userMeta = document.getElementById("user-meta");
  if (userMeta) {
    userMeta.textContent = `${user.department} Department · ${user.year} (${user.semester}) · Enrollment: ${user.enrollment}`;
  }

  // Fetch collections
  const allSkills = await DB.getAll("skills");
  const myTeachSkills = allSkills.filter((s) => s.userId === user.uid && s.skillType === "teach");
  const myLearnSkills = allSkills.filter((s) => s.userId === user.uid && s.skillType === "learn");

  const allRequests = await DB.getAll("requests");
  const receivedPending = allRequests.filter(
    (r) => r.receiverId === user.uid && r.status === "pending"
  );

  const allSessions = await DB.getAll("sessions");
  const mySessions = allSessions.filter(
    (s) => (s.providerId === user.uid || s.seekerId === user.uid) && s.status === "scheduled"
  );

  // Update counters
  const teachCountEl = document.getElementById("stat-teach-count");
  if (teachCountEl) teachCountEl.textContent = myTeachSkills.length;

  const learnCountEl = document.getElementById("stat-learn-count");
  if (learnCountEl) learnCountEl.textContent = myLearnSkills.length;

  const pendingCountEl = document.getElementById("stat-pending-count");
  if (pendingCountEl) pendingCountEl.textContent = receivedPending.length;

  const sessionsCountEl = document.getElementById("stat-sessions-count");
  if (sessionsCountEl) sessionsCountEl.textContent = mySessions.length;

  const userRatingEl = document.getElementById("stat-user-rating");
  if (userRatingEl) {
    userRatingEl.innerHTML = SkillSwapUtils.renderStars(user.averageRating, user.totalRatings);
  }

  // Render Upcoming Sessions
  renderUpcomingSessions(mySessions, user);

  // Render Pending Requests widget
  renderPendingRequestsWidget(receivedPending, user);

  // Render My Active Skills summary
  renderSkillsSummary(myTeachSkills, myLearnSkills);
}

function renderUpcomingSessions(sessions, currentUser) {
  const container = document.getElementById("upcoming-sessions-container");
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <div class="fs-1 mb-2">📅</div>
        <p class="mb-1 fw-medium">No upcoming sessions scheduled.</p>
        <small>Accept a learning request or schedule a session with a mentor!</small>
        <div class="mt-3">
          <a href="search.html" class="btn btn-outline-primary btn-sm">Find a Mentor</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = sessions
    .map((s) => {
      const isProvider = s.providerId === currentUser.uid;
      const peerName = isProvider ? s.seekerName : s.providerName;
      const roleBadge = isProvider
        ? '<span class="badge badge-teach">You are Teaching</span>'
        : '<span class="badge badge-learn">You are Learning</span>';

      return `
      <div class="card mb-3 border-0 bg-light p-3">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h6 class="mb-0 fw-bold text-dark">${SkillSwapUtils.escapeHtml(s.skillName)}</h6>
              ${roleBadge}
              <span class="badge ${s.mode === "Online" ? "bg-info text-dark" : "bg-warning text-dark"}">${s.mode}</span>
            </div>
            <div class="small text-muted">
              <span>👤 With <strong>${SkillSwapUtils.escapeHtml(peerName)}</strong></span> · 
              <span>🗓️ ${SkillSwapUtils.formatDate(s.date)} at ${s.time} (${s.duration})</span>
            </div>
            <div class="small text-muted mt-1">
              📍 <strong>Location / Link:</strong> ${
                s.location.startsWith("http")
                  ? `<a href="${s.location}" target="_blank" class="text-primary">${s.location}</a>`
                  : SkillSwapUtils.escapeHtml(s.location)
              }
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 mt-2 mt-md-0">
            <a href="chat.html?reqId=${s.requestId}" class="btn btn-sm btn-outline-primary">💬 Chat</a>
            <button class="btn btn-sm btn-success" onclick="completeSession('${s.sessionId}')">✓ Mark Done</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderPendingRequestsWidget(requests, currentUser) {
  const container = document.getElementById("pending-requests-container");
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <div class="fs-1 mb-2">📬</div>
        <p class="mb-0">No pending requests waiting for your approval.</p>
        <small>When other BIST students want to learn from you, their requests will appear here.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <div class="card mb-2 border p-3">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div class="fw-bold">${SkillSwapUtils.escapeHtml(r.senderName)}</div>
          <div class="small text-muted">Wants to learn <strong>${SkillSwapUtils.escapeHtml(r.skillName)}</strong> (${r.preferredMode})</div>
        </div>
        <span class="badge badge-status-pending">Pending</span>
      </div>
      <p class="small text-secondary bg-light p-2 rounded mb-2">"${SkillSwapUtils.escapeHtml(r.message)}"</p>
      <div class="d-flex gap-2 justify-content-end">
        <button class="btn btn-sm btn-outline-danger" onclick="respondRequest('${r.requestId}', 'declined')">Decline</button>
        <button class="btn btn-sm btn-success" onclick="respondRequest('${r.requestId}', 'accepted')">Accept Request</button>
      </div>
    </div>
  `
    )
    .join("");
}

function renderSkillsSummary(teachSkills, learnSkills) {
  const teachContainer = document.getElementById("dashboard-teach-skills");
  const learnContainer = document.getElementById("dashboard-learn-skills");

  if (teachContainer) {
    if (teachSkills.length === 0) {
      teachContainer.innerHTML = '<span class="text-muted small">No teaching skills added yet.</span>';
    } else {
      teachContainer.innerHTML = teachSkills
        .map(
          (s) =>
            `<span class="badge bg-primary-subtle text-primary border me-1 mb-1 p-2">${SkillSwapUtils.escapeHtml(s.skillName)} <small class="text-muted">(${s.skillLevel})</small></span>`
        )
        .join("");
    }
  }

  if (learnContainer) {
    if (learnSkills.length === 0) {
      learnContainer.innerHTML = '<span class="text-muted small">No learning skills added yet.</span>';
    } else {
      learnContainer.innerHTML = learnSkills
        .map(
          (s) =>
            `<span class="badge bg-warning-subtle text-warning-emphasis border me-1 mb-1 p-2">${SkillSwapUtils.escapeHtml(s.skillName)} <small class="text-muted">(${s.skillLevel})</small></span>`
        )
        .join("");
    }
  }
}

// Global action handlers
window.completeSession = async (sessionId) => {
  if (!confirm("Are you sure you want to mark this learning session as completed?")) return;
  const session = await DB.get("sessions", "sessionId", sessionId);
  if (!session) return;

  await DB.update("sessions", "sessionId", sessionId, { status: "completed" });
  if (session.requestId) {
    await DB.update("requests", "requestId", session.requestId, { status: "completed" });
  }

  SkillSwapUtils.showToast("Session completed! Opening feedback rating form...", "success");
  setTimeout(() => {
    window.location.href = `feedback.html?sessionId=${sessionId}`;
  }, 1000);
};

window.respondRequest = async (requestId, newStatus) => {
  await DB.update("requests", "requestId", requestId, { status: newStatus });
  SkillSwapUtils.showToast(
    newStatus === "accepted" ? "Request accepted! You can now chat and schedule a session." : "Request declined.",
    newStatus === "accepted" ? "success" : "info"
  );
};
