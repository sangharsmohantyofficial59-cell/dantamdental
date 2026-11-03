import { NextRequest } from "next/server";
import { listPatients } from "@/lib/data";
import { handleError, ok, requireStaff } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, { mutating: false });
  if ("response" in auth) return auth.response;
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
    return ok({ patients: await listPatients(q) });
  } catch (err) {
    return handleError(err);
  }
}
