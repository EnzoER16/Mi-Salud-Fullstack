export interface EmergencyContactInput {
  name: string;
  relationship?: string | null;
  phone: string;
}

export type UpdateEmergencyContactInput =
  Partial<EmergencyContactInput>;

export interface EmergencyContactResponse {
  id_contact: string;
  name: string;
  relationship: string | null;
  phone: string;
}

export interface ContactOwnerPayload {
  userId: string;
}

export interface CreateContactPayload extends ContactOwnerPayload {
  data: EmergencyContactInput;
}

export interface ContactByIdPayload extends ContactOwnerPayload {
  contactId: string;
}

export interface UpdateContactPayload extends ContactByIdPayload {
  data: UpdateEmergencyContactInput;
}