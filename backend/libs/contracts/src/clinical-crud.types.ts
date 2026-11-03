export interface VaccineData {
  name: string;
  dose?: string | null;
  applied_on?: string | null;
  next_dose_on?: string | null;
  place?: string | null;
  notes?: string | null;
}

export type UpdateVaccineData = Partial<VaccineData>;

export interface VaccineResult {
  id_vaccine: string;
  name: string;
  dose: string | null;
  applied_on: string | null;
  next_dose_on: string | null;
  place: string | null;
  notes: string | null;
}

export interface AppointmentData {
  title: string;
  scheduled_at: string;
  doctor_name?: string | null;
  location?: string | null;
  modality?: string;
}

export type UpdateAppointmentData = Partial<AppointmentData>;

export interface AppointmentResult {
  id_appointment: string;
  title: string;
  scheduled_at: string;
  doctor_name: string | null;
  location: string | null;
  modality: string;
  file_count: number;
  note_count: number;
}

export interface ClinicalCrudPayload<T> {
  patientId: string;
  data: T;
}

export interface ClinicalCrudById {
  patientId: string;
  id: string;
}

export interface ClinicalCrudUpdate<T> extends ClinicalCrudById {
  data: T;
}