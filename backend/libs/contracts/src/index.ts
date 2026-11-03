export * from './contracts.module';
export * from './contracts.service';
export * from './user.types';
export * from './profiles.types';
export * from './details.types';
export * from './emergency-contact.types';
export * from './medical-record.types';
export * from './clinical-crud.types';

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

  IDENTITY_CONTACT_LIST: 'identity.contact.list',
  IDENTITY_CONTACT_CREATE: 'identity.contact.create',
  IDENTITY_CONTACT_UPDATE: 'identity.contact.update',
  IDENTITY_CONTACT_DELETE: 'identity.contact.delete',

  CLINICAL_RECORD_GET: 'clinical.record.get',
  CLINICAL_RECORD_SAVE: 'clinical.record.save',

  CLINICAL_VACCINE_LIST: 'clinical.vaccine.list',
  CLINICAL_VACCINE_GET: 'clinical.vaccine.get',
  CLINICAL_VACCINE_CREATE: 'clinical.vaccine.create',
  CLINICAL_VACCINE_UPDATE: 'clinical.vaccine.update',
  CLINICAL_VACCINE_DELETE: 'clinical.vaccine.delete',

  CLINICAL_APPOINTMENT_LIST: 'clinical.appointment.list',
  CLINICAL_APPOINTMENT_GET: 'clinical.appointment.get',
  CLINICAL_APPOINTMENT_CREATE: 'clinical.appointment.create',
  CLINICAL_APPOINTMENT_UPDATE: 'clinical.appointment.update',
  CLINICAL_APPOINTMENT_DELETE: 'clinical.appointment.delete',
} as const;