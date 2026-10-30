# 🔄 Student SkillSwap — BIST Bhopal

> **Peer-to-Peer Skill Learning & Campus Knowledge Sharing Platform**  
> *Designed exclusively for students of Bansal Institute of Science & Technology (BIST), Bhopal.*

---

## 🎯 What We Built

**Student SkillSwap** is a campus marketplace where every student is both a learner and a teacher. Instead of spending money on expensive third-party online courses or dealing with chaotic WhatsApp groups, BIST students can connect directly with fellow batchmates and seniors to learn coding, UI/UX design, public speaking, academic subjects, and interview preparation.

---

## 🧩 Problems Solved

| # | Problem Faced by BIST Students | How Student SkillSwap Solves It |
|---|---|---|
| **1** | Students depend solely on classroom lectures or paid courses | **100% Free peer-to-peer learning** directly within the college campus. |
| **2** | Students have useful skills (coding, design) but no venue to share | **Structured student skill profiles** detailing what they teach and learn. |
| **3** | Finding the right peer mentor on campus is difficult | **Automated multi-criteria matching algorithm** ranks mentors by fit and ratings. |
| **4** | Students feel awkward or hesitant to directly ask peers for help | **Formal learning request workflow** with clear topics, modes, and notes. |
| **5** | No centralized directory for student skill exchanges | **Single unified web platform** with search, profiles, and scheduled slots. |
| **6** | WhatsApp & Telegram groups get chaotic and cluttered | **Dedicated 1-on-1 real-time chat, session tracking, and star reviews**. |

---

## 👥 User Roles

- **Skill Provider:** A student who offers to teach a specific skill (e.g., Python, Figma, DSA).
- **Skill Seeker:** A student looking to learn a specific skill.
- **Dual Role:** A student who teaches one subject while learning another (e.g., teaching Python in exchange for Graphic Design lessons).
- **Campus Administrator:** Monitors users, analyzes trending skills, and resolves safety/moderation reports.

---

## 📋 Complete Feature List (10 Modules)

### 1. Student Registration & Login (`register.html`, `login.html`)
- Signup with Name, College Email (`@bist.ac.in`), Enrollment Number, Department, Year, Semester, and Password.
- Client session persistence with password reset simulation.
- **Quick Demo Login Bar:** 1-click test buttons for pre-seeded student accounts (Shoury, Yash, Vansh, Priya, Admin).

### 2. Student Profile Management (`profile.html`, `view-profile.html`)
- Profile photo upload (local file reader preview or avatar preset picker).
- View & edit Department, Year, Semester, Enrollment, Availability hours, and Preferred Learning Mode.
- Live star rating calculations and reviews history.

### 3. Skill Listing Module (`skills.html`)
- Add skills you can **teach** or skills you want to **learn**.
- Select proficiency level: **Beginner**, **Intermediate**, or **Advanced**.
- Edit or delete listed skills with modal dialogs.

### 4. Skill Search Module (`search.html`)
- Keyword search across skill names, teacher names, and topic descriptions.
- Filter by **Department** (CSE, IT, ECE, EE, ME, Civil), **Level**, **Mode**, and **Minimum Rating**.

### 5. Automated Student Matching Module (`js/search.js`)
- **Multi-Factor Ranking Algorithm:**
  1. Keyword relevance match.
  2. Average star rating & total review reliability weight.
  3. Skill proficiency depth (Advanced > Intermediate > Beginner).
  4. Department affinity (bonus points for same department).
  5. **Mutual SkillSwap Compatibility Bonus:** High-priority match badge when Teacher wants to learn what Seeker teaches!

### 6. Learning Request Module (`requests.html`)
- Send a learning request from mentor profiles with preferred mode and message.
- Tabbed management for **Received Requests** and **Sent Requests**.
- Status lifecycle: `Pending` → `Accepted` / `Declined` → `Completed`.

### 7. Session Scheduling Module (`schedule.html`)
- Schedule 1-on-1 sessions for accepted matches: Date, Time, Duration, Mode, and Venue / Meeting Link (Google Meet or Nursing Building Library Area).
- Track upcoming vs. completed sessions.
- Mark session as "Completed" with direct transition to peer rating.

### 8. Chat / Communication Module (`chat.html`)
- 1-on-1 real-time style messaging between matched students.
- Speech bubble conversation threads with timestamps.
- Multi-tab storage sync simulation.

