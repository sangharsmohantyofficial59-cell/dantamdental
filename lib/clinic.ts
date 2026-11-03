// Clinic settings and pure scheduling rules. No imports, so it runs in the
// browser, on the server and in tests. Edit this file to change the clinic.

export const CLINIC = {
  name: "Dantam Dental Care",
  doctor: "Dr. Rohan Mishra",
  doctorTitle: "BDS, MDS (Endodontics)",
  phoneDisplay: "+91 90000 00000",
  phoneTel: "+919000000000",
  whatsapp: "919000000000",
  addressLine: "Plot 12, Saheed Nagar, Bhubaneswar, Odisha 751007",
  streetAddress: "Plot 12, Saheed Nagar",
  city: "Bhubaneswar",
  region: "Odisha",
  postalCode: "751007",
} as const;

export const SERVICES = [
  { id: "checkup", name: "Checkup and X-ray", price: 500, desc: "Full oral examination with a digital X-ray and a clear plan." },
  { id: "cleaning", name: "Scaling and polishing", price: 1200, desc: "Removes plaque and tartar so gums stay healthy." },
  { id: "filling", name: "Tooth coloured filling", price: 1500, desc: "Repairs cavities with a natural looking material." },
  { id: "rct", name: "Root canal treatment", price: 4500, desc: "Relieves deep tooth pain, often in a single sitting." },
  { id: "whitening", name: "Teeth whitening", price: 6000, desc: "Brighter shade in about an hour, with after care advice." },
  { id: "braces", name: "Braces and aligners", price: 25000, desc: "Metal or clear options with monthly adjustment visits." },
  { id: "implant", name: "Dental implant", price: 28000, desc: "Permanent replacement for a missing tooth." },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
export const SERVICE_IDS = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export function serviceName(id: string): string {
  return SERVICES.find((s) => s.id === id)?.name ?? id;
}
export function servicePrice(id: string): number {
  return SERVICES.find((s) => s.id === id)?.price ?? 0;
}

// Opening hours: 10:00 to 18:00, 30 minute slots, lunch 13:30 to 14:30.
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 18;
export const LUNCH_START = "13:30";
export const LUNCH_END = "14:30";
export const BOOKING_WINDOW_DAYS = 30;
export const MAX_UPCOMING_PER_PHONE = 3;

const pad = (n: number) => String(n).padStart(2, "0");

export const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (const m of [0, 30]) {
      const t = `${pad(h)}:${pad(m)}`;
      if (t >= LUNCH_START && t < LUNCH_END) continue;
      out.push(t);
    }
  }
  return out;
})();

export const STATUSES = ["booked", "checked-in", "in-chair", "done", "no-show", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export type Action = "checkin" | "start" | "done" | "noshow" | "cancel";

const TRANSITIONS: Record<Status, Partial<Record<Action, Status>>> = {
  booked: { checkin: "checked-in", noshow: "no-show", cancel: "cancelled" },
  "checked-in": { start: "in-chair", cancel: "cancelled" },
  "in-chair": { done: "done" },
  done: {},
  "no-show": {},
  cancelled: {},
};

export function nextStatus(from: Status, action: Action): Status | null {
  return TRANSITIONS[from]?.[action] ?? null;
}

/** Current date and time at the clinic (India, UTC+05:30), whatever the server timezone. */
export function istNow(nowMs: number = Date.now()): { date: string; time: string } {
  const d = new Date(nowMs + 5.5 * 60 * 60 * 1000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

export function slotId(date: string, time: string): string {
  return `${date}_${time.replace(":", "")}`;
}

export function digits10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export type BookableCheck = { ok: true } | { ok: false; reason: string };

/** Rules every booking must pass. Staff can skip the "already passed" rule for walk-ins. */
export function checkBookable(
  date: string,
  time: string,
  opts: { nowMs?: number; allowPast?: boolean; allowBeyondWindow?: boolean } = {},
): BookableCheck {
  if (!isValidDate(date)) return { ok: false, reason: "Choose a valid date." };
  if (!TIMES.includes(time)) return { ok: false, reason: "Choose a valid time." };
  if (isSunday(date)) return { ok: false, reason: "The clinic is closed on Sundays." };
  const now = istNow(opts.nowMs);
  if (date < now.date) return { ok: false, reason: "That date has passed." };
  if (!opts.allowBeyondWindow && date > addDays(now.date, BOOKING_WINDOW_DAYS)) {
    return { ok: false, reason: `Bookings open ${BOOKING_WINDOW_DAYS} days ahead.` };
  }
  if (!opts.allowPast && date === now.date && time <= now.time) {
    return { ok: false, reason: "That time has passed." };
  }
  return { ok: true };
}

/** Times a patient can still pick on a date, given the times already taken. */
export function availableTimes(date: string, taken: string[], nowMs?: number): string[] {
  if (!isValidDate(date) || isSunday(date)) return [];
  const takenSet = new Set(taken);
  return TIMES.filter((t) => !takenSet.has(t) && checkBookable(date, t, { nowMs }).ok);
}

export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDateShort(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
