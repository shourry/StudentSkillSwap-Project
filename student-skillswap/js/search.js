/**
 * Student SkillSwap - Skill Search & Student Matching Module (Modules 4 & 5)
 * Advanced multi-criteria ranking algorithm:
 * - Keyword relevance
 * - Student average rating & review count
 * - Department affinity
 * - Skill proficiency level
 * - Mutual SkillSwap compatibility (if seeker can teach what provider wants!)
 */

let currentUser = null;
let allUsersMap = {};

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.getCurrentUser();
  await Auth.initNavbar("search");
  Auth.initFooter();

  // Load all users into map
  const users = await DB.getAll("users");
  users.forEach((u) => {
    allUsersMap[u.uid] = u;
  });

  setupSearchListeners();
  executeSearch();
});

function setupSearchListeners() {
  const searchInput = document.getElementById("search-input");
  const deptFilter = document.getElementById("dept-filter");
  const levelFilter = document.getElementById("level-filter");
  const modeFilter = document.getElementById("mode-filter");
  const ratingFilter = document.getElementById("rating-filter");
  const clearBtn = document.getElementById("clear-filters-btn");

  [searchInput, deptFilter, levelFilter, modeFilter, ratingFilter].forEach((el) => {
    if (el) {
      el.addEventListener("input", executeSearch);
      el.addEventListener("change", executeSearch);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (deptFilter) deptFilter.value = "";
      if (levelFilter) levelFilter.value = "";
      if (modeFilter) modeFilter.value = "";
      if (ratingFilter) ratingFilter.value = "";
      executeSearch();
    });
  }

  // Pre-fill search query if passed in URL (?q=Python)
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get("q");
  if (q && searchInput) {
    searchInput.value = q;
  }
}

