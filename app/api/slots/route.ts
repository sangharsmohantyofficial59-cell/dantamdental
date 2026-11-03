import { NextRequest } from "next/server";
import { availableTimes, isValidDate } from "@/lib/clinic";
import { takenTimes } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase-admin";
import { fail, handleError, notConfigured, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public. Returns only the free times for a date. No names, no phone numbers. */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDate(date)) return fail("Choose a valid date.", 400);
  if (!isFirebaseConfigured()) return notConfigured();
  try {
    const taken = await takenTimes(date);
    return ok({ date, available: availableTimes(date, taken) });
  } catch (err) {
    return handleError(err);
  }
}
