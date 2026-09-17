// src/lib/firebase.ts
// Firebase client-side initialization — safe for Next.js SSR

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "AIzaSyCTa-D5heCQQfyj9b48hsuy9FBcz3lfINk",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "cable-tv-de9e5.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "cable-tv-de9e5",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "cable-tv-de9e5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "626195841882",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:626195841882:web:9dcce486f346f6c9cc2963",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     || "G-9ZHD2VYWP6",
};

// Singleton — safe to call on server (won't make network requests at init)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let firestoreDb;
if (typeof window !== "undefined") {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    firestoreDb = getFirestore(app);
  }
} else {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// Auth is only needed client-side — import lazily to avoid SSR errors
export function getFirebaseAuth() {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used on the client side.");
  }
  const { getAuth } = require("firebase/auth");
  return getAuth(app);
}

export default app;
