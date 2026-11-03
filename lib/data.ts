import { adminDb } from "./firebase-admin";
import {
  MAX_UPCOMING_PER_PHONE,
  checkBookable,
  digits10,
  istNow,
  nextStatus,
  slotId,
  type Action,
  type Status,
} from "./clinic";
import type { AppointmentView, PatientDetail, PatientView, Source, VisitView } from "./types";

export class SlotTakenError extends Error {
  constructor() {
    super("That time was just taken. Please choose another.");
  }
}
export class NotFoundError extends Error {}
export class RuleError extends Error {}

/*
 * Firestore layout (all access goes through these functions on the server):
 *   slots/{date_HHmm}      one document per booked time. The document id is the
 *                           lock: creating it twice fails, so double booking is impossible.
 *   appointments/{id}      who, when, what, status
 *   patients/{id}          contact details, notes, follow-up date
 *   rateLimits/{...}       hourly counters for the public booking form
 */

export async function takenTimes(date: string): Promise<string[]> {
  const snap = await adminDb().collection("slots").where("date", "==", date).get();
  return snap.docs.map((d) => d.data().time as string);
}

type BookingInput = { name: string; phone: string; service: string; date: string; time: string };

export async function createBooking(
  input: BookingInput,
  opts: { source: Source; fromStaff: boolean },
): Promise<{ id: string; patientId: string }> {
  const rule = checkBookable(input.date, input.time, {
    allowPast: opts.fromStaff,
    allowBeyondWindow: opts.fromStaff,
  });
  if (!rule.ok) throw new RuleError(rule.reason);

  const db = adminDb();
  const key = digits10(input.phone);

  if (!opts.fromStaff) {
    // Stop one phone number from holding many future slots.
    const existing = await db.collection("patients").where("phoneKey", "==", key).limit(1).get();
    if (!existing.empty) {
      const today = istNow().date;
      const appts = await db.collection("appointments").where("patientId", "==", existing.docs[0].id).get();
      const upcoming = appts.docs.filter((d) => {
        const a = d.data();
        return a.date >= today && (a.status === "booked" || a.status === "checked-in");
      });
      if (upcoming.length >= MAX_UPCOMING_PER_PHONE) {
        throw new RuleError("This number already has several upcoming visits. Please call the clinic to change them.");
      }
    }
  }

  return db.runTransaction(async (tx) => {
    const slotRef = db.collection("slots").doc(slotId(input.date, input.time));
    const patientQuery = db.collection("patients").where("phoneKey", "==", key).limit(1);
    const [slotSnap, patientSnap] = await Promise.all([tx.get(slotRef), tx.get(patientQuery)]);
    if (slotSnap.exists) throw new SlotTakenError();

    let patientId: string;
    if (patientSnap.empty) {
      const pRef = db.collection("patients").doc();
      patientId = pRef.id;
      tx.set(pRef, {
        name: input.name,
        phone: key,
        phoneKey: key,
        age: null,
        notes: "",
        followUp: "",
        createdAt: Date.now(),
      });
    } else {
      patientId = patientSnap.docs[0].id;
    }

    const apptRef = db.collection("appointments").doc();
    tx.set(slotRef, { date: input.date, time: input.time, appointmentId: apptRef.id });
    tx.set(apptRef, {
      patientId,
      date: input.date,
      time: input.time,
      service: input.service,
      status: "booked",
      source: opts.source,
      isNew: opts.source === "Website",
      createdAt: Date.now(),
    });
    return { id: apptRef.id, patientId };
  });
}

export async function listAppointments(date: string): Promise<AppointmentView[]> {
  const db = adminDb();
  const snap = await db.collection("appointments").where("date", "==", date).get();
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, any>)
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const ids = [...new Set(rows.map((r) => r.patientId as string))];
  const patients = ids.length ? await db.getAll(...ids.map((id) => db.collection("patients").doc(id))) : [];
  const byId = new Map(patients.map((p) => [p.id, p.data() as Record<string, any> | undefined]));
  return rows.map((a) => ({
    id: a.id,
    date: a.date,
    time: a.time,
    service: a.service,
    status: a.status as Status,
    source: a.source as Source,
    isNew: Boolean(a.isNew),
    patient: {
      id: a.patientId,
      name: byId.get(a.patientId)?.name ?? "Unknown",
      phone: byId.get(a.patientId)?.phone ?? "",
    },
  }));
}

export async function applyAction(id: string, action: Action | "seen"): Promise<void> {
  const db = adminDb();
  const ref = db.collection("appointments").doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new NotFoundError("Appointment not found.");
    const a = snap.data() as Record<string, any>;
    if (action === "seen") {
      tx.update(ref, { isNew: false });
      return;
    }
    const next = nextStatus(a.status as Status, action);
    if (!next) throw new RuleError("That step is not available for this appointment.");
    tx.update(ref, { status: next, isNew: false, updatedAt: Date.now() });
    if (next === "cancelled") {
      // Free the time so someone else can book it.
      tx.delete(db.collection("slots").doc(slotId(a.date, a.time)));
    }
  });
}

function toPatient(id: string, d: Record<string, any>): PatientView {
  return {
    id,
    name: d.name ?? "",
    phone: d.phone ?? "",
    age: typeof d.age === "number" ? d.age : null,
    notes: d.notes ?? "",
    followUp: d.followUp ?? "",
    createdAt: d.createdAt ?? 0,
  };
}

export async function listPatients(q: string): Promise<PatientView[]> {
  const snap = await adminDb().collection("patients").orderBy("name").limit(500).get();
  const term = q.trim().toLowerCase();
  const digits = term.replace(/\D/g, "");
  return snap.docs
    .map((d) => toPatient(d.id, d.data()))
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (digits.length >= 3 && p.phone.includes(digits)));
}

export async function getPatient(id: string): Promise<PatientDetail> {
  const db = adminDb();
  const snap = await db.collection("patients").doc(id).get();
  if (!snap.exists) throw new NotFoundError("Patient not found.");
  const appts = await db.collection("appointments").where("patientId", "==", id).get();
  const today = istNow().date;
  const all: VisitView[] = appts.docs
    .map((d) => {
      const a = d.data();
      return { id: d.id, date: a.date, time: a.time, service: a.service, status: a.status as Status };
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return {
    ...toPatient(snap.id, snap.data() as Record<string, any>),
    visits: all.filter((v) => v.status === "done").reverse(),
    upcoming: all.filter((v) => v.date >= today && (v.status === "booked" || v.status === "checked-in")),
  };
}

export async function updatePatient(
  id: string,
  patch: { notes?: string; followUp?: string; age?: number | null },
): Promise<void> {
  const ref = adminDb().collection("patients").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError("Patient not found.");
  const clean: Record<string, unknown> = {};
  if (patch.notes !== undefined) clean.notes = patch.notes;
  if (patch.followUp !== undefined) clean.followUp = patch.followUp;
  if (patch.age !== undefined) clean.age = patch.age;
  await ref.update(clean);
}
