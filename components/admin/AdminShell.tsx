"use client";

import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminShell({
  base,
  username,
  children,
}: {
  base: string;
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onPatients = pathname.includes("/patients");

  async function logout() {
    try {
      await api("/api/admin/session", { method: "DELETE" });
    } finally {
      window.location.href = `${base}/login`;
    }
  }

  return (
    <>
      <div className="bar">
        <div className="wrap">
          <span className="title">Dantam Front Desk</span>
          <nav className="seg" aria-label="Front desk sections">
            <a href={base || "/"} aria-current={onPatients ? undefined : "page"}>Schedule</a>
            <a href={`${base}/patients`} aria-current={onPatients ? "page" : undefined}>Patients</a>
          </nav>
          <span className="who">Signed in as {username}</span>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </div>
      <main className="wrap" style={{ paddingTop: 8 }}>{children}</main>
    </>
  );
}
