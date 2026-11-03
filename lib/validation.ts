import { z } from "zod";
import { SERVICE_IDS, TIMES, digits10 } from "./clinic";

const name = z
  .string()
  .trim()
  .min(2, "Enter the full name.")
  .max(80, "That name is too long.")
  .refine((v) => !/[<>]/.test(v), "Remove the special characters from the name.");

const phone = z
  .string()
  .trim()
  .max(20, "Enter a 10 digit mobile number.")
  .refine((v) => digits10(v).length === 10, "Enter a 10 digit mobile number.");

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");
const time = z.string().refine((v) => TIMES.includes(v), "Choose a time.");
const service = z.enum(SERVICE_IDS, { errorMap: () => ({ message: "Choose a treatment." }) });

/** Public website booking. `website` is a hidden trap field that real visitors leave empty. */
export const publicBookingSchema = z.object({
  name,
  phone,
  service,
  date,
  time,
  website: z.string().max(200).optional(),
});

/** Booking made by front desk staff. */
export const staffBookingSchema = z.object({
  name,
  phone,
  service,
  date,
  time,
  source: z.enum(["Phone", "Walk-in"]),
});

export const actionSchema = z.object({
  action: z.enum(["checkin", "start", "done", "noshow", "cancel", "seen"]),
});

export const patientUpdateSchema = z.object({
  notes: z.string().max(4000).optional(),
  followUp: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid follow-up date.")
    .optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Check the details and try again.";
}
