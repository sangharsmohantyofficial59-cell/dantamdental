import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { adminBase, getStaff } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff sign in" };

export default async function LoginPage() {
  const base = adminBase();
  if (!isFirebaseConfigured()) {
    return (
      <main className="wrap">
        <div className="panel setup">
          <h1 style={{ fontSize: "1.6rem" }}>Setup needed</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Firebase is not connected yet. Fill in <code>.env.local</code> (or the Vercel environment variables), then
            restart. The README lists each step.
          </p>
        </div>
      </main>
    );
  }
  if (await getStaff()) redirect(base || "/");
  return <LoginForm base={base} />;
}
