export * from './contracts.module';
export * from './contracts.service';

// Contratos de comunicación entre microservicios
export const MESSAGE_PATTERNS = {
  IDENTITY_PING: 'identity.ping',
  CLINICAL_PING: 'clinical.ping',
} as const;