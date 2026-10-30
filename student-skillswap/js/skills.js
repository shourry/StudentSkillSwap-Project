/**
 * Student SkillSwap - Skill Listing Module (Module 3)
 * Handles adding, editing, deleting, and categorizing skills (Teach vs Learn).
 */

let currentUser = null;
let currentEditingSkillId = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  await Auth.initNavbar("skills");
  Auth.initFooter();

  loadUserSkills();
  setupSkillFormListeners();
});

async function loadUserSkills() {
  const skills = await DB.query("skills", (s) => s.userId === currentUser.uid);

  const teachSkills = skills.filter((s) => s.skillType === "teach");
  const learnSkills = skills.filter((s) => s.skillType === "learn");

  renderSkillsList("teach-skills-list", teachSkills, "teach");
  renderSkillsList("learn-skills-list", learnSkills, "learn");
}

function renderSkillsList(containerId, skillList, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (skillList.length === 0) {
    container.innerHTML = `
      <div class="card p-4 text-center text-muted border-dashed">
        <div class="fs-2 mb-2">${type === "teach" ? "🎓" : "📖"}</div>
        <p class="mb-1 fw-medium">No ${type === "teach" ? "teaching" : "learning"} skills added yet.</p>
        <small>Use the form on the left to add skills to your profile.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = skillList
    .map(
      (s) => `
    <div class="card mb-3 p-3 border shadow-sm">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h5 class="mb-1 fw-bold text-dark">${SkillSwapUtils.escapeHtml(s.skillName)}</h5>
          <div class="d-flex align-items-center gap-2">
            ${SkillSwapUtils.renderSkillLevel(s.skillLevel)}
            <span class="badge ${type === "teach" ? "badge-teach" : "badge-learn"}">
              ${type === "teach" ? "Can Teach" : "Want to Learn"}
            </span>
          </div>
        </div>
        <div class="dropdown">
          <button class="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Actions
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><button class="dropdown-item" onclick="openEditSkillModal('${s.skillId}')">✏️ Edit Details</button></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-danger" onclick="deleteSkill('${s.skillId}')">🗑️ Remove Skill</button></li>
          </ul>
        </div>
      </div>
      <p class="small text-secondary mb-0">${SkillSwapUtils.escapeHtml(s.description || "No description provided.")}</p>
    </div>
  `
    )
    .join("");
}

function setupSkillFormListeners() {
  const form = document.getElementById("add-skill-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const skillName = form.skillName.value.trim();
      const skillType = form.skillType.value;
      const skillLevel = form.skillLevel.value;
      const description = form.description.value.trim();

      if (!skillName) {
        SkillSwapUtils.showToast("Skill name is required.", "danger");
        return;
      }

      // Check if skill already exists for this user with same type
      const existing = await DB.query(
        "skills",
        (s) =>
          s.userId === currentUser.uid &&
          s.skillType === skillType &&
          s.skillName.toLowerCase() === skillName.toLowerCase()
      );

      if (existing.length > 0) {
        SkillSwapUtils.showToast(`You have already listed "${skillName}" under ${skillType}!`, "warning");
        return;
      }

      await DB.add(
        "skills",
        {
          userId: currentUser.uid,
          userName: currentUser.name,
          skillName,
          skillType,
          skillLevel,
          description
        },
        "skillId"
      );

      SkillSwapUtils.showToast(`Added "${skillName}" to your skills!`, "success");
      form.reset();
      loadUserSkills();
    });
  }

  // Edit Modal form submit listener
  const editForm = document.getElementById("edit-skill-form");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentEditingSkillId) return;

      const updates = {
        skillName: editForm.editSkillName.value.trim(),
        skillType: editForm.editSkillType.value,
        skillLevel: editForm.editSkillLevel.value,
        description: editForm.editDescription.value.trim()
      };

      await DB.update("skills", "skillId", currentEditingSkillId, updates);
      SkillSwapUtils.showToast("Skill updated successfully!", "success");

      // Hide modal
      const modalEl = document.getElementById("editSkillModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      loadUserSkills();
    });
  }
}

window.openEditSkillModal = async (skillId) => {
  const skill = await DB.get("skills", "skillId", skillId);
  if (!skill) return;

  currentEditingSkillId = skillId;
  const editForm = document.getElementById("edit-skill-form");
  if (!editForm) return;

  editForm.editSkillName.value = skill.skillName;
  editForm.editSkillType.value = skill.skillType;
  editForm.editSkillLevel.value = skill.skillLevel;
  editForm.editDescription.value = skill.description || "";

  const modalEl = document.getElementById("editSkillModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

window.deleteSkill = async (skillId) => {
  if (!confirm("Are you sure you want to remove this skill from your profile?")) return;
  await DB.delete("skills", "skillId", skillId);
  SkillSwapUtils.showToast("Skill removed successfully.", "info");
  loadUserSkills();
};
