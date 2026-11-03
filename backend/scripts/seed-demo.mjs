// Ejecutar con los 4 contenedores levantados. Solo usar datos FICTICIOS.
const API = process.env.API_ORIGIN ?? 'http://localhost:3000';
const password = process.env.DEMO_PASSWORD ?? 'Demo2026!Segura';

async function request(path, method = 'GET', body, token) {
  const res = await fetch(API + path, { method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const result = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} [${res.status}] ${text}`);
  return result;
}
async function register(email, username, role) {
  try { await request('/api/auth/register', 'POST', { email, username, role, password }); }
  catch (e) { if (!e.message.includes('[409]')) throw e; }
  const login = await request('/api/auth/login', 'POST', { email, password });
  return login.token;
}
async function gql(query, variables, token) {
  const data = await request('/graphql', 'POST', { query, variables }, token);
  if (data.errors?.length) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

const patientEmail = 'paciente.tp.demo@gmail.com';
const doctorEmail = 'medico.tp.demo@gmail.com';
const patientToken = await register(patientEmail, 'PacienteTPDemo', 'Paciente');
const doctorToken = await register(doctorEmail, 'MedicoTPDemo', 'Doctor');
await request('/api/patient/profile', 'POST', {
  username: 'PacienteTPDemo', dni: '39000001', health_insurance: 'OSEP', plan: 'Demo',
  member_number: 'TP-001', address: 'Mendoza, Argentina',
}, patientToken);
await request('/api/doctor/profile', 'POST', {
  username: 'MedicoTPDemo', specialty: 'Clinica medica', license_number: 'DEMO-1001',
}, doctorToken);
await request('/api/patient/details', 'PUT', {
  first_name: 'Paciente', last_name: 'Ejemplo', birth_date: '1997-05-14',
  phone: '2615551111', locality: 'Mendoza', province: 'Mendoza',
}, patientToken);
await request('/api/medical-record/', 'POST', {
  blood_group: 'O+', allergies: 'Sin alergias declaradas', weight_kg: 70, height_cm: 170,
  conditions: [], last_checkup: '2026-10-10',
}, patientToken);
const vaccines = await gql('query { vaccines { id_vaccine } }', {}, patientToken);
if (!vaccines.vaccines.length) await gql(
  'mutation($input:CreateVaccineInput!){createVaccine(input:$input){id_vaccine}}',
  { input: { name: 'Antigripal', dose: 'Anual', applied_on: '2026-05-10', place: 'Centro de salud demo' } }, patientToken,
);
const appts = await gql('query { appointments { id_appointment } }', {}, patientToken);
if (!appts.appointments.length) await gql(
  'mutation($input:CreateAppointmentInput!){createAppointment(input:$input){id_appointment}}',
  { input: { title: 'Control de rutina', scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(), modality: 'Presencial' } }, patientToken,
);
console.log('SEED COMPLETA (datos ficticios)');
console.log('Paciente:', patientEmail, '| Medico:', doctorEmail);
console.log('Contraseña de demostracion:', password);
