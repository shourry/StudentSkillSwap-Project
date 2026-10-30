/**
 * Student SkillSwap - Student Profile Management Controller (Module 2)
 * Handles profile viewing, editing, photo uploads (base64/URL), and availability preferences.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = await Auth.requireAuth();
  if (!user) return;

  await Auth.initNavbar("profile");
  Auth.initFooter();

  loadProfileForm(user);
  setupProfileListeners(user);
});

async function loadProfileForm(currentUser) {
  const user = (await DB.get("users", "uid", currentUser.uid)) || currentUser;

  // Set form values
  const form = document.getElementById("profile-form");
  if (!form) return;

  form.name.value = user.name || "";
  form.email.value = user.email || "";
  form.enrollment.value = user.enrollment || "";
  form.department.value = user.department || "CSE";
  form.year.value = user.year || "1st Year";
  form.semester.value = user.semester || "1st Sem";
  form.availability.value = user.availability || "Evenings & Weekends";
  form.preferredMode.value = user.preferredMode || "Both";
  form.bio.value = user.bio || "";

  // Profile preview card
  updateAvatarPreview(user.profilePhoto, user.name);

  const displayRating = document.getElementById("profile-rating-display");
  if (displayRating) {
    displayRating.innerHTML = SkillSwapUtils.renderStars(user.averageRating, user.totalRatings);
  }

  // Load user's skills count
  const mySkills = await DB.query("skills", (s) => s.userId === user.uid);
  const teachSkills = mySkills.filter((s) => s.skillType === "teach");
  const learnSkills = mySkills.filter((s) => s.skillType === "learn");

  const skillsSummaryEl = document.getElementById("profile-skills-summary");
  if (skillsSummaryEl) {
    skillsSummaryEl.innerHTML = `
      <div class="row g-2 text-center mt-2">
        <div class="col-6">
          <div class="p-2 border rounded bg-light">
            <span class="fs-4 fw-bold text-primary">${teachSkills.length}</span>
            <div class="small text-muted">Teaching Skills</div>
          </div>
        </div>
        <div class="col-6">
          <div class="p-2 border rounded bg-light">
            <span class="fs-4 fw-bold text-warning">${learnSkills.length}</span>
            <div class="small text-muted">Learning Skills</div>
          </div>
        </div>
      </div>
    `;
  }
}

function updateAvatarPreview(photoUrl, name) {
  const avatarContainer = document.getElementById("avatar-preview-container");
  if (!avatarContainer) return;

  if (photoUrl) {
    avatarContainer.innerHTML = `<img src="${photoUrl}" alt="${SkillSwapUtils.escapeHtml(name)}" class="rounded-circle" style="width: 100px; height: 100px; object-fit: cover; border: 3px solid var(--bist-blue);">`;
  } else {
    avatarContainer.innerHTML = `
      <div class="avatar avatar-xl">
        ${SkillSwapUtils.escapeHtml(name ? name[0] : "S")}
      </div>
    `;
  }
}

function setupProfileListeners(currentUser) {
  const form = document.getElementById("profile-form");
  const photoInput = document.getElementById("photo-file-input");
  const photoUrlInput = document.getElementById("photo-url-input");
  let currentPhotoData = currentUser.profilePhoto;

  // Handle local file photo upload (converts to DataURL for immediate browser storage)
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          SkillSwapUtils.showToast("Image size must be less than 2MB.", "danger");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          currentPhotoData = event.target.result;
          updateAvatarPreview(currentPhotoData, form.name.value);
          SkillSwapUtils.showToast("Photo selected! Click 'Save Changes' to update.", "info");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle photo URL input
  if (photoUrlInput) {
    photoUrlInput.addEventListener("blur", (e) => {
      const url = e.target.value.trim();
      if (url) {
        currentPhotoData = url;
        updateAvatarPreview(currentPhotoData, form.name.value);
      }
    });
  }

  // Handle avatar presets
  document.querySelectorAll(".avatar-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPhotoData = btn.dataset.url;
      updateAvatarPreview(currentPhotoData, form.name.value);
      SkillSwapUtils.showToast("Preset avatar selected!", "info");
    });
  });

  // Handle Form Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const updates = {
          name: form.name.value.trim(),
          department: form.department.value,
          year: form.year.value,
          semester: form.semester.value,
          enrollment: form.enrollment.value.trim().toUpperCase(),
          availability: form.availability.value.trim(),
          preferredMode: form.preferredMode.value,
          bio: form.bio.value.trim(),
          profilePhoto: currentPhotoData
        };

        await DB.update("users", "uid", currentUser.uid, updates);

        // Also update userName in skills list for consistency
        const userSkills = await DB.query("skills", (s) => s.userId === currentUser.uid);
        for (const sk of userSkills) {
          await DB.update("skills", "skillId", sk.skillId, { userName: updates.name });
        }

        SkillSwapUtils.showToast("Profile updated successfully!", "success");
        await Auth.initNavbar("profile");
        loadProfileForm(currentUser);
      } catch (err) {
        console.error(err);
        SkillSwapUtils.showToast("Failed to update profile: " + err.message, "danger");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}
