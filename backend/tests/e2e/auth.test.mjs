import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPatient, rest } from './helpers.mjs';

test('E2E 1: registro, login, perfil JWT y seguridad REST', async () => {
  const patient = await createPatient();
  const profile = await rest('/api/auth/profile', 'GET', undefined, patient.token);
  assert.equal(profile.status, 200, JSON.stringify(profile.body));
  assert.equal(profile.body.email, patient.email);
  const unauthorized = await rest('/api/auth/profile');
  assert.equal(unauthorized.status, 401);
  const wrongRole = await rest('/api/auth/doctor-only', 'GET', undefined, patient.token);
  assert.equal(wrongRole.status, 403);
});
