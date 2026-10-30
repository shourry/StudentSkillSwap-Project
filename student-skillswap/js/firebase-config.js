/**
 * Student SkillSwap - Firebase Configuration & Setup
 * 
 * Instructions to connect live Firebase:
 * 1. Go to https://console.firebase.google.com
 * 2. Create project 'student-skillswap'
 * 3. Enable Authentication (Email/Password)
 * 4. Create Cloud Firestore in Test Mode
 * 5. Enable Storage for avatars
 * 6. Replace the placeholder credentials below with your web app credentials.
 */

// Production Firebase Configuration Placeholder:
export const firebaseConfig = {
  apiKey: "AIzaSyBIST-SKILLSWAP-DEMO-KEY-2025",
  authDomain: "student-skillswap-bist.firebaseapp.com",
  projectId: "student-skillswap-bist",
  storageBucket: "student-skillswap-bist.appspot.com",
  messagingSenderId: "103221045088",
  appId: "1:103221045088:web:bistcsebhopal2025"
};

/**
 * Note: Since backend execution is escaped in this frontend deployment mode,
 * the platform seamlessly runs via our high-fidelity local BaaS engine (`js/db.js` + `js/auth.js`)
 * requiring zero backend servers, zero API keys, and zero external costs, while mirroring
 * the exact same Firestore collections: users, skills, requests, sessions, ratings, messages!
 */
export const isLiveFirebaseConfigured = false;
