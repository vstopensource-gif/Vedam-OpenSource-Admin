// Firebase SDK (ESM via CDN) - compatible with plain index.html using type="module"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { 
	getAuth,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your web app's Firebase configuration
// These values are injected at build time from environment variables
// For local development, create a .env file with VITE_ prefix
// Build script will replace these placeholders with actual values
const firebaseConfig = {
	apiKey: "VITE_FIREBASE_API_KEY",
	authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
	projectId: "VITE_FIREBASE_PROJECT_ID",
	storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
	messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
	appId: "VITE_FIREBASE_APP_ID",
	measurementId: "VITE_FIREBASE_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (best-effort; may be unavailable in some environments)
let analytics = null;
try {
	analytics = getAnalytics(app);
} catch (e) {
	// Analytics not supported (e.g., non-HTTPS or unsupported environment)
}

// Initialize core services
const auth = getAuth(app);
const db = getFirestore(app);

// Export instances and commonly used functions for the rest of the app
export {
	auth,
	db,
	analytics,
	// Auth
	signInWithEmailAndPassword,
	onAuthStateChanged,
	signOut,
	// Firestore
	collection,
	getDocs,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	Timestamp
};
