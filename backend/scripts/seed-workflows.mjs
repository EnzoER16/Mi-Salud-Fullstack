/** Complemento idempotente de la seed realista. No borra colecciones. */
const API=(process.env.API_ORIGIN||'http://localhost:3000').replace(/\/$/,'');
const PASS=process.env.DEMO_PASSWORD||'Demo2026!Segura';
const PATIENT=process.env.DEMO_PATIENT_EMAIL||'paciente.tp.demo@gmail.com';
const DOCTOR=process.env.DEMO_DOCTOR_EMAIL||'medico.tp.demo@gmail.com';
const FAMILY='familiar.tp.demo@gmail.com';
async function http(url,method='GET',body,token){
  const response=await fetch(`${API}${url}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{}) , ...(body!==undefined?{'Content-Type':'application/json'}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const text=await response.text();let value;try{value=text?JSON.parse(text):null}catch{value=text}
  if(!response.ok)throw new Error(`${method} ${url}: ${response.status} ${JSON.stringify(value).slice(0,180)}`);
  return value;
}
async function token(email){const result=await http('/api/auth/login','POST',{email,password:PASS});return result.token;}
async function ensure(email,name){try{return await token(email)}catch{
  try{await http('/api/auth/register','POST',{email,username:name,password:PASS,role:'Paciente'})}
  catch(e){throw new Error(`La cuenta ${email} existe con otra clave o no se pudo registrar: ${e.message}`)}
  return token(email);
}}
async function uploadFile(appointmentId,patientToken){
  const content='%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Contents 4 0 R>> endobj\n4 0 obj <</Length 0>> stream\nendstream endobj\ntrailer <</Root 1 0 R>>\n%%EOF';
  const form=new FormData();form.append('files',new Blob([content],{type:'application/pdf'}),'estudio-de-ejemplo.pdf');
  const resp=await fetch(`${API}/api/appointments/${appointmentId}/files`,{method:'POST',headers:{Authorization:`Bearer ${patientToken}`},body:form,signal:AbortSignal.timeout(20000)});
  if(!resp.ok)throw new Error(`No se pudo adjuntar el PDF de muestra: HTTP ${resp.status} ${await resp.text()}`);
}
try{
  console.log('MiSalud+ - ampliación de seed académica (datos ficticios)');
  const pt=await token(PATIENT),dt=await token(DOCTOR),ft=await ensure(FAMILY,'Mariana López');
  await http('/api/patient/profile','POST',{username:'Mariana Lopez',dni:'39990002',health_insurance:'OSEP',plan:'General',member_number:'DEM-2026-0148',address:'Domicilio ficticio de referencia'},ft);
  const grants=await http('/api/patient/doctor-access','GET',undefined,pt);
  if(!grants.some(g=>g.doctor_email===DOCTOR)){
    await http('/api/patient/doctor-access','POST',{email:DOCTOR},pt);
    console.log('  OK Acceso médico autorizado');
  }
  const members=await http('/api/care/members','GET',undefined,pt);
  if(!members.some(m=>m.member_email===FAMILY)){
    await http('/api/care/invitations','POST',{email:FAMILY,relationship:'Familiar'},pt);
  }
  const invitations=await http('/api/care/invitations/mine','GET',undefined,ft);
  for(const inv of invitations){if(inv.relationship==='Familiar')await http(`/api/care/invitations/${inv.id_member}/accept`,'POST',{},ft)}
  const updated=await http('/api/care/members','GET',undefined,pt);
  for(const m of updated){if(m.member_email===FAMILY && !m.can_view_record){await http(`/api/care/members/${m.id_member}/permissions`,'PATCH',{can_view_record:true},pt)}}
  console.log('  OK Grupo familiar autorizado');
  const authorized=await http('/api/doctor/patients','GET',undefined,dt);
  const target=authorized.find(p=>p.dni==='39990001');
  if(!target)throw new Error('La paciente de la seed realista no aparece en médicos autorizados');
  let consultations=await http(`/api/consultation/history/${target.id_patient}`,'GET',undefined,dt);
  let consult=consultations.find(c=>c.diagnosis==='Seguimiento de asma leve - control de ejemplo');
  if(!consult){const response=await http(`/api/consultation/${target.id_patient}`,'POST',
    {location:'Centro Médico Alameda',diagnosis:'Seguimiento de asma leve - control de ejemplo'},dt);consult=response.consultation;}
  console.log('  OK Consulta vinculada a la médica y paciente');
  const treatments=await http(`/api/treatment/patient/${target.id_patient}`,'GET',undefined,dt);
  if(!treatments.some(t=>t.id_consultation===consult.id_consultation&&t.medication==='Loratadina')){
    await http(`/api/treatment/${consult.id_consultation}`,'POST',
      {medication:'Loratadina',dose:'10 mg',frequency_hours:24,duration_days:7,instructions:'Tratamiento ficticio para el escenario académico'},dt);
    console.log('  OK Receta y tomas programadas');
  }
  const {data}=await (async()=>{
    const r=await http('/graphql','POST',{query:'query { appointments { id_appointment title scheduled_at } }'},pt);
    if(r.errors?.length)throw new Error(r.errors.map(e=>e.message).join(' / '));return r;
  })();
  const appointment=data.appointments.find(a=>a.title==='Control clínico anual')||data.appointments[0];
  if(appointment){
    const detail=await http(`/api/appointments/${appointment.id_appointment}`,'GET',undefined,pt);
    if(!detail.notes.some(n=>n.title==='Preguntas para la consulta')){
      await http(`/api/appointments/${appointment.id_appointment}/notes`,'POST',
        {title:'Preguntas para la consulta',content:'Revisar controles anuales y consultar sobre actividad física. Nota ficticia de presentación.'},pt);
    }
    if(!detail.files.some(f=>f.name==='estudio-de-ejemplo.pdf'))await uploadFile(appointment.id_appointment,pt);
    console.log('  OK Notas y archivo PDF de ejemplo en turno');
  }
  const info=await http('/api/notifications/my','GET',undefined,pt);
  console.log(`  OK Notificaciones existentes: ${info.notifications.length}`);
  console.log('Seed extendida completa. No se borraron documentos.');
}catch(e){console.error('ERROR:',e.message);process.exitCode=1}
