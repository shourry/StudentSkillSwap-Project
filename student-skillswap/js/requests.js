/**
 * Student SkillSwap - Learning Request Module (Module 6)
 * Handles request lifecycle: Pending -> Accepted / Declined -> Completed.
 * Manages Sent Requests, Received Requests, and transitions to Chat & Scheduling.
 */

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  await Auth.initNavbar("requests");
  Auth.initFooter();

  loadRequests();

  // Listen for real-time updates
  window.addEventListener("skillswap:datachange", () => {
    loadRequests();
  });
});

async function loadRequests() {
  const allRequests = await DB.getAll("requests");

  const received = allRequests
    .filter((r) => r.receiverId === currentUser.uid)
    .sort((a, b) => b.createdAt - a.createdAt);

  const sent = allRequests
    .filter((r) => r.senderId === currentUser.uid)
    .sort((a, b) => b.createdAt - a.createdAt);

  // Update badge counters in tabs
  const recBadge = document.getElementById("received-badge");
  const sentBadge = document.getElementById("sent-badge");
  if (recBadge) recBadge.textContent = received.length;
  if (sentBadge) sentBadge.textContent = sent.length;

  renderReceivedList(received);
  renderSentList(sent);
}

function renderReceivedList(requests) {
  const container = document.getElementById("received-requests-list");
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="card p-5 text-center text-muted border-0 bg-light">
        <div class="fs-1 mb-2">📥</div>
        <h5>No received requests</h5>
        <p class="small mb-0">When other BIST students request to learn your skills, they will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <div class="card p-3 mb-3 border shadow-sm">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h5 class="mb-0 fw-bold text-dark">
              <a href="view-profile.html?uid=${r.senderId}" class="text-decoration-none text-dark hover-primary">
                ${SkillSwapUtils.escapeHtml(r.senderName)}
              </a>
            </h5>
            <span class="badge ${r.preferredMode === "Online" ? "bg-info text-dark" : "bg-warning text-dark"}">
              ${r.preferredMode}
            </span>
          </div>
          <div class="text-muted small">
            Skill Requested: <strong class="text-primary fs-6">${SkillSwapUtils.escapeHtml(r.skillName)}</strong> · 
            <span>${SkillSwapUtils.formatDate(r.createdAt)}</span>
          </div>
        </div>
        <div>
          ${SkillSwapUtils.renderBadge(r.status)}
        </div>
      </div>

      <div class="bg-light p-3 rounded mb-3">
        <div class="small fw-semibold text-secondary mb-1">Message from student:</div>
        <p class="mb-0 text-dark small">"${SkillSwapUtils.escapeHtml(r.message)}"</p>
      </div>

      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <div>
          <a href="view-profile.html?uid=${r.senderId}" class="btn btn-sm btn-outline-secondary">
            View Student Profile
          </a>
        </div>
        <div class="d-flex gap-2">
          ${
            r.status === "pending"
              ? `
              <button class="btn btn-sm btn-outline-danger" onclick="updateRequestStatus('${r.requestId}', 'declined')">
                Decline
              </button>
              <button class="btn btn-sm btn-success" onclick="updateRequestStatus('${r.requestId}', 'accepted')">
                Accept Request
              </button>
            `
              : ""
          }

          ${
            r.status === "accepted"
              ? `
              <a href="chat.html?reqId=${r.requestId}" class="btn btn-sm btn-outline-primary">
                💬 Open Chat
              </a>
              <a href="schedule.html?reqId=${r.requestId}" class="btn btn-sm btn-primary">
                📅 Schedule Session
              </a>
            `
              : ""
          }

          ${
            r.status === "completed"
              ? `
              <a href="chat.html?reqId=${r.requestId}" class="btn btn-sm btn-outline-secondary">
                Chat History
              </a>
              <span class="badge bg-success-subtle text-success p-2">Session Completed</span>
            `
              : ""
          }
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function renderSentList(requests) {
  const container = document.getElementById("sent-requests-list");
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="card p-5 text-center text-muted border-0 bg-light">
        <div class="fs-1 mb-2">📤</div>
        <h5>No sent requests</h5>
        <p class="small mb-3">You haven't requested any peer mentors yet.</p>
        <div>
          <a href="search.html" class="btn btn-primary btn-sm">Find Skills to Learn</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <div class="card p-3 mb-3 border shadow-sm">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h5 class="mb-0 fw-bold text-dark">
              To: <a href="view-profile.html?uid=${r.receiverId}" class="text-decoration-none text-dark hover-primary">
                ${SkillSwapUtils.escapeHtml(r.receiverName)}
              </a>
            </h5>
            <span class="badge ${r.preferredMode === "Online" ? "bg-info text-dark" : "bg-warning text-dark"}">
              ${r.preferredMode}
            </span>
          </div>
          <div class="text-muted small">
            Skill: <strong class="text-primary fs-6">${SkillSwapUtils.escapeHtml(r.skillName)}</strong> · 
            <span>Sent on ${SkillSwapUtils.formatDate(r.createdAt)}</span>
          </div>
        </div>
        <div>
          ${SkillSwapUtils.renderBadge(r.status)}
        </div>
      </div>

      <div class="bg-light p-3 rounded mb-3">
        <div class="small fw-semibold text-secondary mb-1">Your message:</div>
        <p class="mb-0 text-dark small">"${SkillSwapUtils.escapeHtml(r.message)}"</p>
      </div>

      <div class="d-flex justify-content-between align-items-center">
        <div>
          <a href="view-profile.html?uid=${r.receiverId}" class="btn btn-sm btn-outline-secondary">
            View Mentor Profile
          </a>
        </div>
        <div class="d-flex gap-2">
          ${
            r.status === "accepted"
              ? `
              <a href="chat.html?reqId=${r.requestId}" class="btn btn-sm btn-outline-primary">
                💬 Open Chat
              </a>
              <a href="schedule.html?reqId=${r.requestId}" class="btn btn-sm btn-primary">
                📅 Schedule Session
              </a>
            `
              : ""
          }
          ${
            r.status === "pending"
              ? `<span class="text-muted small align-self-center">Waiting for mentor response...</span>`
              : ""
          }
          ${
            r.status === "declined"
              ? `<a href="search.html?q=${encodeURIComponent(r.skillName)}" class="btn btn-sm btn-outline-primary">
                   Find Another Mentor
                 </a>`
              : ""
          }
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

window.updateRequestStatus = async (requestId, status) => {
  await DB.update("requests", "requestId", requestId, { status });
  SkillSwapUtils.showToast(
    status === "accepted"
      ? "Request accepted! You can now chat and schedule a session."
      : "Request declined.",
    status === "accepted" ? "success" : "info"
  );
  loadRequests();
};
