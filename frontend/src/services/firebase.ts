import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];
const missingFields = requiredFields.filter(
  (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
);

if (missingFields.length > 0) {
  console.error(
    "❌ Missing Firebase configuration fields:",
    missingFields.join(", ")
  );
  console.error("Please check your .env file for VITE_FIREBASE_* variables");
} else {
  console.log(
    "✅ Firebase config loaded for project:",
    firebaseConfig.projectId
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log(
  "🔥 Firebase initialized with auth domain:",
  firebaseConfig.authDomain
);
