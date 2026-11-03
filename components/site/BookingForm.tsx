"use client";

import { useCallback, useEffect, useState } from "react";
import { SERVICES, formatDateShort, formatTime12, istNow, addDays, BOOKING_WINDOW_DAYS, serviceName } from "@/lib/clinic";
import { api } from "@/lib/api";

type Done = { reference: string; name: string; service: string; date: string; time: string };

export default function BookingForm() {
  const today = istNow().date;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState<string>(SERVICES[0].id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [trap, setTrap] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const loadSlots = useCallback(async (d: string) => {
    setSlots(null);
    setSlotsError("");
    try {
      const r = await api<{ available: string[] }>(`/api/slots?date=${encodeURIComponent(d)}`);
      setSlots(r.available);
    } catch (e) {
      setSlots([]);
      setSlotsError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (date) loadSlots(date);
  }, [date, loadSlots]);

  // Let the "next open slots" card on the page pre-fill this form.
  useEffect(() => {
    const onPick = (e: Event) => {
      const { date: d, time: t } = (e as CustomEvent<{ date: string; time: string }>).detail;
      setDate(d);
      setTime(t);
    };
    window.addEventListener("pick-slot", onPick);
    return () => window.removeEventListener("pick-slot", onPick);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(null);
    if (!date) return setError("Choose a date.");
    if (!time) return setError("Choose a time.");
    setBusy(true);
    try {
      const r = await api<{ reference: string }>("/api/book", {
        method: "POST",
        json: { name, phone, service, date, time, website: trap },
      });
      setDone({ reference: r.reference, name: name.trim(), service, date, time });
      setTime("");
      loadSlots(date);
    } catch (err) {
      setError((err as Error).message);
      if ((err as { status?: number }).status === 409) {
        setTime("");
        loadSlots(date);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="bk-name">Full name</label>
          <input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="bk-phone">Mobile number</label>
          <input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" maxLength={20} />
        </div>
        <div className="field">
          <label htmlFor="bk-service">Treatment</label>
          <select id="bk-service" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="bk-date">Date</label>
          <input
            id="bk-date"
            type="date"
            value={date}
            min={today}
            max={addDays(today, BOOKING_WINDOW_DAYS)}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
          />
        </div>
      </div>

      {/* Hidden trap field. People never see it. Bots fill it in. */}
      <div className="trap" aria-hidden="true">
        <label htmlFor="bk-website">Website</label>
        <input id="bk-website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <label id="bk-slots-label">Available times</label>
        <div className="chips" role="group" aria-labelledby="bk-slots-label">
          {!date && <span className="muted">Pick a date to see times.</span>}
          {date && slots === null && <span className="muted">Loading times...</span>}
          {date && slots && slots.length === 0 && (
            <span className="muted">{slotsError || "No free times on this day. Please choose another date."}</span>
          )}
          {slots?.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={time === t} onClick={() => setTime(t)}>
              {formatTime12(t)}
            </button>
          ))}
        </div>
      </div>

      <div className="err" role="alert">
        {error}
      </div>
      <button className="btn primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
        {busy ? "Booking..." : "Confirm appointment"}
      </button>

      {done && (
        <div className="confirm" role="status">
          Appointment confirmed, {done.name}.
          <div>
            {serviceName(done.service)} on {formatDateShort(done.date)} at {formatTime12(done.time)}. Reference {done.reference}.
            Please arrive 10 minutes early.
          </div>
        </div>
      )}
    </form>
  );
}
