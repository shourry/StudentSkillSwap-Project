/**
 * Student SkillSwap - Session Scheduling Module (Module 7)
 * Manages scheduling, displaying upcoming/completed peer sessions,
 * marking sessions completed, and routing to feedback ratings.
 */

let currentUser = null;
let acceptedRequests = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  await Auth.initNavbar("schedule");
  Auth.initFooter();

  await loadSchedulingForm();
  await loadSessions();

  setupSessionFormListeners();

  // Listen for real-time changes
  window.addEventListener("skillswap:datachange", () => {
    loadSessions();
  });
});

async function loadSchedulingForm() {
  const reqSelect = document.getElementById("request-select");
  if (!reqSelect) return;

  // Find accepted requests involving current user
  const allRequests = await DB.getAll("requests");
  acceptedRequests = allRequests.filter(
    (r) =>
      (r.senderId === currentUser.uid || r.receiverId === currentUser.uid) &&
      r.status === "accepted"
  );

  // Check if a specific request was passed in query params
  const urlParams = new URLSearchParams(window.location.search);
  const targetReqId = urlParams.get("reqId");

  if (acceptedRequests.length === 0) {
    reqSelect.innerHTML = `<option value="">No accepted requests available to schedule</option>`;
    reqSelect.disabled = true;
    const submitBtn = document.getElementById("schedule-submit-btn");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  reqSelect.disabled = false;
  reqSelect.innerHTML = acceptedRequests
    .map((r) => {
      const isSender = r.senderId === currentUser.uid;
      const peerName = isSender ? r.receiverName : r.senderName;
      const selected = r.requestId === targetReqId ? "selected" : "";
      return `<option value="${r.requestId}" ${selected}>
        ${SkillSwapUtils.escapeHtml(r.skillName)} with ${SkillSwapUtils.escapeHtml(peerName)} (${r.preferredMode})
      </option>`;
    })
    .join("");

  // Default date to tomorrow
  const dateInput = document.getElementById("session-date");
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
    dateInput.value = tomorrow.toISOString().split("T")[0];
  }
}

async function loadSessions() {
  const allSessions = await DB.getAll("sessions");
  const allRatings = await DB.getAll("ratings");

  const mySessions = allSessions.filter(
    (s) => s.providerId === currentUser.uid || s.seekerId === currentUser.uid
  );

  const upcoming = mySessions
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const past = mySessions
    .filter((s) => s.status === "completed" || s.status === "cancelled")
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  renderUpcomingList(upcoming);
  renderPastList(past, allRatings);
}

