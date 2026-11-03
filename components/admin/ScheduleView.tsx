"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SERVICES, TIMES, addDays, formatDateShort, formatTime12, isSunday, istNow, serviceName, servicePrice,
  type Action,
} from "@/lib/clinic";
import { api } from "@/lib/api";
import type { AppointmentView } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  "checked-in": "Waiting",
  "in-chair": "In chair",
  done: "Done",
  "no-show": "No show",
};

const ACTIONS: Record<string, { action: Action; label: string; primary?: boolean }[]> = {
  booked: [
    { action: "checkin", label: "Check in", primary: true },
    { action: "noshow", label: "No show" },
    { action: "cancel", label: "Cancel" },
  ],
  "checked-in": [
    { action: "start", label: "Start treatment", primary: true },
    { action: "cancel", label: "Cancel" },
  ],
  "in-chair": [{ action: "done", label: "Mark done", primary: true }],
};

export default function ScheduleView({ today }: { today: string }) {
  const [date, setDate] = useState(today);
  const [appts, setAppts] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [formTime, setFormTime] = useState<string | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const r = await api<{ appointments: AppointmentView[] }>(`/api/admin/appointments?date=${date}`);
        setAppts(r.appointments);
      } catch (e) {
        if ((e as { status?: number }).status === 401) window.location.reload();
        else setMessage((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [date],
  );

  useEffect(() => {
    load();
    // Pick up new online bookings without a refresh.
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);

  const byTime = useMemo(() => new Map(appts.map((a) => [a.time, a])), [appts]);
  const closed = isSunday(date);
  const now = istNow();

  async function act(a: AppointmentView, action: Action | "seen") {
    try {
      await api(`/api/admin/appointments/${a.id}`, { method: "PATCH", json: { action } });
      await load(true);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  const count = (s: string) => appts.filter((a) => a.status === s).length;
  const billed = appts.filter((a) => a.status === "done").reduce((n, a) => n + servicePrice(a.service), 0);
  const fresh = appts.filter((a) => a.isNew);
  const free = closed ? 0 : TIMES.length - appts.length;

  return (
    <div>
      <div className="fd-tools">
        <button type="button" className="btn sm" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">&larr;</button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Schedule date" />
        <button type="button" className="btn sm" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">&rarr;</button>
        {date !== today && <button type="button" className="btn sm" onClick={() => setDate(today)}>Today</button>}
        <strong style={{ marginLeft: 6 }}>{formatDateShort(date)}</strong>
        {fresh.length > 0 && <span className="badge">{fresh.length} new online booking{fresh.length === 1 ? "" : "s"}</span>}
      </div>

      <div className="stats">
        {[
          [appts.length, "Appointments"],
          [count("checked-in"), "Waiting"],
          [count("in-chair"), "In chair"],
          [count("done"), "Done"],
          [count("no-show"), "No shows"],
          [free, "Free slots"],
          [`₹${billed.toLocaleString("en-IN")}`, "Billed (list price)"],
        ].map(([v, l]) => (
          <div className="stat" key={String(l)}>
            <b>{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <div className="fd-grid">
        <div className="list" aria-busy={loading}>
          {closed && <div className="lunch" style={{ padding: 22 }}>Clinic closed on Sundays. Use the arrows to pick a working day.</div>}
          {!closed &&
            TIMES.map((t) => {
              const a = byTime.get(t);
              const lunch = t === "14:30" ? <div className="lunch">Lunch break, 1:30 PM to 2:30 PM</div> : null;
              if (a) {
                return (
                  <div key={t}>
                    {lunch}
                    <div className={`slot${a.isNew ? " new" : ""}`}>
                      <div className="t">{formatTime12(t)}</div>
                      <div className="who">
                        <b>{a.patient.name}</b>
                        <span className={`pill ${a.status}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                        <span className={`src${a.source === "Website" ? " web" : ""}`}>{a.source}</span>
                        {a.isNew && <span className="pill fresh">New online booking</span>}
                        <small>{serviceName(a.service)} &middot; {a.patient.phone}</small>
                      </div>
                      <div className="acts">
                        {a.isNew && <button type="button" className="btn sm" onClick={() => act(a, "seen")}>Mark as seen</button>}
                        {(ACTIONS[a.status] ?? []).map((x) => (
                          <button key={x.action} type="button" className={`btn sm${x.primary ? " primary" : ""}`} onClick={() => act(a, x.action)}>
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              const past = date < now.date || (date === now.date && t <= now.time);
              return (
                <div key={t}>
                  {lunch}
                  <div className={`slot free${formTime === t ? " sel" : ""}`}>
                    <div className="t">{formatTime12(t)}</div>
                    <div className="who">{past ? "Passed" : "Free"}</div>
                    <div className="acts">
                      <button type="button" className="btn sm" onClick={() => setFormTime(t)}>Book</button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="panel side">
          {formTime ? (
            <WalkInForm
              date={date}
              time={formTime}
              onClose={() => setFormTime(null)}
              onSaved={async (name) => {
                setFormTime(null);
                setMessage(`Booking saved for ${name}.`);
                await load(true);
              }}
            />
          ) : (
            <>
              <h2>How this works</h2>
              <p className="muted">
                Tap Book on a free time to add a walk-in or phone booking. A taken time cannot be booked twice, here or on
                the website. This page refreshes every few seconds, so online bookings appear on their own.
              </p>
            </>
          )}
        </div>
      </div>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}

function WalkInForm({
  date, time, onClose, onSaved,
}: {
  date: string;
  time: string;
  onClose: () => void;
  onSaved: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Walk-in");
  const [service, setService] = useState<string>(SERVICES[0].id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/admin/appointments", { method: "POST", json: { name, phone, service, date, time, source } });
      await onSaved(name.trim());
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2>New booking, {formatTime12(time)}</h2>
      <p className="muted" style={{ marginBottom: 14 }}>{formatDateShort(date)}. For walk-ins and phone calls.</p>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="w-name">Patient name</label>
          <input id="w-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="w-phone">Mobile</label>
          <input id="w-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />
        </div>
        <div className="field">
          <label htmlFor="w-source">Source</label>
          <select id="w-source" value={source} onChange={(e) => setSource(e.target.value)}>
            <option>Walk-in</option>
            <option>Phone</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="w-service">Treatment</label>
          <select id="w-service" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="err" role="alert">{error}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save booking"}</button>
        <button className="btn" type="button" onClick={onClose}>Close</button>
      </div>
    </form>
  );
}
