import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export const API = process.env.API_ORIGIN ?? 'http://localhost:3000';

export async function rest(path, method = 'GET', data, token) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(data !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}

export async function gql(query, variables, token) {
  const response = await rest('/graphql', 'POST', { query, variables }, token);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.ok(!response.body.errors, JSON.stringify(response.body.errors));
  return response.body.data;
}

export async function createPatient() {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const password = 'ClaveSegura2026!';
  const email = `tp.${suffix}@gmail.com`;
  const register = await rest('/api/auth/register', 'POST', {
    username: `Paciente${suffix}`,
    email,
    password,
    role: 'Paciente',
  });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const login = await rest('/api/auth/login', 'POST', { email, password });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  assert.ok(login.body.token);
  const dni = `${Math.floor(10000000 + Math.random() * 89999999)}`;
  const profile = await rest('/api/patient/profile', 'POST', {
    username: `Paciente${suffix}`, dni,
  }, login.body.token);
  assert.ok([200, 201].includes(profile.status), JSON.stringify(profile.body));
  return { email, password, token: login.body.token, user: login.body.user };
}
