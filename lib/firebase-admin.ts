import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  );
}

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Fill in .env.local (see README).");
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel and .env files store the key with literal \n characters.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
    }),
  });
}

export function adminDb() {
  return getFirestore(app());
}

export function adminAuth() {
  return getAuth(app());
}
