export interface PatientProfileInput {
  username: string;
  dni: string;
  health_insurance?: string;
  plan?: string;
  member_number?: string;
  address?: string;
}

export interface DoctorProfileInput {
  username: string;
  specialty: string;
  license_number: string;
}

export interface SaveProfilePayload<T> {
  userId: string;
  data: T;
}