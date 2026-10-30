/**
 * Student SkillSwap - Chat & Communication Module (Module 8)
 * Real-time messaging between matched peer students.
 */

let currentUser = null;
let activeRequestId = null;
let chatRefreshInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  await Auth.initNavbar("chat");
  Auth.initFooter();

  await setupChatInterface();

  // Listen for storage events (allows multi-tab messaging simulation)
  window.addEventListener("storage", (e) => {
    if (activeRequestId && e.key && e.key.includes("messages")) {
      loadMessages(activeRequestId);
    }
  });

  window.addEventListener("skillswap:datachange", (e) => {
    if (e.detail?.collection === "messages" && activeRequestId) {
      loadMessages(activeRequestId);
    }
  });
});

async function setupChatInterface() {
  const allRequests = await DB.getAll("requests");

  // Only accepted or completed requests can chat
  const myConversations = allRequests.filter(
    (r) =>
      (r.senderId === currentUser.uid || r.receiverId === currentUser.uid) &&
      (r.status === "accepted" || r.status === "completed")
  );

  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get("reqId");

  if (myConversations.length > 0) {
    if (requestedId && myConversations.some((r) => r.requestId === requestedId)) {
      activeRequestId = requestedId;
    } else {
      activeRequestId = myConversations[0].requestId;
    }
  }

  renderConversationSidebar(myConversations);

  if (activeRequestId) {
    selectConversation(activeRequestId, myConversations);
  } else {
    renderEmptyState();
  }

  setupMessageInput();
}

function renderConversationSidebar(conversations) {
  const sidebarList = document.getElementById("chat-sidebar-list");
  if (!sidebarList) return;

  if (conversations.length === 0) {
    sidebarList.innerHTML = `
      <div class="p-4 text-center text-muted small">
        No active matches yet.<br>Accept or send a learning request to start chatting!
      </div>
    `;
    return;
  }

  sidebarList.innerHTML = conversations
    .map((r) => {
      const isSender = r.senderId === currentUser.uid;
      const peerName = isSender ? r.receiverName : r.senderName;
      const isActive = r.requestId === activeRequestId;

      return `
      <div class="chat-peer-item ${isActive ? "active" : ""}" onclick="selectConversation('${r.requestId}')">
        <div class="avatar" style="width: 40px; height: 40px; font-size: 1rem;">
          ${peerName ? peerName[0] : "S"}
        </div>
        <div class="overflow-hidden flex-fill">
          <div class="d-flex justify-content-between align-items-center">
            <strong class="text-truncate text-dark d-block small">${SkillSwapUtils.escapeHtml(peerName)}</strong>
            <span class="badge ${r.status === "completed" ? "bg-secondary" : "bg-success"} rounded-pill" style="font-size: 0.65rem;">
              ${r.status}
            </span>
          </div>
          <div class="small text-muted text-truncate">${SkillSwapUtils.escapeHtml(r.skillName)}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

window.selectConversation = async (requestId, conversationsList) => {
  activeRequestId = requestId;

  const allRequests = conversationsList || (await DB.getAll("requests"));
  const request = allRequests.find((r) => r.requestId === requestId);
  if (!request) return;

  renderConversationSidebar(allRequests.filter((r) =>
    (r.senderId === currentUser.uid || r.receiverId === currentUser.uid) &&
    (r.status === "accepted" || r.status === "completed")
  ));

  const isSender = request.senderId === currentUser.uid;
  const peerName = isSender ? request.receiverName : request.senderName;
  const peerId = isSender ? request.receiverId : request.senderId;

  // Header update
  const headerContainer = document.getElementById("chat-active-header");
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="avatar" style="width: 42px; height: 42px;">
          ${peerName[0]}
        </div>
        <div>
          <h6 class="mb-0 fw-bold text-dark">${SkillSwapUtils.escapeHtml(peerName)}</h6>
          <small class="text-muted">Learning <strong>${SkillSwapUtils.escapeHtml(request.skillName)}</strong> · Mode: ${request.preferredMode}</small>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a href="view-profile.html?uid=${peerId}" class="btn btn-sm btn-outline-secondary">
          Profile
        </a>
        <a href="schedule.html?reqId=${request.requestId}" class="btn btn-sm btn-outline-primary">
          📅 Schedule
        </a>
      </div>
    `;
  }

  // Load chat messages
  loadMessages(requestId);

  // Set up periodic polling for multi-tab live sync
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = setInterval(() => {
    loadMessages(requestId, true);
  }, 2500);
};

async function loadMessages(requestId, isSilent = false) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const messages = await DB.query("messages", (m) => m.requestId === requestId);
  messages.sort((a, b) => a.timestamp - b.timestamp);

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="m-auto text-center text-muted p-4">
        <div class="fs-1 mb-2">👋</div>
        <p class="mb-0 fw-medium">Say hello to your peer!</p>
        <small>Discuss convenient session timings, meeting links, or study topics.</small>
      </div>
    `;
    return;
  }

  const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

  container.innerHTML = messages
    .map((m) => {
      const isMine = m.senderId === currentUser.uid;
      const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
      <div class="chat-bubble ${isMine ? "mine" : "theirs"}">
        <div>${SkillSwapUtils.escapeHtml(m.text)}</div>
        <span class="meta">${isMine ? "You" : SkillSwapUtils.escapeHtml(m.senderName)} · ${timeStr}</span>
      </div>
    `;
    })
    .join("");

  if (!isSilent || isAtBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

function setupMessageInput() {
  const form = document.getElementById("chat-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeRequestId) return;

    const input = document.getElementById("chat-input-text");
    const text = (input?.value || "").trim();
    if (!text) return;

    await DB.add(
      "messages",
      {
        requestId: activeRequestId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        text: text,
        timestamp: Date.now()
      },
      "messageId"
    );

    input.value = "";
    loadMessages(activeRequestId);
  });
}

function renderEmptyState() {
  const main = document.getElementById("chat-main-panel");
  if (!main) return;

  main.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-center text-muted">
      <div class="fs-1 mb-3">💬</div>
      <h4>No Active Matched Conversation</h4>
      <p class="small max-w-sm">
        To start chatting, find a peer mentor or accept an incoming learning request.
      </p>
      <a href="search.html" class="btn btn-primary btn-sm mt-2">Find Mentors</a>
    </div>
  `;
}
