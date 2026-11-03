import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sameOrigin } from "@/lib/auth";
import { adminAuth, isFirebaseConfigured } from "@/lib/firebase-admin";
import { fail, notConfigured, readJson } from "@/lib/http";
import { allow } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/** Exchanges a fresh Firebase sign-in for a server-side session cookie. */
export async function POST(req: NextRequest) {
  if (!isFirebaseConfigured()) return notConfigured();
  if (!sameOrigin(req)) return fail("Request blocked.", 403);

  const body = (await readJson(req)) as { idToken?: unknown } | null;
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  if (!idToken) return fail("Sign in again.", 400);

  try {
    if (!(await allow(req, "login", 20))) return fail("Too many attempts. Try again later.", 429);

    const decoded = await adminAuth().verifyIdToken(idToken, true);
    // Only accept a sign-in that just happened, and only for staff accounts.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) return fail("Sign in again.", 401);
    if (decoded.staff !== true) return fail("This account is not allowed here.", 403);

    const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(SESSION_COOKIE, cookie, { ...cookieBase, maxAge: SESSION_MAX_AGE_SECONDS });
    return res;
  } catch {
    return fail("Sign in failed. Check the username and password.", 401);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request blocked.", 403);
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
}
