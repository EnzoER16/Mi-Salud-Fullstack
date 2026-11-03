/** Auditoria de SOLO LECTURA de los modulos agregados a MiSalud+.
 * Ejecutar con Node.js 20+ y Docker levantado. NO borra ni escribe datos.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const api = (process.env.API_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
const password = process.env.DEMO_PASSWORD || 'Demo2026!Segura';
const emails = {
  paciente: process.env.DEMO_PATIENT_EMAIL || 'paciente.tp.demo@gmail.com',
  medico: process.env.DEMO_DOCTOR_EMAIL || 'medico.tp.demo@gmail.com',
  familiar: process.env.DEMO_FAMILY_EMAIL || 'familiar.tp.demo@gmail.com',
};
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(root, 'evidencias-tp', `AMPLIACION-API-${stamp}.md`);
const results = [];
const state = {};

async function http(route, {method='GET', token, body, raw=false}={}) {
  const response = await fetch(`${api}${route}`, {
    method,
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(body === undefined ? {} : {'Content-Type': 'application/json'}),
    },
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    signal: AbortSignal.timeout(15000),
  });
  if (raw) return {status: response.status, type: response.headers.get('content-type'), bytes: Buffer.from(await response.arrayBuffer())};
  const text = await response.text();
  let value;
  try { value = text ? JSON.parse(text) : {}; } catch { value = {message: text.slice(0, 180)}; }
  return {status: response.status, value};
}
function okResponse(result, expected=200) {
  assert.equal(result.status, expected, `Esperado HTTP ${expected}, recibido ${result.status}: ${JSON.stringify(result.value).slice(0, 200)}`);
  return result.value;
}
async function check(title, fn) {
  try {
    const detail = await fn();
    const safe = String(detail || 'Respuesta validada').replace(/\|/g, '/').replace(/[\r\n]+/g,' ').slice(0,250);
    results.push({title,ok:true,detail:safe});
    console.log(`OK    ${title}`);
  } catch (e) {
    const msg=String(e?.message || e).replace(/\|/g,'/').replace(/[\r\n]+/g,' ').slice(0,250);
    results.push({title,ok:false,detail:msg});
    console.error(`ERROR ${title}: ${msg}`);
  }
}
async function login(label,email) {
  const data = okResponse(await http('/api/auth/login', {method:'POST',body:{email,password}}));
  assert.ok(typeof data.token==='string' && data.token.length>30,'JWT no recibido');
  state[label]=data.token;
  return `JWT recibido para ${label}`;
}
const get=(route,token)=>http(route,{token});
const requireArray=(value)=>assert.ok(Array.isArray(value),'La respuesta no es un arreglo');

await check('Health de microservicios', async()=>{
  const r=okResponse(await get('/api/health'));assert.ok(r,'Sin respuesta');return 'Gateway responde correctamente';
});
await check('Login paciente',()=>login('paciente',emails.paciente));
await check('Login medico',()=>login('medico',emails.medico));
await check('Login familiar',()=>login('familiar',emails.familiar));

if(state.paciente) {
  await check('Perfil paciente de seed realista',async()=>{
    const p=okResponse(await get('/api/patient/profile',state.paciente));
    assert.ok(p.id_patient && p.dni, 'Faltan id_patient o DNI');
    state.patientId = p.id_patient;state.dni=p.dni;
    return 'Perfil con DNI e identificador clínico';
  });
  await check('Autorizaciones de medicos',async()=>{
    const list=okResponse(await get('/api/patient/doctor-access',state.paciente));requireArray(list);
    assert.ok(list.some(x=>x.doctor_email===emails.medico),'La medica de la seed no esta autorizada');
    return 'Profesional de demostracion autorizado';
  });
  await check('Historial de consultas paciente',async()=>{
    const a=okResponse(await get('/api/patient/history',state.paciente));requireArray(a);
    assert.ok(a.some(x=>String(x.diagnosis).includes('Seguimiento de asma leve')),'No se encuentra consulta de la seed');
    return `${a.length} consultas`;});
  await check('Tratamientos indicados',async()=>{
    const a=okResponse(await get('/api/treatment/my-treatments',state.paciente));requireArray(a);
    assert.ok(a.some(x=>x.medication==='Loratadina'),'No figura tratamiento de seed');
    state.treatments=a;return `${a.length} tratamientos`;});
  await check('Tomas de medicacion del dia',async()=>{
    const a=okResponse(await get('/api/intake/today',state.paciente));requireArray(a);
    return `${a.length} tomas para hoy (0 puede ser correcto según la fecha)`;});
  await check('Notificaciones del paciente',async()=>{
    const a=okResponse(await get('/api/notifications/my',state.paciente));requireArray(a.notifications);
    assert.ok(typeof a.unread_count==='number','No se recibió contador');
    return `${a.notifications.length} notificaciones`;});
  await check('Grupo de cuidado del paciente',async()=>{
    const a=okResponse(await get('/api/care/members',state.paciente));requireArray(a);
    assert.ok(a.some(x=>x.member_email===emails.familiar && x.status==='Activo'),'Familiar de seed no activo');
    return 'Familiar activo';});
  await check('Auditoria de actividad familiar',async()=>{
    const a=okResponse(await get('/api/care/my-activity',state.paciente));requireArray(a);return `${a.length} acciones registradas`;});
  await check('Invitaciones pendientes del paciente',async()=>{
    const a=okResponse(await get('/api/care/invitations/mine',state.paciente));requireArray(a);return 'Consulta sin errores';});
  await check('Listado GraphQL de turnos',async()=>{
    const result=okResponse(await http('/graphql',{method:'POST', token:state.paciente,body:{query:'query { appointments { id_appointment title } }'}}));
    assert.ok(!result.errors,JSON.stringify(result.errors));requireArray(result.data?.appointments);
    state.appointment=result.data.appointments.find(x=>x.title==='Control clínico anual')||result.data.appointments[0];
    assert.ok(state.appointment,'No hay turnos para revisar notas');return `${result.data.appointments.length} turnos`;});
  if(state.appointment) {
    await check('Detalles, notas y adjuntos del turno',async()=>{
      const detail=okResponse(await get(`/api/appointments/${encodeURIComponent(state.appointment.id_appointment)}`,state.paciente));
      requireArray(detail.notes);requireArray(detail.files);
      assert.ok(detail.notes.some(n=>n.title==='Preguntas para la consulta'),'Falta nota de seed');
      const file=detail.files.find(f=>f.name==='estudio-de-ejemplo.pdf');
      assert.ok(file,'Falta archivo de seed');
      state.attachment=file;return `${detail.notes.length} notas, ${detail.files.length} archivos`;});
    if(state.attachment)await check('Descarga real de PDF (GridFS)',async()=>{
      const r=await http(`/api/appointments/files/${encodeURIComponent(state.attachment.id_file)}`,{token:state.paciente,raw:true});
      assert.equal(r.status,200,'No fue posible descargar PDF');
      assert.ok(r.bytes.subarray(0,5).toString()==='%PDF-','El archivo descargado no empieza como PDF');
      return `PDF recibido (${r.bytes.length} bytes)`;
    });
  }
}
if(state.medico) {
  await check('Listado de pacientes autorizados',async()=>{
    const a=okResponse(await get('/api/doctor/patients',state.medico));requireArray(a);
    assert.ok(a.some(x=>x.id_patient===state.patientId || x.dni===state.dni),'La paciente no figura como autorizada');
    return `${a.length} pacientes`;});
  if(state.dni)await check('Busqueda medica por DNI autorizado',async()=>{
    const a=okResponse(await get(`/api/doctor/patient/${encodeURIComponent(state.dni)}`,state.medico));
    assert.equal(a.id_patient,state.patientId,'Paciente incorrecta');return 'Ficha encontrada con consentimiento';});
  if(state.patientId) {
    await check('Consulta medica mediante QR autorizado',async()=>{
      const a=okResponse(await get(`/api/doctor/patient/qr/${encodeURIComponent(state.patientId)}`,state.medico));
      assert.equal(a.id_patient,state.patientId);return 'Consulta por QR autorizada';});
    await check('Analisis clinico descriptivo',async()=>{
      const a=okResponse(await get(`/api/doctor/patient/${encodeURIComponent(state.patientId)}/clinical-analysis`,state.medico));
      assert.ok(typeof a.total==='number','Sin total de consultas');return `${a.total} consultas procesadas`;});
    await check('Analisis de tratamientos anteriores',async()=>{
      const a=okResponse(await get(`/api/doctor/patient/${encodeURIComponent(state.patientId)}/treatment-history-analysis`,state.medico));
      assert.ok(typeof a.total==='number','Sin total de tratamientos');return `${a.total} tratamientos`;});
    await check('Recetas visibles para la medica',async()=>{
      const a=okResponse(await get(`/api/treatment/patient/${encodeURIComponent(state.patientId)}`,state.medico));requireArray(a);
      assert.ok(a.some(x=>x.medication==='Loratadina'),'Falta tratamiento');return `${a.length} recetas`;});
    await check('Consultas visibles para la medica',async()=>{
      const a=okResponse(await get(`/api/consultation/history/${encodeURIComponent(state.patientId)}`,state.medico));requireArray(a);
      return `${a.length} consultas`;});
  }
  await check('Catalogo de medicamentos',async()=>{
    const a=okResponse(await get('/api/medication',state.medico));requireArray(a);
    assert.ok(a.some(x=>x.name==='Loratadina'),'Catalogo incompleto');return `${a.length} medicamentos`;});
  await check('Notificaciones del medico',async()=>{
    const a=okResponse(await get('/api/notifications/my',state.medico));requireArray(a.notifications);
    return `${a.notifications.length} notificaciones`;});
}
if(state.familiar) {
  await check('Accesos familiares activos',async()=>{
    const a=okResponse(await get('/api/care/shared-with-me',state.familiar));requireArray(a);
    assert.ok(a.some(x=>x.id_patient===state.patientId),'Falta acceso de la familiar');return 'Acceso confirmado';});
  if(state.patientId) {
    await check('Consulta familiar de medicacion autorizada',async()=>{
      const a=okResponse(await get(`/api/care/patients/${state.patientId}/medication`,state.familiar));requireArray(a);
      return `${a.length} tratamientos compartidos`;});
    await check('Consulta familiar de ficha autorizada',async()=>{
      const a=okResponse(await get(`/api/care/patients/${state.patientId}/medical-record`,state.familiar));
      assert.ok(a && typeof a==='object' && (a.blood_group||a.medical_record?.blood_group),'Ficha no retornada');return 'Ficha accesible por permiso';});
    await check('Actividad familiar autorizada',async()=>{
      const a=okResponse(await get(`/api/care/patients/${state.patientId}/activity`,state.familiar));requireArray(a);return 'Historial consultable';});
  }
}
await check('401 sin JWT en tratamientos',async()=>{
  const r=await get('/api/treatment/my-treatments');assert.equal(r.status,401);return 'Rechazado correctamente';});
await check('403 medico en grupo de cuidado',async()=>{
  assert.ok(state.medico,'Login medico no disponible');const r=await get('/api/care/members',state.medico);assert.equal(r.status,403);return 'Acceso bloqueado';});
await check('403 paciente buscando fichas como medico',async()=>{
  assert.ok(state.paciente && state.dni,'Falta perfil paciente');
  const r=await get(`/api/doctor/patient/${state.dni}`,state.paciente);assert.equal(r.status,403);return 'Acceso bloqueado';});
if(state.appointment && state.familiar)await check('Aislamiento de notas entre pacientes',async()=>{
  const r=await get(`/api/appointments/${state.appointment.id_appointment}`,state.familiar);
  assert.equal(r.status,404,'La cuenta familiar no debe ver turnos ajenos');return 'Turno ajeno no divulgado';});

const passed=results.filter(x=>x.ok).length;
await mkdir(path.dirname(out),{recursive:true});
await writeFile(out,[
 '# MiSalud+ - Auditoria de ampliacion (API, solo lectura)','',
 `Fecha UTC: ${new Date().toISOString()}`,
 `**Resultado: ${passed} OK / ${results.length-passed} ERROR**`,'',
 '| Comprobacion | Estado | Detalle |','| --- | --- | --- |',
 ...results.map(x=>`| ${x.title} | ${x.ok?'OK':'ERROR'} | ${x.detail} |`),
 '', 'Esta auditoria **no** crea, modifica ni elimina registros. Utiliza cuentas y datos ficticios de las seeds.',
 'No evalua la ejecucion de funciones de escritura (editar recetas, tomar medicacion, revocar permisos, borrar adjuntos).',
 'No guarda JWT ni contrasenas. Las capturas se realizan por separado.', '',
].join('\n'),'utf8');
console.log(`\nInforme: ${out}\nResultado: ${passed} OK / ${results.length-passed} ERROR`);
if(passed!==results.length) process.exitCode=1;