function renderUpcomingList(sessions) {
  const container = document.getElementById("upcoming-sessions-list");
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="card p-4 text-center text-muted border-0 bg-light">
        <div class="fs-1 mb-2">📅</div>
        <h6>No scheduled upcoming sessions</h6>
        <p class="small mb-0">Use the form to schedule a learning session with an accepted student match.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sessions
    .map((s) => {
      const isProvider = s.providerId === currentUser.uid;
      const peerName = isProvider ? s.seekerName : s.providerName;
      const roleText = isProvider ? "Teaching" : "Learning";

      return `
      <div class="card mb-3 p-3 border shadow-sm">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-2">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h5 class="mb-0 fw-bold text-dark">${SkillSwapUtils.escapeHtml(s.skillName)}</h5>
              <span class="badge ${isProvider ? "badge-teach" : "badge-learn"}">${roleText}</span>
              <span class="badge ${s.mode === "Online" ? "bg-info text-dark" : "bg-warning text-dark"}">${s.mode}</span>
            </div>
            <div class="text-muted small">
              With <strong>${SkillSwapUtils.escapeHtml(peerName)}</strong> · 
              🗓️ <strong>${SkillSwapUtils.formatDate(s.date)}</strong> at <strong>${s.time}</strong> (${s.duration})
            </div>
          </div>
          <div>
            ${SkillSwapUtils.renderBadge(s.status)}
          </div>
        </div>

        <div class="bg-light p-2 rounded mb-3 small">
          📍 <strong>Location / Meeting Link:</strong> 
          ${
            s.location.startsWith("http")
              ? `<a href="${s.location}" target="_blank" class="text-primary text-break ms-1">${s.location}</a>`
              : `<span class="text-dark ms-1">${SkillSwapUtils.escapeHtml(s.location)}</span>`
          }
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <a href="chat.html?reqId=${s.requestId}" class="btn btn-sm btn-outline-primary">
            💬 Message Peer
          </a>
          <button class="btn btn-sm btn-success" onclick="markSessionDone('${s.sessionId}')">
            ✓ Mark as Completed
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderPastList(sessions, allRatings) {
  const container = document.getElementById("past-sessions-list");
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="card p-3 text-center text-muted border-0 bg-light small">
        No completed session history yet.
      </div>
    `;
    return;
  }

  container.innerHTML = sessions
    .map((s) => {
      const isProvider = s.providerId === currentUser.uid;
      const peerName = isProvider ? s.seekerName : s.providerName;
      const peerId = isProvider ? s.seekerId : s.providerId;

      // Check if current user has already rated this session
      const existingRating = allRatings.find(
        (r) => r.sessionId === s.sessionId && r.raterId === currentUser.uid
      );

      return `
      <div class="card mb-2 p-3 border">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 fw-bold">${SkillSwapUtils.escapeHtml(s.skillName)} with ${SkillSwapUtils.escapeHtml(peerName)}</h6>
            <small class="text-muted">${SkillSwapUtils.formatDate(s.date)} · ${s.duration} · ${s.mode}</small>
          </div>
          <div>
            ${
              existingRating
                ? `<div class="text-success small fw-semibold">✓ Rated ${existingRating.stars}★</div>`
                : `<a href="feedback.html?sessionId=${s.sessionId}" class="btn btn-sm btn-warning">⭐ Rate Session</a>`
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function setupSessionFormListeners() {
  const form = document.getElementById("schedule-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reqId = form.requestId.value;
    if (!reqId) {
      SkillSwapUtils.showToast("Please choose an accepted learning request.", "danger");
      return;
    }

    const request = acceptedRequests.find((r) => r.requestId === reqId);
    if (!request) {
      SkillSwapUtils.showToast("Selected request not found.", "danger");
      return;
    }

    const isCurrentUserProvider = request.receiverId === currentUser.uid;
    const providerId = isCurrentUserProvider ? currentUser.uid : request.receiverId;
    const providerName = isCurrentUserProvider ? currentUser.name : request.receiverName;
    const seekerId = isCurrentUserProvider ? request.senderId : currentUser.uid;
    const seekerName = isCurrentUserProvider ? request.senderName : currentUser.name;

    const newSession = await DB.add(
      "sessions",
      {
        requestId: reqId,
        providerId,
        providerName,
        seekerId,
        seekerName,
        skillName: request.skillName,
        date: form.date.value,
        time: form.time.value,
        duration: form.duration.value,
        mode: form.mode.value,
        location: form.location.value.trim() || (form.mode.value === "Online" ? "Google Meet Link" : "Nursing Building Library Area"),
        status: "scheduled"
      },
      "sessionId"
    );

    // Also send an automated chat announcement
    await DB.add(
      "messages",
      {
        requestId: reqId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        text: `📅 Session Scheduled for ${SkillSwapUtils.formatDate(newSession.date)} at ${newSession.time} (${newSession.duration}, ${newSession.mode}) - Location: ${newSession.location}`
      },
      "messageId"
    );

    SkillSwapUtils.showToast("Learning session scheduled successfully!", "success");
    form.reset();
    await loadSchedulingForm();
    await loadSessions();
  });
}

window.markSessionDone = async (sessionId) => {
  if (!confirm("Confirm marking this session as completed?")) return;

  const session = await DB.get("sessions", "sessionId", sessionId);
  if (!session) return;

  await DB.update("sessions", "sessionId", sessionId, { status: "completed" });
  if (session.requestId) {
    await DB.update("requests", "requestId", session.requestId, { status: "completed" });
  }

  SkillSwapUtils.showToast("Session completed! Taking you to leave a rating...", "success");
  setTimeout(() => {
    window.location.href = `feedback.html?sessionId=${sessionId}`;
  }, 900);
};
