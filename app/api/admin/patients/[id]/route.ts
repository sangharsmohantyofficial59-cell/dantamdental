import { NextRequest } from "next/server";
import { getPatient, updatePatient } from "@/lib/data";
import { fail, handleError, ok, readJson, requireStaff } from "@/lib/http";
import { firstError, patientUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const validId = (id: string) => /^[A-Za-z0-9]{10,40}$/.test(id);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, { mutating: false });
  if ("response" in auth) return auth.response;
  if (!validId(params.id)) return fail("Patient not found.", 404);
  try {
    return ok({ patient: await getPatient(params.id) });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, { mutating: true });
  if ("response" in auth) return auth.response;
  if (!validId(params.id)) return fail("Patient not found.", 404);
  const parsed = patientUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(firstError(parsed.error), 400);
  try {
    await updatePatient(params.id, parsed.data);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