### 9. Rating & Feedback Module (`feedback.html`)
- Interactive 5-star rating selector and written feedback review.
- Automated update of mentor's average rating and total ratings count.

### 10. Admin Management Module (`admin.html`)
- Protected admin dashboard displaying total students, active sessions, and completed exchanges.
- Popular skills breakdown & campus demand analytics.
- Student table with search, department filtering, and account moderation.
- Content safety & moderation reports resolution.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Bootstrap 5.3.3, Google Fonts (`Inter`, `Poppins`).
- **Color Scheme:**
  - Blue Accent: `#0F6EC6`
  - Teal Header / Nav: `#04617B`
  - Red Accent: `#CC0000`
- **Client BaaS Layer (`js/db.js`):** High-fidelity simulated Cloud Firestore / BaaS engine storing collections (`users`, `skills`, `requests`, `sessions`, `ratings`, `messages`, `reports`) in browser `localStorage`.
- **Zero Backend Dependencies:** No Node.js server, Python backend, or API keys required to test or present!
- **Firebase Ready:** Plug-and-play config file provided in `js/firebase-config.js` for optional live cloud deployment.

---

## 📁 File Structure

```
student-skillswap/
├── index.html                  # Landing page with hero & campus overview
├── register.html               # Student registration form
├── login.html                  # Login form with 1-click demo logins
├── dashboard.html              # Main student dashboard with metrics & sessions
├── profile.html                # Edit profile details & upload photo
├── skills.html                 # Add/manage teaching and learning skills
├── search.html                 # Search mentors with intelligent matching
├── view-profile.html           # Public student profile view & request modal
├── requests.html               # Sent & received requests management
├── schedule.html               # Session scheduler & completion tracking
├── chat.html                   # 1-on-1 peer messaging interface
├── feedback.html               # 5-star rating and written review submission
├── admin.html                  # Admin analytics and user moderation
│
├── css/
│   └── style.css               # BIST Bhopal custom stylesheet
│
├── js/
│   ├── firebase-config.js      # Firebase config template & documentation
│   ├── db.js                   # Simulated BaaS engine & pre-seeded student data
│   ├── auth.js                 # Authentication, session guard & dynamic navbar
│   ├── dashboard.js            # Dashboard data loader
│   ├── profile.js              # Profile editor & avatar management
│   ├── skills.js               # Skill CRUD operations
│   ├── search.js               # Smart matching algorithm & filters
│   ├── requests.js             # Learning requests workflow
│   ├── sessions.js             # Session scheduling logic
│   ├── chat.js                 # Real-time peer chat handler
│   ├── feedback.js             # Star rating & profile rating updater
│   └── admin.js                # Admin analytics & moderation
│
└── README.md                   # Complete documentation
```

---

## 🚀 How to Run

1. Simply double-click **`index.html`** to open it in Google Chrome, Microsoft Edge, or any modern web browser.
2. Alternatively, serve via VS Code **Live Server** extension or run:
   ```bash
   # Python built-in server:
   python -m http.server 8000
   ```
   and visit `http://localhost:8000`.

---

## 🔑 Pre-Seeded Demo Accounts for Testing

| Student Name | Email | Password | Role / Department | Skills |
|---|---|---|---|---|
| **Shoury Thakur** | `shoury@bist.ac.in` | `password123` | CSE, 3rd Year | Teaches: Python (Adv), DSA (Adv) |
| **Yash Ghosh** | `yash@bist.ac.in` | `password123` | CSE, 3rd Year | Teaches: Python (Adv), ML (Inter) |
| **Vansh Vishway** | `vansh@bist.ac.in` | `password123` | IT, 3rd Year | Teaches: Graphic Design (Adv), Figma |
| **Sourabh Rajak** | `sourabh@bist.ac.in` | `password123` | ECE, 2nd Year | Teaches: Public Speaking, Arduino |
| **Priya Sharma** | `priya@bist.ac.in` | `password123` | CSE, 4th Year | Teaches: Java, Interview Prep |
| **Administrator** | `admin@bist.ac.in` | `admin123` | Admin Cell | Platform Moderation & Analytics |

*(Tip: On `login.html`, click any of the 1-click demo buttons to sign in instantly!)*

---

## 🏛️ Bansal Institute of Science & Technology (BIST), Bhopal
*Developed for BIST engineering students to foster peer learning, collaborative coding, and campus leadership.*
