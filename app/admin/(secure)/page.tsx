import ScheduleView from "@/components/admin/ScheduleView";
import { istNow } from "@/lib/clinic";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return <ScheduleView today={istNow().date} />;
}
