import { NextRequest } from "next/server";
import { isValidDate } from "@/lib/clinic";
import { createBooking, listAppointments } from "@/lib/data";
import { fail, handleError, ok, readJson, requireStaff } from "@/lib/http";
import { firstError, staffBookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, { mutating: false });
  if ("response" in auth) return auth.response;
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDate(date)) return fail("Choose a valid date.", 400);
  try {
    return ok({ appointments: await listAppointments(date) });
  } catch (err) {
    return handleError(err);
  }
}

/** Walk-in or phone booking by front desk staff. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, { mutating: true });
  if ("response" in auth) return auth.response;
  const parsed = staffBookingSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(firstError(parsed.error), 400);
  const { source, ...input } = parsed.data;
  try {
    const { id } = await createBooking(input, { source, fromStaff: true });
    return ok({ id }, 201);
  } catch (err) {
    return handleError(err);
  }
}
