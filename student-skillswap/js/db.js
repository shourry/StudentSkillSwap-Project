/**
 * Student SkillSwap - Data Layer & Simulated Cloud Firestore (BaaS Engine)
 * Handles collections: users, skills, requests, sessions, ratings, messages, reports.
 * Persists to localStorage with realistic BIST Bhopal student seed records.
 */

(function (window) {
  const STORAGE_PREFIX = "skillswap_bist_";

  const uid = (prefix = "id") =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  const loadCollection = (col) => {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + col);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error loading collection ${col}:`, e);
      return [];
    }
  };

  const saveCollection = (col, list) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + col, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent("skillswap:datachange", { detail: { collection: col } })
      );
    } catch (e) {
      console.error(`Error saving collection ${col}:`, e);
    }
  };

  // Seed Data for BIST Bhopal Students
  const SEED_USERS = [
    {
      uid: "user_shoury",
      name: "Shoury Thakur",
      email: "shoury@bist.ac.in",
      password: "password123",
      enrollment: "0103CS221088",
      department: "CSE",
      year: "3rd Year",
      semester: "5th Sem",
      bio: "Passionate about full-stack web development and competitive programming. Always ready to guide peers in Python and Data Structures!",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      averageRating: 4.8,
      totalRatings: 14,
      availability: "Mon-Fri (4 PM - 7 PM)",
      preferredMode: "Both",
      role: "student",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30
    },
    {
      uid: "user_yash",
      name: "Yash Ghosh",
      email: "yash@bist.ac.in",
      password: "password123",
      enrollment: "0103CS221045",
      department: "CSE",
      year: "3rd Year",
      semester: "6th Sem",
      bio: "Pythonista, Machine Learning tinkerer, and active BIST coding club coordinator. Let's build real-world AI projects together.",
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      averageRating: 4.9,
      totalRatings: 18,
      availability: "Weekends & Evenings",
      preferredMode: "Online",
      role: "student",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45
    },
    {
      uid: "user_vansh",
      name: "Vansh Vishway",
      email: "vansh@bist.ac.in",
      password: "password123",
      enrollment: "0103IT221029",
      department: "IT",
      year: "3rd Year",
      semester: "5th Sem",
      bio: "Graphic designer, Canva and Figma UI/UX pro. Happy to teach design systems in exchange for backend/Python lessons!",
      profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      averageRating: 4.7,
      totalRatings: 9,
      availability: "Daily (5 PM - 8 PM)",
      preferredMode: "Both",
      role: "student",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20
    },
    {
      uid: "user_sourabh",
      name: "Sourabh Rajak",
      email: "sourabh@bist.ac.in",
      password: "password123",
      enrollment: "0103EC231012",
      department: "ECE",
      year: "2nd Year",
      semester: "3rd Sem",
      bio: "BIST Debate team lead & IoT enthusiast. Coaching students on public speaking, stage fear, and Arduino fundamentals.",
      profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      averageRating: 4.6,
      totalRatings: 8,
      availability: "Flexible Afternoons",
      preferredMode: "Offline",
      role: "student",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15
    },
    {
      uid: "user_priya",
      name: "Priya Sharma",
      email: "priya@bist.ac.in",
      password: "password123",
      enrollment: "0103CS211075",
      department: "CSE",
      year: "4th Year",
      semester: "7th Sem",
      bio: "Placed at TCS Digital! Helping college juniors master Java DSA, core CS subjects, and mock technical interviews.",
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      averageRating: 5.0,
      totalRatings: 22,
      availability: "Saturdays & Sundays",
      preferredMode: "Online",
      role: "student",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60
    },
    {
      uid: "user_admin",
      name: "BIST Administrator",
      email: "admin@bist.ac.in",
      password: "admin123",
      enrollment: "ADMIN-BIST-01",
      department: "CSE / Admin Cell",
      year: "Faculty / Staff",
      semester: "N/A",
      bio: "Official Student SkillSwap Platform Administrator for Bansal Institute of Science & Technology, Bhopal.",
      profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      averageRating: 5.0,
      totalRatings: 50,
      availability: "College Hours",
      preferredMode: "Both",
      role: "admin",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100
    }
  ];

  const SEED_SKILLS = [
    // Shoury Thakur
    {
      skillId: "sk_1",
      userId: "user_shoury",
      userName: "Shoury Thakur",
      skillName: "Python",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "From Python syntax to OOP, decorators, and data manipulation.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25
    },
    {
      skillId: "sk_2",
      userId: "user_shoury",
      userName: "Shoury Thakur",
      skillName: "Data Structures & Algorithms",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Arrays, Linked Lists, Binary Trees, Graph traversal, and LeetCode problem solving.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25
    },
    {
      skillId: "sk_3",
      userId: "user_shoury",
      userName: "Shoury Thakur",
      skillName: "Graphic Design",
      skillType: "learn",
      skillLevel: "Beginner",
      description: "Want to learn Figma design for my web apps.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20
    },
    // Yash Ghosh
    {
      skillId: "sk_4",
      userId: "user_yash",
      userName: "Yash Ghosh",
      skillName: "Python",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Python for Data Science, Pandas, NumPy, and automation scripts.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40
    },
    {
      skillId: "sk_5",
      userId: "user_yash",
      userName: "Yash Ghosh",
      skillName: "Machine Learning Basics",
      skillType: "teach",
      skillLevel: "Intermediate",
      description: "Supervised algorithms, regression, Scikit-learn, and model metrics.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35
    },
    {
      skillId: "sk_6",
      userId: "user_yash",
      userName: "Yash Ghosh",
      skillName: "Public Speaking",
      skillType: "learn",
      skillLevel: "Beginner",
      description: "Need help presenting seminar topics with confidence.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20
    },
    // Vansh Vishway
    {
      skillId: "sk_7",
      userId: "user_vansh",
      userName: "Vansh Vishway",
      skillName: "Graphic Design",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Figma UI/UX, Canva social templates, color harmony, typography.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18
    },
    {
      skillId: "sk_8",
      userId: "user_vansh",
      userName: "Vansh Vishway",
      skillName: "Python",
      skillType: "learn",
      skillLevel: "Beginner",
      description: "Need guidance with Python variables, loops and building CLI tools.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15
    },
    // Sourabh Rajak
    {
      skillId: "sk_9",
      userId: "user_sourabh",
      userName: "Sourabh Rajak",
      skillName: "Public Speaking",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Body language, pitch modulation, overcoming stage anxiety, and debate tactics.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14
    },
    {
      skillId: "sk_10",
      userId: "user_sourabh",
      userName: "Sourabh Rajak",
      skillName: "Arduino & IoT",
      skillType: "teach",
      skillLevel: "Intermediate",
      description: "Sensor integration, microcontrollers, breadboard prototyping.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
    },
    {
      skillId: "sk_11",
      userId: "user_sourabh",
      userName: "Sourabh Rajak",
      skillName: "Python",
      skillType: "teach",
      skillLevel: "Beginner",
      description: "Starter syntax and script basics for electronics enthusiasts.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12
    },
    // Priya Sharma
    {
      skillId: "sk_12",
      userId: "user_priya",
      userName: "Priya Sharma",
      skillName: "Java",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Core Java, Multithreading, Collections Framework, and Enterprise fundamentals.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50
    },
    {
      skillId: "sk_13",
      userId: "user_priya",
      userName: "Priya Sharma",
      skillName: "Interview Preparation",
      skillType: "teach",
      skillLevel: "Advanced",
      description: "Campus placement coding rounds, HR rounds, resume tailoring for IT firms.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50
    }
  ];

  const SEED_REQUESTS = [
    {
      requestId: "req_demo_1",
      senderId: "user_vansh",
      senderName: "Vansh Vishway",
      receiverId: "user_yash",
      receiverName: "Yash Ghosh",
      skillName: "Python",
      preferredMode: "Online",
      message: "Hey Yash! I saw your Python mentoring profile. I want to build a small script for my UI projects. Would love your help!",
      status: "accepted",
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      updatedAt: Date.now() - 1000 * 60 * 60 * 36
    },
    {
      requestId: "req_demo_2",
      senderId: "user_sourabh",
      senderName: "Sourabh Rajak",
      receiverId: "user_shoury",
      receiverName: "Shoury Thakur",
      skillName: "Data Structures & Algorithms",
      preferredMode: "Offline",
      message: "Hi Shoury, can you help me understand binary search trees in the college library during free hours?",
      status: "pending",
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
      updatedAt: Date.now() - 1000 * 60 * 60 * 12
    },
    {
      requestId: "req_demo_3",
      senderId: "user_shoury",
      senderName: "Shoury Thakur",
      receiverId: "user_vansh",
      receiverName: "Vansh Vishway",
      skillName: "Graphic Design",
      preferredMode: "Online",
      message: "Hey Vansh, need a quick workshop on Figma components and auto-layout!",
      status: "completed",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
    }
  ];

  const SEED_SESSIONS = [
    {
      sessionId: "sess_demo_1",
      requestId: "req_demo_1",
      providerId: "user_yash",
      providerName: "Yash Ghosh",
      seekerId: "user_vansh",
      seekerName: "Vansh Vishway",
      skillName: "Python",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split("T")[0],
      time: "17:00",
      duration: "1 hour",
      mode: "Online",
      location: "https://meet.google.com/bist-skillswap-py",
      status: "scheduled",
      createdAt: Date.now() - 1000 * 60 * 60 * 30
    },
    {
      sessionId: "sess_demo_2",
      requestId: "req_demo_3",
      providerId: "user_vansh",
      providerName: "Vansh Vishway",
      seekerId: "user_shoury",
      seekerName: "Shoury Thakur",
      skillName: "Graphic Design",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split("T")[0],
      time: "16:00",
      duration: "1 hour",
      mode: "Offline",
      location: "Nursing Building Library Area",
      status: "completed",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4
    }
  ];

  const SEED_RATINGS = [
    {
      ratingId: "rate_1",
      sessionId: "sess_demo_2",
      skillName: "Graphic Design",
      raterId: "user_shoury",
      raterName: "Shoury Thakur",
      ratedUserId: "user_vansh",
      stars: 5,
      review: "Awesome session! Vansh explained Figma components and UI basics in just 45 minutes. Super practical!",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
    },
    {
      ratingId: "rate_2",
      sessionId: "sess_demo_2",
      skillName: "Graphic Design",
      raterId: "user_vansh",
      raterName: "Vansh Vishway",
      ratedUserId: "user_shoury",
      stars: 5,
      review: "Great peer learner! Shoury grasped design fundamentals really quickly.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
    }
  ];

  const SEED_MESSAGES = [
    {
      messageId: "msg_1",
      requestId: "req_demo_1",
      senderId: "user_vansh",
      senderName: "Vansh Vishway",
      text: "Hey Yash! Thanks for accepting my request. Looking forward to learning Python!",
      timestamp: Date.now() - 1000 * 60 * 60 * 35
    },
    {
      messageId: "msg_2",
      requestId: "req_demo_1",
      senderId: "user_yash",
      senderName: "Yash Ghosh",
      text: "Hey Vansh! Absolutely. Have you written any code before or starting fresh?",
      timestamp: Date.now() - 1000 * 60 * 60 * 34
    },
    {
      messageId: "msg_3",
      requestId: "req_demo_1",
      senderId: "user_vansh",
      senderName: "Vansh Vishway",
      text: "Starting fresh with loops and functions! I also scheduled our session on Google Meet for 5 PM.",
      timestamp: Date.now() - 1000 * 60 * 60 * 28
    },
    {
      messageId: "msg_4",
      requestId: "req_demo_1",
      senderId: "user_yash",
      senderName: "Yash Ghosh",
      text: "Perfect! I have hands-on exercises prepared. See you there! 🚀",
      timestamp: Date.now() - 1000 * 60 * 60 * 27
    }
  ];

  const SEED_REPORTS = [
    {
      reportId: "rep_1",
      reportedUserId: "user_sourabh",
      reportedUserName: "Sourabh Rajak",
      reporterId: "user_vansh",
      reason: "Missed scheduled practice session without prior notice.",
      status: "pending",
      createdAt: Date.now() - 1000 * 60 * 60 * 30
    }
  ];

  // Initialize and Seed Storage if empty
  const initDatabase = () => {
    if (!localStorage.getItem(STORAGE_PREFIX + "seeded")) {
      saveCollection("users", SEED_USERS);
      saveCollection("skills", SEED_SKILLS);
      saveCollection("requests", SEED_REQUESTS);
      saveCollection("sessions", SEED_SESSIONS);
      saveCollection("ratings", SEED_RATINGS);
      saveCollection("messages", SEED_MESSAGES);
      saveCollection("reports", SEED_REPORTS);
      localStorage.setItem(STORAGE_PREFIX + "seeded", "true");
      console.log("Student SkillSwap: Seed data successfully initialized.");
    }
  };

  initDatabase();

  // Database API
  window.DB = {
    async getAll(collection) {
      return loadCollection(collection);
    },

    async get(collection, idKey, idVal) {
      const all = loadCollection(collection);
      return all.find((item) => item[idKey] === idVal) || null;
    },

    async query(collection, predicate) {
      const all = loadCollection(collection);
      return predicate ? all.filter(predicate) : all;
    },

    async add(collection, record, customIdField = "id") {
      const all = loadCollection(collection);
      const generatedId = uid(collection.slice(0, 3));
      const newRecord = {
        [customIdField]: record[customIdField] || generatedId,
        createdAt: Date.now(),
        ...record
      };
      all.push(newRecord);
      saveCollection(collection, all);
      return newRecord;
    },

    async update(collection, idKey, idVal, patch) {
      const all = loadCollection(collection);
      let updated = null;
      const nextList = all.map((item) => {
        if (item[idKey] === idVal) {
          updated = { ...item, ...patch, updatedAt: Date.now() };
          return updated;
        }
        return item;
      });
      saveCollection(collection, nextList);
      return updated;
    },

    async delete(collection, idKey, idVal) {
      const all = loadCollection(collection);
      const nextList = all.filter((item) => item[idKey] !== idVal);
      saveCollection(collection, nextList);
      return true;
    },

    // Recalculates user's average rating whenever a new review is submitted
    async updateUserRating(userId) {
      const ratings = loadCollection("ratings").filter((r) => r.ratedUserId === userId);
      const totalRatings = ratings.length;
      const averageRating =
        totalRatings > 0
          ? Number((ratings.reduce((sum, r) => sum + Number(r.stars), 0) / totalRatings).toFixed(1))
          : 0;

      await this.update("users", "uid", userId, { averageRating, totalRatings });
      return { averageRating, totalRatings };
    },

    // Reset Demo Data helper
    resetDemoData() {
      localStorage.removeItem(STORAGE_PREFIX + "seeded");
      localStorage.removeItem(STORAGE_PREFIX + "users");
      localStorage.removeItem(STORAGE_PREFIX + "skills");
      localStorage.removeItem(STORAGE_PREFIX + "requests");
      localStorage.removeItem(STORAGE_PREFIX + "sessions");
      localStorage.removeItem(STORAGE_PREFIX + "ratings");
      localStorage.removeItem(STORAGE_PREFIX + "messages");
      localStorage.removeItem(STORAGE_PREFIX + "reports");
      initDatabase();
      window.location.reload();
    }
  };

  // Helper formatting utilities
  window.SkillSwapUtils = {
    escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    renderStars(rating = 0, count) {
      const r = Math.min(5, Math.max(0, Number(rating) || 0));
      const full = Math.floor(r);
      const half = r - full >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      const starString = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
      const countLabel = count !== undefined ? ` <small class="text-muted">(${count})</small>` : "";
      return `<span class="star-rating-display" title="${r.toFixed(1)} out of 5 stars">${starString}</span> <strong class="ms-1">${r > 0 ? r.toFixed(1) : "New"}</strong>${countLabel}`;
    },

    renderBadge(status) {
      const map = {
        pending: '<span class="badge badge-status-pending">⏳ Pending</span>',
        accepted: '<span class="badge badge-status-accepted">✓ Accepted</span>',
        declined: '<span class="badge badge-status-declined">✕ Declined</span>',
        completed: '<span class="badge badge-status-completed">★ Completed</span>',
        scheduled: '<span class="badge badge-status-scheduled">📅 Scheduled</span>',
        cancelled: '<span class="badge bg-secondary">Cancelled</span>'
      };
      return map[status] || `<span class="badge bg-light text-dark">${status}</span>`;
    },

    renderSkillLevel(level) {
      const map = {
        Beginner: '<span class="badge badge-beginner">Beginner</span>',
        Intermediate: '<span class="badge badge-intermediate">Intermediate</span>',
        Advanced: '<span class="badge badge-advanced">Advanced</span>'
      };
      return map[level] || `<span class="badge bg-secondary">${level}</span>`;
    },

    showToast(message, type = "success") {
      let container = document.querySelector(".toast-container-custom");
      if (!container) {
        container = document.createElement("div");
        container.className = "toast-container-custom";
        document.body.appendChild(container);
      }
      const toast = document.createElement("div");
      toast.className = `toast-custom p-3 ${type}`;
      toast.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div><strong>${type === "danger" ? "Error" : type === "warning" ? "Notice" : "Success"}</strong><div class="small">${message}</div></div>
          <button type="button" class="btn-close ms-2" aria-label="Close"></button>
        </div>
      `;
      toast.querySelector(".btn-close").onclick = () => toast.remove();
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    formatDate(timestampOrDate) {
      if (!timestampOrDate) return "";
      const d = new Date(timestampOrDate);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      return timeStr;
    }
  };
})(window);
