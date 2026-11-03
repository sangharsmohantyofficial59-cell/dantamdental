import { NextRequest } from "next/server";
import { createBooking } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase-admin";
import { sameOrigin } from "@/lib/auth";
import { fail, handleError, notConfigured, ok, readJson } from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { firstError, publicBookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Public booking. The visitor can only create one appointment. They can never read or change anything. */
export async function POST(req: NextRequest) {
  if (!isFirebaseConfigured()) return notConfigured();
  if (!sameOrigin(req)) return fail("Request blocked.", 403);

  const parsed = publicBookingSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(firstError(parsed.error), 400);
  const { website, ...input } = parsed.data;

  // Bots fill the hidden field. Pretend it worked and store nothing.
  if (website) return ok({ reference: "DDC-000000" });

  try {
    if (!(await allow(req, "book", 6))) {
      return fail("Too many requests. Please wait an hour or call the clinic.", 429);
    }
    const { id } = await createBooking(input, { source: "Website", fromStaff: false });
    return ok({ reference: `DDC-${id.slice(-6).toUpperCase()}` }, 201);
  } catch (err) {
    return handleError(err);
  }
}
