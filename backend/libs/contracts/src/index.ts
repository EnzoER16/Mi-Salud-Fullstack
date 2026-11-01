export * from './contracts.module';
export * from './contracts.service';
export * from './user.types';

export const MESSAGE_PATTERNS = {
  IDENTITY_PING: 'identity.ping',
  CLINICAL_PING: 'clinical.ping',

  IDENTITY_REGISTER: 'identity.register',
  IDENTITY_LOGIN: 'identity.login',
  IDENTITY_FIND_BY_ID: 'identity.findById',
} as const;