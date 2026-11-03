/**
 * MiSalud+ — Seed realista de DEMOSTRACIÓN.
 * Ejecutar contra el API Gateway existente. No elimina usuarios, colecciones ni volúmenes.
 * Solo modifica las dos cuentas dedicadas al TP y los registros con títulos de la seed.
 * Node 18+; sin dependencias externas.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = (process.env.API_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo2026!Segura';
const PATIENT_EMAIL = process.env.DEMO_PATIENT_EMAIL || 'paciente.tp.demo@gmail.com';
const DOCTOR_EMAIL = process.env.DEMO_DOCTOR_EMAIL || 'medico.tp.demo@gmail.com';
const PATIENT = 'Sofia Martinez';
const DOCTOR = 'Dra. Valentina Alvarez';
const CLINIC = 'Centro Medico Alameda (ficticio)';

// Para mostrar próximos turnos aunque se repita la seed en otra fecha.
function ymd(offset = 0) {
  const t = new Date(Date.now() + offset * 86_400_000);
  return t.toISOString().slice(0, 10);
}
function appointmentISO(offsetDays, hourMendoza, minutes = 0) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Mendoza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  // Mendoza opera en UTC-03:00 para estas fechas de demostración.
  return new Date(Date.UTC(Number(value.year), Number(value.month) - 1,
    Number(value.day) + offsetDays, hourMendoza + 3, minutes)).toISOString();
}

class ApiError extends Error {
  constructor(method, endpoint, status, detail) {
    super(`${method} ${endpoint}: HTTP ${status}${detail ? ` (${detail})` : ''}`);
    this.status = status;
  }
}
async function call(endpoint, method = 'GET', payload, token) {
  let response;
  try {
    response = await fetch(`${API}${endpoint}`, {
      method,
      headers: {
        ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
      signal: AbortSignal.timeout(18000),
    });
  } catch (e) {
    throw new Error(`No se pudo contactar ${API}${endpoint}: ${e.message}. Revisá docker compose ps.`);
  }
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { throw new ApiError(method, endpoint, response.status, 'Respuesta no JSON'); }
  if (!response.ok) {
    const detail = typeof data?.message === 'string' ? data.message : '';
    throw new ApiError(method, endpoint, response.status, detail.slice(0, 220));
  }
  return data;
}
async function gql(query, variables, token) {
  const response = await call('/graphql', 'POST', { query, variables }, token);
  if (response?.errors?.length) {
    throw new Error(`GraphQL: ${response.errors.map(e => e.message).join(' | ')}`);
  }
  if (!response?.data) throw new Error('GraphQL no devolvió datos.');
  return response.data;
}
async function ensureAccount(email, username, role) {
  let session;
  try {
    session = await call('/api/auth/login', 'POST', { email, password: PASSWORD });
  } catch (error) {
    if (!(error instanceof ApiError) || ![401, 404].includes(error.status)) throw error;
    try {
      await call('/api/auth/register', 'POST', { username, email, password: PASSWORD, role });
    } catch (registerError) {
      throw new Error(`No se puede preparar la cuenta ${email}: ${registerError.message}. ` +
        'Si ya existe con otra contraseña, no se modifica automáticamente.');
    }
    session = await call('/api/auth/login', 'POST', { email, password: PASSWORD });
  }
  if (session?.user?.role !== role || !session?.token) {
    throw new Error(`La cuenta ${email} no tiene rol ${role} o no recibió JWT.`);
  }
  return session.token;
}
function info(message) { console.log(`  ✓ ${message}`); }

try {
  console.log('MiSalud+ — seed académica REALISTA (información 100% ficticia)');
  const health = await call('/api/health');
  if (health.gateway !== 'ok' || health.services?.identity?.status !== 'ok' ||
    health.services?.clinical?.status !== 'ok') {
    throw new Error('Gateway, Identity y Clinical deben estar funcionando.');
  }

  const patientToken = await ensureAccount(PATIENT_EMAIL, PATIENT, 'Paciente');
  const doctorToken = await ensureAccount(DOCTOR_EMAIL, DOCTOR, 'Doctor');
  info('Login de paciente y médico correcto');

  await call('/api/patient/profile', 'POST', {
    username: PATIENT,
    dni: '39990001', // DNI ficticio reservado para el escenario académico
    health_insurance: 'OSEP', plan: 'General', member_number: 'DEM-2026-0147',
    address: 'Domicilio ficticio 1250, Godoy Cruz, Mendoza',
  }, patientToken);
  await call('/api/patient/details', 'PUT', {
    first_name: 'Sofia', last_name: 'Martinez', birth_date: '1992-04-18',
    sex: 'Femenino', marital_status: 'Soltero/a', occupation: 'Diseñadora gráfica',
    phone: '2615550147', locality: 'Godoy Cruz', province: 'Mendoza', postal_code: '5501',
  }, patientToken);
  info('Datos personales completos de la paciente');

  await call('/api/doctor/profile', 'POST', {
    username: DOCTOR, specialty: 'Clínica médica', license_number: 'MP-DEMO-15328',
  }, doctorToken);
  await call('/api/doctor/details', 'PUT', {
    first_name: 'Valentina', last_name: 'Alvarez', birth_date: '1981-10-06',
    phone: '2615550214', locality: 'Ciudad de Mendoza',
    workplace: CLINIC, office_address: 'Consultorio ficticio 120, Ciudad de Mendoza',
    attention_hours: 'Lunes, miércoles y viernes de 8:30 a 13:30',
    accepted_insurances: 'OSEP, OSDE y particulares',
    bio: 'Médica clínica dedicada a controles preventivos y seguimiento de pacientes adultos. Perfil ficticio de demostración.',
  }, doctorToken);
  info('Datos profesionales completos de la médica');

  await call('/api/medical-record/', 'POST', {
    blood_group: 'A+',
    allergies: 'Penicilina: erupción cutánea referida en 2021.',
    antecedents: 'Asma leve intermitente desde la adolescencia. Sin internaciones recientes.',
    weight_kg: 64.8, height_cm: 165, conditions: ['Asma'],
    intolerances: 'Lactosa: molestias digestivas ocasionales.',
    surgeries: 'Apendicectomía en 2014, sin complicaciones.',
    family_history: 'Madre con hipertensión arterial y abuelo materno con diabetes tipo 2.',
    current_medication: 'Salbutamol inhalador, uso eventual según indicación médica.',
    wears_glasses: true,
    last_checkup: ymd(-41), last_dental_checkup: ymd(-176),
    primary_doctor_name: DOCTOR, primary_doctor_phone: '2615550214',
    care_center: CLINIC,
  }, patientToken);
  info('Ficha médica integral y controles recientes');

  const contactSeeds = [
    { name: 'Mariana Lopez', relationship: 'Madre', phone: '2615550128' },
    { name: 'Julian Martinez', relationship: 'Hermano', phone: '2615550189' },
  ];
  let contacts = await call('/api/patient/emergency-contacts', 'GET', undefined, patientToken);
  if (!Array.isArray(contacts)) throw new Error('Contactos: se esperaba un arreglo.');
  let contactWrites = 0;
  for (const item of contactSeeds) {
    const found = contacts.find(c => c.name === item.name);
    if (found) {
      await call(`/api/patient/emergency-contacts/${encodeURIComponent(found.id_contact)}`,
        'PATCH', { relationship: item.relationship, phone: item.phone }, patientToken);
      contactWrites++;
    } else if (contacts.length < 4) {
      // Mantenemos al menos una ranura libre para la prueba funcional posterior.
      const added = await call('/api/patient/emergency-contacts', 'POST', item, patientToken);
      contacts.push(added);
      contactWrites++;
    } else {
      console.warn('  ! Ya hay 4 contactos; no agrego otro para no ocupar el cupo de pruebas.');
    }
  }
  info(`${contactWrites} contactos de emergencia creados o actualizados`);

  const vaccineSeeds = [
    {
      name: 'Antigripal 2026', legacy: 'Antigripal', dose: 'Dosis anual',
      applied_on: '2026-05-12', next_dose_on: '2027-05-12',
      place: 'Vacunatorio municipal (dato ficticio)', notes: 'Aplicación anual, sin eventos posteriores registrados.',
    },
    {
      name: 'COVID-19', dose: 'Refuerzo', applied_on: '2025-10-18', next_dose_on: null,
      place: 'Centro de salud (dato ficticio)', notes: 'Registro personal de refuerzo.',
    },
    {
      name: 'Doble adultos (dT)', dose: 'Refuerzo', applied_on: '2023-08-11',
      next_dose_on: '2033-08-11', place: 'Vacunatorio local (dato ficticio)',
      notes: 'Seguimiento del esquema de vacunación.',
    },
    {
      name: 'Hepatitis B', dose: 'Esquema completo', applied_on: '2022-04-22',
      next_dose_on: null, place: 'Centro de vacunación (dato ficticio)',
      notes: 'Esquema completo registrado por la paciente.',
    },
  ];
  const listVaccines = await gql('query { vaccines { id_vaccine name dose place } }', {}, patientToken);
  let existingVaccines = listVaccines.vaccines;
  if (!Array.isArray(existingVaccines)) throw new Error('GraphQL vacunas: respuesta inválida');
  let vaccineWrites = 0;
  for (const { legacy, ...seed } of vaccineSeeds) {
    const match = existingVaccines.find(v => v.name === seed.name) ||
      (legacy && existingVaccines.find(v => v.name === legacy &&
        String(v.place || '').toLowerCase().includes('demo')));
    if (match) {
      await gql('mutation($id:ID!,$input:UpdateVaccineInput!){updateVaccine(id:$id,input:$input){id_vaccine}}',
        { id: match.id_vaccine, input: seed }, patientToken);
    } else {
      const result = await gql('mutation($input:CreateVaccineInput!){createVaccine(input:$input){id_vaccine name}}',
        { input: seed }, patientToken);
      existingVaccines.push(result.createVaccine);
    }
    vaccineWrites++;
  }
  info(`${vaccineWrites} vacunas reales de demostración creadas o actualizadas`);

  const appointmentSeeds = [
    {
      title: 'Control clínico anual', legacy: 'Control de rutina',
      scheduled_at: appointmentISO(7, 9, 30), doctor_name: DOCTOR,
      location: CLINIC, modality: 'Presencial',
    },
    {
      title: 'Seguimiento respiratorio', scheduled_at: appointmentISO(20, 11, 0),
      doctor_name: DOCTOR, location: CLINIC, modality: 'Presencial',
    },
    {
      title: 'Consulta de resultados', scheduled_at: appointmentISO(34, 16, 30),
      doctor_name: DOCTOR, location: 'Videoconsulta', modality: 'Virtual',
    },
    {
      title: 'Control odontológico (anterior)', scheduled_at: appointmentISO(-24, 10, 0),
      doctor_name: 'Dra. Carolina Ruiz (ficticio)', location: 'Consultorio odontológico (ficticio)',
      modality: 'Presencial',
    },
  ];
  const listed = await gql('query { appointments { id_appointment title doctor_name location } }', {}, patientToken);
  let existingAppointments = listed.appointments;
  if (!Array.isArray(existingAppointments)) throw new Error('GraphQL turnos: respuesta inválida');
  let appointmentWrites = 0;
  for (const { legacy, ...seed } of appointmentSeeds) {
    const match = existingAppointments.find(a => a.title === seed.title) ||
      (legacy && existingAppointments.find(a => a.title === legacy &&
        (!a.doctor_name || !a.location)));
    if (match) {
      await gql('mutation($id:ID!,$input:UpdateAppointmentInput!){updateAppointment(id:$id,input:$input){id_appointment}}',
        { id: match.id_appointment, input: seed }, patientToken);
    } else {
      const result = await gql('mutation($input:CreateAppointmentInput!){createAppointment(input:$input){id_appointment title}}',
        { input: seed }, patientToken);
      existingAppointments.push(result.createAppointment);
    }
    appointmentWrites++;
  }
  info(`${appointmentWrites} turnos con horarios y profesionales consistentes`);

  // Verificación final con las API reales, no se finge ningún dato en React.
  const [patient, doctor, record, vaccineCheck, appointmentsCheck, contactCheck] = await Promise.all([
    call('/api/patient/profile', 'GET', undefined, patientToken),
    call('/api/doctor/profile', 'GET', undefined, doctorToken),
    call('/api/medical-record/', 'GET', undefined, patientToken),
    gql('query { vaccines { id_vaccine name } }', {}, patientToken),
    gql('query { appointments { id_appointment title } }', {}, patientToken),
    call('/api/patient/emergency-contacts', 'GET', undefined, patientToken),
  ]);
  if (patient.username !== PATIENT || doctor.username !== DOCTOR ||
      record.primary_doctor_name !== DOCTOR ||
      !vaccineCheck.vaccines.some(v => v.name === 'Antigripal 2026') ||
      !appointmentsCheck.appointments.some(a => a.title === 'Control clínico anual') ||
      !contactCheck.some(c => c.name === 'Mariana Lopez')) {
    throw new Error('Falló la comprobación final de datos reales de demostración');
  }

  const evidenceDir = path.join(ROOT, 'evidencias-tp');
  await fs.mkdir(evidenceDir, { recursive: true });
  const manifest = {
    generado_utc: new Date().toISOString(),
    nota: 'TODOS los datos y nombres de personas son ficticios. Solo demostración académica.',
    paciente: { nombre: PATIENT, correo: PATIENT_EMAIL },
    medico: { nombre: DOCTOR, correo: DOCTOR_EMAIL },
    vacunas: vaccineCheck.vaccines.length,
    turnos: appointmentsCheck.appointments.length,
    contactos: contactCheck.length,
    relacion: 'La médica figura como texto en el turno y la ficha, sin vínculo clínico por ID.',
  };
  await fs.writeFile(path.join(evidenceDir, 'MANIFIESTO-SEED-REALISTA.json'),
    JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\nSEED CORRECTA: ${manifest.vacunas} vacunas, ${manifest.turnos} turnos, ${manifest.contactos} contactos.`);
  console.log('Cuentas ficticias:');
  console.log(`  Paciente: ${PATIENT_EMAIL} — ${PATIENT}`);
  console.log(`  Médico:   ${DOCTOR_EMAIL} — ${DOCTOR}`);
  console.log('Se conserva la contraseña de demostración anterior; no se imprime ningún JWT.');
  console.log('No se borró información ni se modificaron otras cuentas.');
} catch (error) {
  console.error(`\nERROR de seed: ${error.message}`);
  process.exitCode = 1;
}
