export * from './contracts.module';
export * from './contracts.service';
export * from './user.types';
export * from './profiles.types';
export * from './details.types';

export const MESSAGE_PATTERNS = {
  IDENTITY_PING: 'identity.ping',
  CLINICAL_PING: 'clinical.ping',

  IDENTITY_REGISTER: 'identity.register',
  IDENTITY_LOGIN: 'identity.login',
  IDENTITY_FIND_BY_ID: 'identity.findById',

  IDENTITY_PATIENT_SAVE: 'identity.patient.saveProfile',
  IDENTITY_PATIENT_GET: 'identity.patient.getProfile',

  IDENTITY_DOCTOR_SAVE: 'identity.doctor.saveProfile',
  IDENTITY_DOCTOR_GET: 'identity.doctor.getProfile',

  IDENTITY_PATIENT_DETAILS_GET: 'identity.patient.getDetails',
  IDENTITY_PATIENT_DETAILS_SAVE: 'identity.patient.saveDetails',

  IDENTITY_DOCTOR_DETAILS_GET: 'identity.doctor.getDetails',
  IDENTITY_DOCTOR_DETAILS_SAVE: 'identity.doctor.saveDetails',
} as const;