import type { Status } from "./clinic";

export type Source = "Website" | "Phone" | "Walk-in";

export type AppointmentView = {
  id: string;
  date: string;
  time: string;
  service: string;
  status: Status;
  source: Source;
  isNew: boolean;
  patient: { id: string; name: string; phone: string };
};

export type PatientView = {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  notes: string;
  followUp: string;
  createdAt: number;
};

export type VisitView = {
  id: string;
  date: string;
  time: string;
  service: string;
  status: Status;
};

export type PatientDetail = PatientView & { visits: VisitView[]; upcoming: VisitView[] };
