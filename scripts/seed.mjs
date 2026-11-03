// Fills the database with fictional patients and appointments for the demo.
// Usage: npm run seed            (only if the database is empty)
//        npm run seed -- --force (adds the sample data anyway)
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

for (const key of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Fill in .env.local first.`);
    process.exit(1);
  }
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

const force = process.argv.includes("--force");
const existing = await db.collection("patients").limit(1).get();
if (!existing.empty && !force) {
  console.log("The database already has patients. Run with --force to add sample data anyway.");
  process.exit(0);
}

const pad = (n) => String(n).padStart(2, "0");
const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
const addDays = (n) => {
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + n));
  return d.toISOString().slice(0, 10);
};
const nowTime = `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
const isSunday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 0;

const patients = [
  ["Priya Das", "9861011111", 29, "Sensitive to cold. Prefers morning slots.", ""],
  ["Amit Nayak", "9437022222", 41, "Root canal on lower right molar, crown pending.", addDays(5)],
  ["Sneha Patra", "7008033333", 24, "Braces, monthly adjustment.", addDays(20)],
  ["Rakesh Behera", "9853044444", 55, "Takes blood thinners. Inform doctor before extractions.", ""],
  ["Lipsa Mohanty", "9937055555", 33, "Whitening completed, review in six months.", addDays(60)],
  ["Subrat Sahoo", "8984066666", 47, "Scaling and polishing due.", ""],
  ["Ananya Rout", "6371077777", 19, "First visit, wisdom tooth pain on the left.", ""],
  ["Biswajit Jena", "9778088888", 62, "Denture fitting in progress.", addDays(2)],
  ["Mamata Swain", "9124099999", 38, "Regular six month checkup.", ""],
  ["Dibya Pradhan", "8012010101", 45, "Old filling replacement on upper left.", ""],
];

const ids = [];
for (const [name, phone, age, notes, followUp] of patients) {
  const ref = db.collection("patients").doc();
  await ref.set({ name, phone, phoneKey: phone, age, notes, followUp, createdAt: Date.now() });
  ids.push(ref.id);
}

// [dayOffset, time, patientIndex, service, status, source]
const rows = [
  [-40, "11:00", 0, "cleaning", "done", "Phone"],
  [-9, "10:30", 1, "rct", "done", "Phone"],
  [-30, "12:00", 2, "braces", "done", "Phone"],
  [-180, "10:00", 4, "whitening", "done", "Website"],
  [-190, "15:00", 8, "checkup", "done", "Phone"],
  [0, "10:00", 0, "checkup", "done", "Phone"],
  [0, "10:30", 1, "rct", "done", "Phone"],
  [0, "11:00", 2, "braces", "in-chair", "Walk-in"],
  [0, "11:30", 3, "filling", "checked-in", "Phone"],
  [0, "12:00", 4, "checkup", "booked", "Phone"],
  [0, "15:00", 5, "cleaning", "booked", "Phone"],
  [0, "16:30", 6, "checkup", "booked", "Website"],
  [1, "10:30", 8, "checkup", "booked", "Website"],
  [1, "11:30", 9, "filling", "booked", "Phone"],
  [1, "17:00", 7, "checkup", "booked", "Phone"],
  [2, "10:00", 0, "cleaning", "booked", "Phone"],
  [2, "12:30", 1, "rct", "booked", "Phone"],
];

let made = 0;
for (const [offset, time, pi, service, status, source] of rows) {
  const date = addDays(offset);
  if (isSunday(date)) continue;
  const apptRef = db.collection("appointments").doc();
  await apptRef.set({
    patientId: ids[pi], date, time, service, status, source,
    isNew: source === "Website" && status === "booked" && offset === 0,
    createdAt: Date.now(),
  });
  // Only times that are still active hold a slot, so the website shows them as taken.
  if (offset >= 0 && status !== "cancelled") {
    await db.collection("slots").doc(`${date}_${time.replace(":", "")}`).set({ date, time, appointmentId: apptRef.id });
  }
  made++;
}
console.log(`Added ${patients.length} patients and ${made} appointments (clinic time now ${nowTime}).`);
process.exit(0);

