import { NextRequest } from "next/server";
import { applyAction } from "@/lib/data";
import { fail, handleError, ok, readJson, requireStaff } from "@/lib/http";
import { actionSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, { mutating: true });
  if ("response" in auth) return auth.response;
  if (!/^[A-Za-z0-9]{10,40}$/.test(params.id)) return fail("Appointment not found.", 404);
  const parsed = actionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(firstError(parsed.error), 400);
  try {
    await applyAction(params.id, parsed.data.action);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
