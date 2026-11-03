import { cookies, headers } from "next/headers";
import { adminAuth, isFirebaseConfigured } from "./firebase-admin";

export const SESSION_COOKIE = "dc_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours, then staff sign in again

export type StaffUser = { uid: string; username: string };

/**
 * Returns the signed-in staff member, or null.
 * A person counts as staff only if their account carries the `staff` claim, which
 * only the create-staff script (using the server key) can set. Someone who signs up
 * on their own through Firebase never gets it.
 */
export async function getStaff(): Promise<StaffUser | null> {
  if (!isFirebaseConfigured()) return null;
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    if (decoded.staff !== true) return null;
    return { uid: decoded.uid, username: String(decoded.email ?? "").split("@")[0] };
  } catch {
    return null;
  }
}

/** "path" when admin is served at /admin on the main domain, "host" on the admin subdomain. */
export function adminBase(): string {
  return headers().get("x-admin-mode") === "path" ? "/admin" : "";
}

/** Blocks cross-site form posts. Mutating admin and booking routes call this. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
