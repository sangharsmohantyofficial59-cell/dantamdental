import { NextResponse } from "next/server";
import { NotFoundError, RuleError, SlotTakenError } from "./data";
import { getStaff, sameOrigin, type StaffUser } from "./auth";
import { isFirebaseConfigured } from "./firebase-admin";

const NO_STORE = { "Cache-Control": "no-store" };

export function ok(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

/** Turns known errors into clean responses and hides everything else. */
export function handleError(err: unknown) {
  if (err instanceof SlotTakenError) return fail(err.message, 409);
  if (err instanceof RuleError) return fail(err.message, 400);
  if (err instanceof NotFoundError) return fail(err.message, 404);
  console.error("API error:", err);
  return fail("Something went wrong. Please try again.", 500);
}

export function notConfigured() {
  return fail("The booking system is not set up yet.", 503);
}

/** Every staff-only route starts here. Returns the staff user or a ready-made error response. */
export async function requireStaff(
  req: Request,
  opts: { mutating: boolean },
): Promise<{ staff: StaffUser } | { response: NextResponse }> {
  if (!isFirebaseConfigured()) return { response: notConfigured() };
  if (opts.mutating && !sameOrigin(req)) return { response: fail("Request blocked.", 403) };
  const staff = await getStaff();
  if (!staff) return { response: fail("Please sign in.", 401) };
  return { staff };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
