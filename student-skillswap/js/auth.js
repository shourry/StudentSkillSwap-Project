/**
 * Student SkillSwap - Authentication & Session Management Module
 * Handles login, registration, password reset, session persistence,
 * route guards, and dynamic navbar rendering across all pages.
 */

(function (window) {
  const SESSION_KEY = "skillswap_auth_user_id";

  window.Auth = {
    async getCurrentUser() {
      const uid = localStorage.getItem(SESSION_KEY);
      if (!uid) return null;
      return await DB.get("users", "uid", uid);
    },

    async register(formData) {
      const email = formData.email.trim().toLowerCase();
      const existing = await DB.get("users", "email", email);
      if (existing) {
        throw new Error("A student account with this email address already exists.");
      }

      // Generate realistic BIST avatar if none provided
      const defaultPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}&backgroundColor=0F6EC6,04617B`;

      const newUser = await DB.add(
        "users",
        {
          name: formData.name.trim(),
          email: email,
          password: formData.password,
          enrollment: (formData.enrollment || "").trim().toUpperCase(),
          department: formData.department || "CSE",
          year: formData.year || "1st Year",
          semester: formData.semester || "1st Sem",
          bio: formData.bio || `Student at BIST Bhopal, eager to learn and share skills.`,
          profilePhoto: formData.profilePhoto || defaultPhoto,
          averageRating: 0,
          totalRatings: 0,
          availability: formData.availability || "Flexible Evenings",
          preferredMode: formData.preferredMode || "Both",
          role: "student"
        },
        "uid"
      );

      localStorage.setItem(SESSION_KEY, newUser.uid);
      return newUser;
    },

    async login(email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await DB.get("users", "email", normalizedEmail);

      if (!user) {
        throw new Error("No account found with this email address.");
      }

      if (user.password !== password) {
        throw new Error("Incorrect password. Please try again.");
      }

      localStorage.setItem(SESSION_KEY, user.uid);
      return user;
    },

    async logout() {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    },

    async resetPassword(email) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await DB.get("users", "email", normalizedEmail);
      if (!user) {
        throw new Error("No registered account found with this email.");
      }
      return true;
    },

    async switchAccount(uid) {
      const user = await DB.get("users", "uid", uid);
      if (user) {
        localStorage.setItem(SESSION_KEY, user.uid);
        SkillSwapUtils.showToast(`Switched account to: ${user.name} (${user.role})`, "info");
        setTimeout(() => window.location.reload(), 300);
      }
    },

    // Route guards
    async requireAuth(targetRedirect = "login.html") {
      const user = await this.getCurrentUser();
      if (!user) {
        window.location.href = targetRedirect;
        return null;
      }
      return user;
    },

    async requireAdmin() {
      const user = await this.requireAuth();
      if (!user) return null;
      if (user.role !== "admin") {
        SkillSwapUtils.showToast("Admin access required. Redirecting to Dashboard...", "danger");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1200);
        return null;
      }
      return user;
    },

    // Universal Navigation Bar Renderer
    async initNavbar(activePage = "") {
      const navPlaceholder = document.getElementById("navbar-placeholder");
      if (!navPlaceholder) return;

      const currentUser = await this.getCurrentUser();
      let pendingRequestsCount = 0;

      if (currentUser) {
        const reqs = await DB.query("requests", (r) => r.receiverId === currentUser.uid && r.status === "pending");
        pendingRequestsCount = reqs.length;
      }

      const allUsers = await DB.getAll("users");

      let navContent = `
        <nav class="navbar navbar-expand-lg navbar-dark bist-navbar sticky-top">
          <div class="container">
            <a class="navbar-brand" href="${currentUser ? "dashboard.html" : "index.html"}">
              <span class="fs-4">🔄</span>
              <span class="fw-bold">SkillSwap</span>
              <span class="brand-badge ms-1">BIST BHOPAL</span>
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="mainNav">
              <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
                ${
                  currentUser
                    ? `
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "dashboard" ? "active" : ""}" href="dashboard.html">
                      📊 Dashboard
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "search" ? "active" : ""}" href="search.html">
                      🔍 Find Mentors
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "skills" ? "active" : ""}" href="skills.html">
                      💡 My Skills
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "requests" ? "active" : ""}" href="requests.html">
                      📬 Requests ${pendingRequestsCount > 0 ? `<span class="badge bg-danger ms-1">${pendingRequestsCount}</span>` : ""}
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "schedule" ? "active" : ""}" href="schedule.html">
                      📅 Sessions
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "chat" ? "active" : ""}" href="chat.html">
                      💬 Chat
                    </a>
                  </li>
                  ${
                    currentUser.role === "admin"
                      ? `
                  <li class="nav-item">
                    <a class="nav-link text-warning fw-semibold ${activePage === "admin" ? "active" : ""}" href="admin.html">
                      🛡️ Admin Panel
                    </a>
                  </li>`
                      : ""
                  }
                `
                    : `
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "home" ? "active" : ""}" href="index.html">Home</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link ${activePage === "search" ? "active" : ""}" href="search.html">Explore Skills</a>
                  </li>
                `
                }
              </ul>

              <div class="d-flex align-items-center gap-2">
                ${
                  currentUser
                    ? `
                  <div class="dropdown">
                    <a href="#" class="user-avatar-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                      <div class="avatar avatar-sm" style="width: 32px; height: 32px; font-size: 0.85rem;">
                        ${
                          currentUser.profilePhoto
                            ? `<img src="${currentUser.profilePhoto}" alt="${currentUser.name}">`
                            : currentUser.name[0]
                        }
                      </div>
                      <span class="d-none d-md-inline fw-semibold text-white small">${SkillSwapUtils.escapeHtml(currentUser.name)}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                      <li class="px-3 py-2 border-bottom">
                        <div class="fw-bold">${SkillSwapUtils.escapeHtml(currentUser.name)}</div>
                        <small class="text-muted">${currentUser.department} · ${currentUser.year}</small>
                        <div class="mt-1">${SkillSwapUtils.renderStars(currentUser.averageRating, currentUser.totalRatings)}</div>
                      </li>
                      <li><a class="dropdown-item py-2" href="profile.html">👤 Edit Profile</a></li>
                      <li><a class="dropdown-item py-2" href="view-profile.html?uid=${currentUser.uid}">👁️ Public Profile</a></li>
                      <li><a class="dropdown-item py-2" href="skills.html">⚡ Manage Skills</a></li>
                      <li><hr class="dropdown-divider"></li>
                      <li class="dropdown-header text-uppercase small fw-bold">Demo Quick Switch:</li>
                      ${allUsers
                        .map(
                          (u) => `
                        <li>
                          <button class="dropdown-item py-1 small d-flex align-items-center justify-content-between" onclick="Auth.switchAccount('${u.uid}')">
                            <span>${u.role === "admin" ? "🛡️" : "🎓"} ${SkillSwapUtils.escapeHtml(u.name)}</span>
                            ${u.uid === currentUser.uid ? '<span class="badge bg-primary">Active</span>' : ""}
                          </button>
                        </li>
                      `
                        )
                        .join("")}
                      <li><hr class="dropdown-divider"></li>
                      <li><button class="dropdown-item text-danger py-2" onclick="Auth.logout()">🚪 Logout</button></li>
                    </ul>
                  </div>
                `
                    : `
                  <a href="login.html" class="btn btn-outline-light btn-sm px-3">Login</a>
                  <a href="register.html" class="btn btn-light btn-sm px-3 fw-semibold text-primary">Get Started</a>
                `
                }
              </div>
            </div>
          </div>
        </nav>
      `;

      navPlaceholder.innerHTML = navContent;
    },

    // Footer Renderer
    initFooter() {
      const footerPlaceholder = document.getElementById("footer-placeholder");
      if (!footerPlaceholder) return;

      footerPlaceholder.innerHTML = `
        <footer class="mt-auto py-4">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-md-6 text-center text-md-start mb-2 mb-md-0">
                <div class="fw-bold text-dark d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                  <span>🔄 Student SkillSwap</span>
                  <span class="badge bg-secondary-subtle text-secondary border">BIST Bhopal</span>
                </div>
                <small class="text-muted">Bansal Institute of Science & Technology · Peer-to-Peer Campus Marketplace</small>
              </div>
              <div class="col-md-6 text-center text-md-end">
                <small class="text-muted">Designed for BIST Students · Free & Open Knowledge Exchange</small>
                <div class="mt-1">
                  <a href="javascript:DB.resetDemoData()" class="badge text-decoration-none bg-light text-muted border">↺ Reset Demo Data</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      `;
    }
  };
})(window);
