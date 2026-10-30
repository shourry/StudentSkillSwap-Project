/**
 * Student SkillSwap - Admin Management Module (Module 10)
 * Handles metrics analytics, user management, content moderation, and reporting.
 */

let adminUser = null;
let allUsers = [];

document.addEventListener("DOMContentLoaded", async () => {
  adminUser = await Auth.requireAdmin();
  if (!adminUser) return;

  await Auth.initNavbar("admin");
  Auth.initFooter();

  loadAdminDashboard();
  setupAdminListeners();

  window.addEventListener("skillswap:datachange", () => {
    loadAdminDashboard();
  });
});

async function loadAdminDashboard() {
  allUsers = await DB.getAll("users");
  const allSkills = await DB.getAll("skills");
  const allSessions = await DB.getAll("sessions");
  const allRequests = await DB.getAll("requests");
  const allReports = await DB.getAll("reports");

  // Metrics counters
  const totalStudents = allUsers.filter((u) => u.role !== "admin").length;
  const activeSessions = allSessions.filter((s) => s.status === "scheduled").length;
  const completedSessions = allSessions.filter((s) => s.status === "completed").length;
  const totalSkillsCount = allSkills.length;

  document.getElementById("stat-total-students").textContent = totalStudents;
  document.getElementById("stat-active-sessions").textContent = activeSessions;
  document.getElementById("stat-completed-sessions").textContent = completedSessions;
  document.getElementById("stat-total-skills").textContent = totalSkillsCount;

  // Render Popular Skills Analytics
  renderPopularSkills(allSkills);

  // Render Users Table
  renderUsersTable(allUsers);

  // Render Reports / Moderation section
  renderReportsList(allReports);
}

function renderPopularSkills(skills) {
  const container = document.getElementById("popular-skills-container");
  if (!container) return;

  const teachCounts = {};
  const learnCounts = {};

  skills.forEach((s) => {
    const name = s.skillName;
    if (s.skillType === "teach") {
      teachCounts[name] = (teachCounts[name] || 0) + 1;
    } else {
      learnCounts[name] = (learnCounts[name] || 0) + 1;
    }
  });

  const sortedSkills = Object.entries(teachCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedSkills.length === 0) {
    container.innerHTML = `<div class="text-muted small">No skill data available.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="list-group list-group-flush">
      ${sortedSkills
        .map(([name, count]) => {
          const demandCount = learnCounts[name] || 0;
          return `
          <div class="list-group-item d-flex justify-content-between align-items-center px-0">
            <div>
              <strong class="text-dark">${SkillSwapUtils.escapeHtml(name)}</strong>
              <div class="small text-muted">${demandCount} students want to learn this</div>
            </div>
            <div>
              <span class="badge bg-primary rounded-pill">${count} teachers</span>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderUsersTable(users) {
  const tbody = document.getElementById("admin-users-tbody");
  if (!tbody) return;

  const searchVal = (document.getElementById("user-search-input")?.value || "").toLowerCase();
  const deptFilter = document.getElementById("user-dept-filter")?.value || "";

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchVal ||
      u.name.toLowerCase().includes(searchVal) ||
      u.email.toLowerCase().includes(searchVal) ||
      (u.enrollment && u.enrollment.toLowerCase().includes(searchVal));

    const matchesDept = !deptFilter || u.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No student records found matching filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (u) => `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="avatar" style="width: 32px; height: 32px; font-size: 0.85rem;">
            ${u.profilePhoto ? `<img src="${u.profilePhoto}" alt="${u.name}">` : u.name[0]}
          </div>
          <div>
            <strong>${SkillSwapUtils.escapeHtml(u.name)}</strong>
            ${u.role === "admin" ? '<span class="badge bg-danger ms-1">Admin</span>' : ""}
          </div>
        </div>
      </td>
      <td><small class="text-muted">${SkillSwapUtils.escapeHtml(u.email)}</small></td>
      <td><code>${u.enrollment || "N/A"}</code></td>
      <td><span class="badge bg-light text-dark border">${u.department}</span></td>
      <td>${SkillSwapUtils.renderStars(u.averageRating, u.totalRatings)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <a href="view-profile.html?uid=${u.uid}" class="btn btn-outline-secondary" title="View Profile">👁️</a>
          ${
            u.role !== "admin"
              ? `<button class="btn btn-outline-danger" onclick="deleteUser('${u.uid}', '${SkillSwapUtils.escapeHtml(u.name)}')" title="Remove Account">🗑️</button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

function renderReportsList(reports) {
  const container = document.getElementById("admin-reports-container");
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = `<div class="p-3 text-center text-muted small bg-light rounded">No pending moderation reports.</div>`;
    return;
  }

  container.innerHTML = reports
    .map(
      (rep) => `
    <div class="card mb-2 p-3 border">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <span class="badge ${rep.status === "pending" ? "bg-warning text-dark" : "bg-success"} mb-1">${rep.status}</span>
          <div class="fw-bold text-dark">Reported: ${SkillSwapUtils.escapeHtml(rep.reportedUserName)}</div>
        </div>
        <small class="text-muted">${SkillSwapUtils.formatDate(rep.createdAt)}</small>
      </div>
      <p class="small text-secondary mb-2 bg-light p-2 rounded">"${SkillSwapUtils.escapeHtml(rep.reason)}"</p>
      <div class="d-flex gap-2 justify-content-end">
        ${
          rep.status === "pending"
            ? `<button class="btn btn-sm btn-outline-success" onclick="resolveReport('${rep.reportId}')">Mark Resolved</button>`
            : '<span class="text-success small">Resolved</span>'
        }
      </div>
    </div>
  `
    )
    .join("");
}

function setupAdminListeners() {
  const searchInput = document.getElementById("user-search-input");
  const deptFilter = document.getElementById("user-dept-filter");

  if (searchInput) searchInput.addEventListener("input", () => renderUsersTable(allUsers));
  if (deptFilter) deptFilter.addEventListener("change", () => renderUsersTable(allUsers));
}

window.deleteUser = async (uid, userName) => {
  if (!confirm(`Are you sure you want to permanently remove student account: "${userName}"? This will delete their listed skills and requests.`)) return;

  await DB.delete("users", "uid", uid);
  // Remove user's skills
  const skills = await DB.query("skills", (s) => s.userId === uid);
  for (const sk of skills) {
    await DB.delete("skills", "skillId", sk.skillId);
  }

  SkillSwapUtils.showToast(`User ${userName} removed.`, "info");
  loadAdminDashboard();
};

window.resolveReport = async (reportId) => {
  await DB.update("reports", "reportId", reportId, { status: "resolved" });
  SkillSwapUtils.showToast("Report marked as resolved.", "success");
  loadAdminDashboard();
};
