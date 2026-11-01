export const PATIENT_DETAILS_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'sex',
  'marital_status',
  'occupation',
  'phone',
  'locality',
  'province',
  'postal_code',
] as const;

export const DOCTOR_DETAILS_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'phone',
  'locality',
  'workplace',
  'office_address',
  'attention_hours',
  'accepted_insurances',
  'bio',
] as const;

export type PatientDetailsInput = Partial<
  Record<(typeof PATIENT_DETAILS_FIELDS)[number], string | null>
>;

export type DoctorDetailsInput = Partial<
  Record<(typeof DOCTOR_DETAILS_FIELDS)[number], string | null>
>;

export interface DetailsPayload<T> {
  userId: string;
  data: T;
}