import PatientsView from "@/components/admin/PatientsView";
import { adminBase } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Patients" };

export default function PatientsPage() {
  return <PatientsView base={adminBase()} />;
}
