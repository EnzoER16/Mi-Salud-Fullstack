export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
  'O+', 'O-', 'Desconocido',
] as const;

export interface MedicalRecordInput {
  blood_group?: string | null;
  allergies?: string | null;
  antecedents?: string | null;

  weight_kg?: number | null;
  height_cm?: number | null;
  conditions?: string[] | null;

  intolerances?: string | null;
  surgeries?: string | null;
  family_history?: string | null;
  current_medication?: string | null;

  wears_glasses?: boolean | null;

  last_checkup?: string | null;
  last_dental_checkup?: string | null;

  primary_doctor_name?: string | null;
  primary_doctor_phone?: string | null;
  care_center?: string | null;
}

export interface MedicalRecordResponse {
  id_record: string;
  id_patient: string;

  blood_group: string | null;
  allergies: string | null;
  antecedents: string | null;

  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  conditions: string[];

  intolerances: string | null;
  surgeries: string | null;
  family_history: string | null;
  current_medication: string | null;

  wears_glasses: boolean | null;

  last_checkup: string | null;
  last_dental_checkup: string | null;

  primary_doctor_name: string | null;
  primary_doctor_phone: string | null;
  care_center: string | null;
}

export interface MedicalRecordSavePayload {
  patientId: string;
  data: MedicalRecordInput;
}

export interface PatientProfileReference {
  id_patient: string;
  id_user: string;
}