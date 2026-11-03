import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { adminBase, getStaff } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/** Everything inside this folder needs a valid staff session. The check runs on the server. */
export default async function SecureLayout({ children }: { children: React.ReactNode }) {
  const base = adminBase();
  if (!isFirebaseConfigured()) redirect(`${base}/login`);
  const staff = await getStaff();
  if (!staff) redirect(`${base}/login`);
  return (
    <AdminShell base={base} username={staff.username}>
      {children}
    </AdminShell>
  );
}
