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
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "placeholder",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "placeholder.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "placeholder",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "placeholder.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "1:000000000000:web:placeholder",
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
