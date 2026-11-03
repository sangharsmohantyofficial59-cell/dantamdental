"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateShort, formatTime12, serviceName } from "@/lib/clinic";
import { api } from "@/lib/api";
import type { PatientDetail, PatientView } from "@/lib/types";

export default function PatientsView({ base }: { base: string }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<PatientView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait a moment after typing so the server is not asked on every key.
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api<{ patients: PatientView[] }>(`/api/admin/patients?q=${encodeURIComponent(q)}`);
        setList(r.patients);
        setError("");
      } catch (e) {
        if ((e as { status?: number }).status === 401) window.location.href = `${base}/login`;
        else setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, base]);

  return (
    <div>
      <div className="fd-tools">
        <div className="field" style={{ flex: "1 1 240px", maxWidth: 420 }}>
          <label htmlFor="pt-q">Search patients</label>
          <input id="pt-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone number" />
        </div>
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="fd-grid">
        <div className="list" aria-busy={loading}>
          {!loading && list.length === 0 && <div className="lunch" style={{ padding: 18 }}>No patient matches that search.</div>}
          {list.map((p) => (
            <button key={p.id} type="button" className="pt-row" aria-pressed={selected === p.id} onClick={() => setSelected(p.id)}>
              <b>{p.name}</b>
              <small>{p.phone}{p.followUp ? ` · Follow-up: ${formatDateShort(p.followUp)}` : ""}</small>
            </button>
          ))}
        </div>
        <div className="panel side">
          {selected ? <PatientPanel key={selected} id={selected} base={base} /> : (
            <>
              <h2>Patient record</h2>
              <p className="muted">Select a patient to see contact details, visit history, notes and the next follow-up.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientPanel({ id, base }: { id: string; base: string }) {
  const [p, setP] = useState<PatientDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [age, setAge] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ patient: PatientDetail }>(`/api/admin/patients/${id}`);
      setP(r.patient);
      setNotes(r.patient.notes);
      setFollowUp(r.patient.followUp);
      setAge(r.patient.age === null ? "" : String(r.patient.age));
    } catch (e) {
      if ((e as { status?: number }).status === 401) window.location.href = `${base}/login`;
      else setMsg((e as Error).message);
    }
  }, [id, base]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const ageNum = age.trim() === "" ? null : Number(age);
      if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120)) throw new Error("Enter a valid age.");
      await api(`/api/admin/patients/${id}`, { method: "PATCH", json: { notes, followUp, age: ageNum } });
      setMsg("Saved.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!p) return <p className="muted">{msg || "Loading..."}</p>;
  return (
    <div>
      <h2>{p.name}</h2>
      <p className="muted">{p.phone}</p>
      {p.upcoming.length > 0 && (
        <p style={{ marginTop: 8 }}>
          <b>Next:</b> {formatDateShort(p.upcoming[0].date)}, {formatTime12(p.upcoming[0].time)} ({serviceName(p.upcoming[0].service)})
        </p>
      )}
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="pt-age">Age</label>
        <input id="pt-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} maxLength={3} />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="pt-notes">Clinical notes</label>
        <textarea id="pt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="pt-follow">Follow-up date</label>
        <input id="pt-follow" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn primary sm" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
        {msg && <span className="muted" role="status">{msg}</span>}
      </div>
      <h3 style={{ marginTop: 20, fontSize: "1rem" }}>Visit history</h3>
      {p.visits.length === 0 && <p className="muted" style={{ marginTop: 6 }}>No completed visits yet.</p>}
      {p.visits.map((v) => (
        <div className="visit" key={v.id}>
          <b>{serviceName(v.service)}</b> <small>{formatDateShort(v.date)}</small>
        </div>
      ))}
    </div>
  );
}
