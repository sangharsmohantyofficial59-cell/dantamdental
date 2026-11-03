"use client";

import { useEffect, useState } from "react";
import { addDays, formatDateShort, formatTime12, istNow } from "@/lib/clinic";
import { api } from "@/lib/api";

type Pick = { date: string; time: string };

/** Shows the next few open times, read live from the booking system. */
export default function NextSlots() {
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Pick[] = [];
      const start = istNow().date;
      try {
        for (let i = 0; i < 7 && out.length < 6; i++) {
          const date = addDays(start, i);
          const r = await api<{ available: string[] }>(`/api/slots?date=${date}`);
          for (const time of r.available) if (out.length < 6) out.push({ date, time });
        }
        if (!cancelled) setPicks(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function choose(p: Pick) {
    window.dispatchEvent(new CustomEvent("pick-slot", { detail: p }));
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const today = istNow().date;
  return (
    <aside className="avail" aria-label="Next available appointments">
      <h2>Next open slots</h2>
      <small>Live from the clinic calendar. Tap a time to start booking.</small>
      <div className="chips">
        {failed && <span className="muted">Call the clinic to book.</span>}
        {!failed && picks === null && <span className="muted">Loading...</span>}
        {picks && picks.length === 0 && <span className="muted">No open slots this week.</span>}
        {picks?.map((p) => (
          <button key={p.date + p.time} type="button" className="chip" onClick={() => choose(p)}>
            {p.date === today ? "Today" : formatDateShort(p.date)}, {formatTime12(p.time)}
          </button>
        ))}
      </div>
    </aside>
  );
}
