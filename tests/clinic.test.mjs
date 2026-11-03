import test from "node:test";
import assert from "node:assert/strict";
import {
  TIMES, addDays, availableTimes, checkBookable, digits10, isSunday, istNow, nextStatus, slotId,
} from "../lib/clinic.ts";

// Monday 2 Nov 2026, 11:00 in India = 05:30 UTC.
const MON_11AM_IST = Date.UTC(2026, 10, 2, 5, 30);

test("slots skip lunch and cover 10:00 to 17:30", () => {
  assert.equal(TIMES[0], "10:00");
  assert.equal(TIMES.at(-1), "17:30");
  assert.ok(!TIMES.includes("13:30"));
  assert.ok(!TIMES.includes("14:00"));
  assert.ok(TIMES.includes("14:30"));
  assert.equal(TIMES.length, 14);
});

test("clinic time is India time whatever the server timezone", () => {
  assert.deepEqual(istNow(MON_11AM_IST), { date: "2026-11-02", time: "11:00" });
  // 20:00 UTC on Sunday is already Monday 01:30 in India.
  assert.equal(istNow(Date.UTC(2026, 10, 1, 20, 0)).date, "2026-11-02");
});

test("Sundays are closed", () => {
  assert.equal(isSunday("2026-11-01"), true);
  assert.equal(isSunday("2026-11-02"), false);
  const r = checkBookable("2026-11-08", "10:00", { nowMs: MON_11AM_IST });
  assert.equal(r.ok, false);
});

test("past times today are refused, later times allowed", () => {
  assert.equal(checkBookable("2026-11-02", "10:30", { nowMs: MON_11AM_IST }).ok, false);
  assert.equal(checkBookable("2026-11-02", "11:00", { nowMs: MON_11AM_IST }).ok, false);
  assert.equal(checkBookable("2026-11-02", "11:30", { nowMs: MON_11AM_IST }).ok, true);
  assert.equal(checkBookable("2026-11-01", "11:30", { nowMs: MON_11AM_IST }).ok, false);
});

test("staff can book a time that already passed today", () => {
  assert.equal(checkBookable("2026-11-02", "10:30", { nowMs: MON_11AM_IST, allowPast: true }).ok, true);
});

test("booking window is 30 days", () => {
  assert.equal(checkBookable(addDays("2026-11-02", 30), "10:00", { nowMs: MON_11AM_IST }).ok, true);
  assert.equal(checkBookable(addDays("2026-11-02", 31), "10:00", { nowMs: MON_11AM_IST }).ok, false);
});

test("rejects impossible dates and times", () => {
  assert.equal(checkBookable("2026-02-30", "10:00", { nowMs: MON_11AM_IST }).ok, false);
  assert.equal(checkBookable("2026-11-03", "13:30", { nowMs: MON_11AM_IST }).ok, false);
  assert.equal(checkBookable("not-a-date", "10:00", { nowMs: MON_11AM_IST }).ok, false);
});

test("available times remove taken and past slots", () => {
  const free = availableTimes("2026-11-02", ["11:30", "12:00"], MON_11AM_IST);
  assert.ok(!free.includes("11:30") && !free.includes("12:00") && !free.includes("10:30"));
  assert.ok(free.includes("12:30"));
  assert.deepEqual(availableTimes("2026-11-08", [], MON_11AM_IST), []);
});

test("slot ids are unique per date and time", () => {
  assert.equal(slotId("2026-11-03", "10:30"), "2026-11-03_1030");
  assert.notEqual(slotId("2026-11-03", "10:30"), slotId("2026-11-03", "11:30"));
});

test("status steps follow the front desk flow", () => {
  assert.equal(nextStatus("booked", "checkin"), "checked-in");
  assert.equal(nextStatus("checked-in", "start"), "in-chair");
  assert.equal(nextStatus("in-chair", "done"), "done");
  assert.equal(nextStatus("booked", "cancel"), "cancelled");
  assert.equal(nextStatus("done", "cancel"), null);
  assert.equal(nextStatus("cancelled", "checkin"), null);
  assert.equal(nextStatus("booked", "done"), null);
});

test("phone numbers match on the last 10 digits", () => {
  assert.equal(digits10("+91 98610 11111"), "9861011111");
  assert.equal(digits10("098610-11111"), "9861011111");
});