async function executeSearch() {
  const query = (document.getElementById("search-input")?.value || "").trim().toLowerCase();
  const dept = document.getElementById("dept-filter")?.value || "";
  const level = document.getElementById("level-filter")?.value || "";
  const mode = document.getElementById("mode-filter")?.value || "";
  const minRating = Number(document.getElementById("rating-filter")?.value || 0);

  const container = document.getElementById("search-results-container");
  const countLabel = document.getElementById("results-count-label");
  if (!container) return;

  // Fetch all teach skills
  const allSkills = await DB.getAll("skills");
  const allTeachSkills = allSkills.filter((s) => s.skillType === "teach");

  // Determine seeker's teachable skills to detect "Mutual SkillSwap Match"
  let myTeachSkillNames = [];
  if (currentUser) {
    myTeachSkillNames = allSkills
      .filter((s) => s.userId === currentUser.uid && s.skillType === "teach")
      .map((s) => s.skillName.toLowerCase());
  }

  // Filter skills
  const matchedEntries = [];

  for (const skill of allTeachSkills) {
    // Exclude own skills if logged in
    if (currentUser && skill.userId === currentUser.uid) continue;

    const teacher = allUsersMap[skill.userId];
    if (!teacher) continue;

    // Search query match (skill name or description or teacher name)
    const matchesQuery =
      !query ||
      skill.skillName.toLowerCase().includes(query) ||
      (skill.description && skill.description.toLowerCase().includes(query)) ||
      teacher.name.toLowerCase().includes(query);

    if (!matchesQuery) continue;

    // Filters
    if (dept && teacher.department !== dept) continue;
    if (level && skill.skillLevel !== level) continue;
    if (mode && teacher.preferredMode !== "Both" && teacher.preferredMode !== mode) continue;
    if (minRating > 0 && (teacher.averageRating || 0) < minRating) continue;

    // Check if Teacher wants to learn what CurrentUser teaches (Mutual Match Bonus!)
    const teacherLearnSkills = allSkills
      .filter((s) => s.userId === teacher.uid && s.skillType === "learn")
      .map((s) => s.skillName.toLowerCase());

    const isMutualMatch = teacherLearnSkills.some((tl) =>
      myTeachSkillNames.some((mt) => tl.includes(mt) || mt.includes(tl))
    );

    // Matching Relevance Score Calculation
    let score = 0;
    // Rating weight (up to 25 points)
    score += (teacher.averageRating || 0) * 5;
    // Total reviews reliability (up to 10 points)
    score += Math.min(10, (teacher.totalRatings || 0) * 0.5);
    // Level proficiency: Advanced=9, Intermediate=6, Beginner=3
    const levelScore = { Advanced: 9, Intermediate: 6, Beginner: 3 }[skill.skillLevel] || 3;
    score += levelScore;
    // Department affinity: Same department +5 points for campus accessibility
    if (currentUser && teacher.department === currentUser.department) {
      score += 5;
    }
    // Mutual swap match bonus (+20 points!)
    if (isMutualMatch) {
      score += 20;
    }

    matchedEntries.push({
      skill,
      teacher,
      isMutualMatch,
      matchedTeacherWants: teacherLearnSkills,
      score
    });
  }

  // Rank results by calculated score descending
  matchedEntries.sort((a, b) => b.score - a.score);

  if (countLabel) {
    countLabel.textContent = `${matchedEntries.length} peer mentor${matchedEntries.length === 1 ? "" : "s"} found`;
  }

  if (matchedEntries.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card p-5 text-center text-muted">
          <div class="fs-1 mb-2">🔍</div>
          <h5 class="fw-bold">No student mentors matched your search</h5>
          <p class="small mb-3">Try adjusting your filters, searching for a broader skill keyword, or clear all filters.</p>
          <div>
            <button class="btn btn-outline-primary btn-sm" onclick="document.getElementById('clear-filters-btn').click()">Reset Filters</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = matchedEntries
    .map(({ skill, teacher, isMutualMatch, matchedTeacherWants }) => {
      const mutualBadge = isMutualMatch
        ? `<div class="badge bg-success-subtle text-success border border-success mb-2 px-2 py-1 d-inline-flex align-items-center gap-1">
             <span>🔄</span> <strong>Mutual SkillSwap Match!</strong> They want skills you teach!
           </div>`
        : "";

      return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 p-3 shadow-sm border position-relative">
          ${mutualBadge}
          
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="avatar avatar-lg">
              ${
                teacher.profilePhoto
                  ? `<img src="${teacher.profilePhoto}" alt="${teacher.name}">`
                  : teacher.name[0]
              }
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-dark">
                <a href="view-profile.html?uid=${teacher.uid}" class="text-decoration-none text-dark hover-primary">
                  ${SkillSwapUtils.escapeHtml(teacher.name)}
                </a>
              </h5>
              <div class="small text-muted">${teacher.department} · ${teacher.year}</div>
              <div class="mt-1">${SkillSwapUtils.renderStars(teacher.averageRating, teacher.totalRatings)}</div>
            </div>
          </div>

          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="fw-bold text-primary fs-6">${SkillSwapUtils.escapeHtml(skill.skillName)}</span>
              ${SkillSwapUtils.renderSkillLevel(skill.skillLevel)}
            </div>
            <p class="small text-secondary mb-0 line-clamp-2">
              ${SkillSwapUtils.escapeHtml(skill.description || "Offers peer mentoring and practice sessions.")}
            </p>
          </div>

          <div class="bg-light p-2 rounded mb-3 small text-muted">
            <div class="d-flex justify-content-between mb-1">
              <span>⏱️ Availability:</span>
              <strong class="text-dark">${SkillSwapUtils.escapeHtml(teacher.availability || "Flexible")}</strong>
            </div>
            <div class="d-flex justify-content-between">
              <span>📍 Mode:</span>
              <strong class="text-dark">${teacher.preferredMode || "Both"}</strong>
            </div>
          </div>

          <div class="mt-auto d-flex gap-2">
            <a href="view-profile.html?uid=${teacher.uid}" class="btn btn-outline-primary btn-sm flex-fill">
              View Profile
            </a>
            ${
              currentUser
                ? `<button class="btn btn-primary btn-sm flex-fill" onclick="openRequestModal('${teacher.uid}', '${SkillSwapUtils.escapeHtml(skill.skillName)}')">
                     Send Request
                   </button>`
                : `<a href="login.html" class="btn btn-primary btn-sm flex-fill">
                     Login to Request
                   </a>`
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// Global modal trigger for sending learning request
window.openRequestModal = (providerId, skillName) => {
  const teacher = allUsersMap[providerId];
  if (!teacher) return;

  const modalEl = document.getElementById("sendRequestModal");
  if (!modalEl) return;

  document.getElementById("modal-receiver-name").textContent = teacher.name;
  document.getElementById("modal-receiver-dept").textContent = `${teacher.department} · ${teacher.year}`;
  document.getElementById("modal-skill-name").value = skillName;
  document.getElementById("modal-provider-id").value = providerId;

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Send Request submission
document.addEventListener("DOMContentLoaded", () => {
  const reqForm = document.getElementById("modal-request-form");
  if (reqForm) {
    reqForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) {
        window.location.href = "login.html";
        return;
      }

      const providerId = document.getElementById("modal-provider-id").value;
      const skillName = document.getElementById("modal-skill-name").value;
      const preferredMode = reqForm.preferredMode.value;
      const message = reqForm.message.value.trim();

      const teacher = allUsersMap[providerId];

      await DB.add(
        "requests",
        {
          senderId: currentUser.uid,
          senderName: currentUser.name,
          receiverId: providerId,
          receiverName: teacher ? teacher.name : "Peer Mentor",
          skillName,
          preferredMode,
          message,
          status: "pending"
        },
        "requestId"
      );

      SkillSwapUtils.showToast("Learning request sent successfully!", "success");

      const modalEl = document.getElementById("sendRequestModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      reqForm.reset();
    });
  }
});
