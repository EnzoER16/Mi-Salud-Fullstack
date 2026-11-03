/**
 * MiSalud+ | Auditoria E2E de operaciones de escritura.
 * Crea SOLO 3 usuarios de QA de este proceso, hace cambios via HTTP y limpia por IDs exactos en Mongo.
 * No utiliza, modifica ni borra las cuentas de la seed realista.
 * Requiere Node 20+, backend/node_modules y Mongo local de Docker Compose en 127.0.0.1:27018.
 */
import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const reqBackend=createRequire(path.join(root,'backend','package.json'));
const { MongoClient, ObjectId, GridFSBucket }=reqBackend('mongoose').mongo;
const mongoUri=process.env.MONGO_QA_URI||'mongodb://127.0.0.1:27018';
const base=(process.env.API_ORIGIN||'http://127.0.0.1:3000').replace(/\/$/,'');
const id=`qa-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(root,'evidencias-tp',`ESCRITURAS-${timestamp}.md`);
const steps=[];
const state={users:[], patientId:null, doctorId:null, appointmentIds:[], consultationIds:[], treatmentIds:[], memberIds:[], tokens:{}};
let client, identity, clinical, fatal=null, cleanupErrors=[];
const marker='QA_MISALUD_'+id;
const name=(kind)=>`${marker}_${kind}`;
const password=`QA!${randomBytes(16).toString('hex')}`;
const email=(kind)=>`${id}-${kind}@example.com`;

function oid(v){assert.match(String(v),/^[0-9a-fA-F]{24}$/,'Identificador no válido');return new ObjectId(String(v));}
function errText(e){return String(e?.message||e).replace(/\|/g,'/').replace(/[\r\n\t]+/g,' ').slice(0,280);}
const sleep=(ms)=>new Promise(res=>setTimeout(res,ms));
function safeRoute(s){assert.ok(s.startsWith('/'));return s;}
async function http(route,{method='GET',token,body,form,raw=false}={}){
  assert.ok(!(body!==undefined&&form),'No puede enviarse JSON y formulario juntos');
  const response=await fetch(base+safeRoute(route),{
    method,headers:{...(token?{Authorization:`Bearer ${token}`}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:form?{body:form}:{}),
    signal:AbortSignal.timeout(30000),
  });
  if(raw)return {status:response.status,type:response.headers.get('content-type'),data:Buffer.from(await response.arrayBuffer())};
  const text=await response.text();let data;
  try{data=text?JSON.parse(text):{};}catch{data={message:text.slice(0,200)}}
  return {status:response.status,data};
}
function expect(response,status=200){
  assert.equal(response.status,status,`HTTP ${response.status} (esperado ${status}): ${JSON.stringify(response.data).slice(0,180)}`);
  return response.data;
}
async function api(route,method='GET',body,token,status=200){return expect(await http(route,{method,body,token}),status);}
async function apiCreated(route,body,token){
  const response=await http(route,{method:'POST',body,token});
  assert.ok(response.status===200||response.status===201,`HTTP ${response.status} (esperado 200/201): ${JSON.stringify(response.data).slice(0,180)}`);
  return response.data;
}
async function gql(query,variables,token){
  const response=expect(await http('/graphql',{method:'POST',body:{query,variables},token}));
  if(response.errors?.length)throw new Error('GraphQL: '+response.errors.map(x=>x.message).join('; '));
  assert.ok(response.data,'GraphQL sin datos');return response.data;
}
async function step(title,fn){
  try{const detail=await fn();steps.push({title,ok:true,detail:String(detail||'Comprobado')});console.log('OK    '+title);}
  catch(e){steps.push({title,ok:false,detail:errText(e)});console.error('ERROR '+title+': '+errText(e));throw e;}
}
async function register(kind,role,withProfile){
  const account={kind,role,email:email(kind),username:name(kind)};
  state.users.push(account); // Registrar intento antes del POST para poder limpiar aun si la respuesta falla.
  const reg=await api('/api/auth/register','POST',{username:account.username,email:account.email,password,role},undefined,201);
  const login=await api('/api/auth/login','POST',{email:account.email,password});
  assert.ok(login.token&&login.user?.role===role,'El login no devolvió rol/JWT válido');
  account.userId=String(login.user?.id_user||reg?.id_user||'');oid(account.userId);
  state.tokens[kind]=login.token;
  if(withProfile){
    if(role==='Paciente'){
      const dni=String(50000000+Math.floor(Math.random()*30000000));
      const response=await apiCreated('/api/patient/profile',{username:account.username,dni},login.token);
      account.patientId=String(response.profile?.id_patient||'');oid(account.patientId);
      if(kind==='patient')state.patientId=account.patientId;
    }else{
      const response=await apiCreated('/api/doctor/profile',{username:account.username,specialty:'Medicina general',license_number:'QA-2026-'+id.slice(-6)},login.token);
      account.doctorId=String(response.profile?.id_doctor||'');oid(account.doctorId);state.doctorId=account.doctorId;
    }
  }
  return account;
}
const P=()=>state.tokens.patient,D=()=>state.tokens.doctor,F=()=>state.tokens.family;
const p=()=>state.patientId;
const u=(kind)=>state.users.find(x=>x.kind===kind);
const clinicalColl=(c)=>clinical.collection(c);

// Una limpieza controlada por usuario/IDs. Nunca usa dropDatabase, dropCollection ni filtros vacíos.
async function cleanup(){
  if(!identity||!clinical)return;
  try{
    const known=await identity.collection('users').find({email:{$in:state.users.map(x=>x.email)}}).toArray();
    for(const account of state.users){
      const found=known.find(x=>x.email===account.email);
      if(found){
        assert.ok(found.username===account.username&&found.role===account.role&&found.email.includes(id)
          &&(!account.userId||found._id.toString()===account.userId),
          'La verificación de propiedad del usuario QA falló. Se cancela limpieza para evitar afectar datos ajenos.');
        account.userId=found._id.toString();
      }
    }
    const ids=state.users.map(x=>x.userId).filter(Boolean);
    // Recuperar perfiles aunque la API haya respondido de forma inesperada tras crearlos.
    for(const account of state.users){
      if(!account.userId)continue;
      if(account.role==='Paciente'&&!account.patientId){
        const prof=await identity.collection('patient_profiles').findOne({id_user:account.userId});
        if(prof)account.patientId=prof._id.toString();
      }
      if(account.role==='Doctor'&&!account.doctorId){
        const prof=await identity.collection('doctor_profiles').findOne({id_user:account.userId});
        if(prof)account.doctorId=prof._id.toString();
      }
    }
    if(!state.patientId)state.patientId=state.users.find(x=>x.kind==='patient')?.patientId||null;
    const patIds=[...new Set(state.users.map(x=>x.patientId).filter(Boolean))];
    const docIds=state.users.map(x=>x.doctorId).filter(Boolean);
    if(p()){
      const consults=await clinicalColl('consultations').find({patient_id:p()}).project({_id:1}).toArray();
      const consultationIds=consults.map(x=>x._id.toString());
      const treatments=consultationIds.length?await clinicalColl('treatments').find({consultation_id:{$in:consultationIds}}).project({_id:1}).toArray():[];
      const treatmentIds=treatments.map(x=>x._id.toString());
      const appointments=await clinicalColl('appointments').find({id_patient:p()}).project({_id:1}).toArray();
      const appointmentIds=appointments.map(x=>x._id.toString());
      const attachmentRows=appointmentIds.length?await clinicalColl('appointment_files').find({appointment_id:{$in:appointmentIds}}).toArray():[];
      const bucket=new GridFSBucket(clinical,{bucketName:'appointment_uploads'});
      for(const attachment of attachmentRows){
        try {await bucket.delete(oid(attachment.gridfs_id));}
        catch(e){cleanupErrors.push(`GridFS ${attachment._id}: ${errText(e)}`);}
      }
      if(appointmentIds.length){
        await clinicalColl('appointment_files').deleteMany({appointment_id:{$in:appointmentIds}});
        await clinicalColl('appointment_notes').deleteMany({appointment_id:{$in:appointmentIds}});
        await clinicalColl('appointments').deleteMany({_id:{$in:appointments.map(x=>x._id)},id_patient:p()});
      }
      if(treatmentIds.length)await clinicalColl('medication_intakes').deleteMany({treatment_id:{$in:treatmentIds}});
      if(consultationIds.length)await clinicalColl('treatments').deleteMany({consultation_id:{$in:consultationIds}});
      await clinicalColl('consultations').deleteMany({patient_id:p()});
      await clinicalColl('care_activities').deleteMany({patient_id:p()});
      await clinicalColl('vaccines').deleteMany({id_patient:p()});
      await clinicalColl('medical_records').deleteMany({id_patient:p()});
      await clinicalColl('patient_health').deleteMany({id_patient:p()});
      await identity.collection('doctor_access').deleteMany({patient_id:p()});
      await identity.collection('care_members').deleteMany({patient_id:p()});
    }
    if(ids.length){
      await clinicalColl('notifications').deleteMany({user_id:{$in:ids}});
    }
    if(patIds.length){
      await identity.collection('patient_details').deleteMany({id_patient:{$in:patIds}});
      await identity.collection('emergency_contacts').deleteMany({id_patient:{$in:patIds}});
    }
    if(docIds.length)await identity.collection('doctor_details').deleteMany({id_doctor:{$in:docIds}});
    for(const account of state.users){
      if(!account.userId)continue;
      if(account.patientId)await identity.collection('patient_profiles').deleteOne({_id:oid(account.patientId),id_user:account.userId});
      if(account.doctorId)await identity.collection('doctor_profiles').deleteOne({_id:oid(account.doctorId),id_user:account.userId});
      await identity.collection('users').deleteOne({_id:oid(account.userId),email:account.email,username:account.username});
    }
    const remaining=await identity.collection('users').countDocuments({email:{$in:state.users.map(x=>x.email)}});
    if(remaining)cleanupErrors.push(`Quedaron ${remaining} usuarios temporales (no se borró ningún otro usuario).`);
    if(p()&&await clinicalColl('consultations').countDocuments({patient_id:p()}))cleanupErrors.push('Quedaron consultas QA');
  }catch(e){cleanupErrors.push(errText(e));}
}

async function checkPreconditions(){
  assert.ok(Number(process.versions.node.split('.')[0])>=20,'Se requiere Node 20+');
  const au=new URL(base),mu=new URL(mongoUri);
  assert.ok(au.protocol==='http:'&&['127.0.0.1','localhost'].includes(au.hostname)&&Number(au.port)===3000,
    'Por seguridad, solo se permite API local en puerto 3000.');
  assert.ok(mu.protocol==='mongodb:'&&['127.0.0.1','localhost'].includes(mu.hostname)&&Number(mu.port)===27018,
    'Por seguridad, Mongo QA debe ser local y usar el puerto 27018.');
  client=new MongoClient(mongoUri,{serverSelectionTimeoutMS:3500});await client.connect();
  identity=client.db('misalud_identity');clinical=client.db('misalud_clinical');
  await identity.command({ping:1});await clinical.command({ping:1});
  const health=await api('/api/health');
  assert.equal(health.gateway,'ok','API Gateway no responde OK');
}

try{
  await step('Conexión local, API y MongoDB seguros',checkPreconditions);
  await step('Crear 3 cuentas aisladas de QA',async()=>{
    await register('patient','Paciente',true);
    await register('doctor','Doctor',true);
    await register('family','Paciente',true);
    return 'Tres usuarios temporales con ID de ejecución exclusivo';
  });
  await step('Ficha médica temporal',async()=>{
    const result=await apiCreated('/api/medical-record/',{blood_group:'A+',allergies:'Sin alergias consignadas (QA)',antecedents:'Ficha temporal automatizada'},P());
    assert.ok(result.medical_record||result.message);return 'Ficha médica escrita en Clinical';
  });
  await step('Médico bloqueado antes de recibir autorización',async()=>{
    const r=await http(`/api/doctor/patient/qr/${p()}`,{token:D()});expect(r,403);return 'HTTP 403';
  });
  await step('Autorizar médico y consultar ficha',async()=>{
    await apiCreated('/api/patient/doctor-access',{email:u('doctor').email},P());
    const patient=await api(`/api/doctor/patient/qr/${p()}`,'GET',undefined,D());
    assert.equal(patient.id_patient,p());return 'Consentimiento aplicado';
  });
  await step('Crear consulta y tratamiento con receta',async()=>{
    const r=await apiCreated(`/api/consultation/${p()}`,{location:'QA - Consultorio temporal',diagnosis:marker},D());
    const consult=r.consultation;assert.ok(consult?.id_consultation);state.consultationIds.push(consult.id_consultation);
    const created=await apiCreated(`/api/treatment/${consult.id_consultation}`,
      {medication:'Paracetamol',dose:'250 mg',frequency_hours:2,duration_days:1,instructions:'Prueba de escritura: no utilizar como indicación médica'},D());
    const treatment=created.treatment;assert.ok(treatment?.id_treatment);state.treatmentIds.push(treatment.id_treatment);
    return 'Consulta, receta y tomas generadas';
  });
  await step('Editar tratamiento y registrar historial',async()=>{
    const tid=state.treatmentIds[0];
    await api(`/api/treatment/${tid}`,'PATCH',{dose:'500 mg',frequency_hours:2,duration_days:1},D());
    const history=await api(`/api/treatment/${tid}/history`,'GET',undefined,D());
    assert.ok(Array.isArray(history)&&history.length>=1,'No se guardó historial');return 'Historial persistido';
  });
  await step('Invitar a un familiar, aceptar y modificar permisos',async()=>{
    const inv=await apiCreated('/api/care/invitations',{email:u('family').email,relationship:'Familiar'},P());
    assert.ok(inv.id_member);state.memberIds.push(inv.id_member);
    const blocked=await http(`/api/care/patients/${p()}/medical-record`,{token:F()});expect(blocked,403);
    await apiCreated(`/api/care/invitations/${inv.id_member}/accept`,{},F());
    await api(`/api/care/members/${inv.id_member}/permissions`,'PATCH',{can_view_record:true,can_record_intakes:true},P());
    const record=await api(`/api/care/patients/${p()}/medical-record`,'GET',undefined,F());
    assert.ok(record.blood_group==='A+'||record.medical_record?.blood_group==='A+');
    return 'Acceso familiar y permisos aplicados';
  });
  await step('Registrar una toma desde el paciente',async()=>{
    const tid=state.treatmentIds[0];
    const docs=await clinicalColl('medication_intakes').find({treatment_id:tid,status:'Pendiente'}).sort({scheduled_time:1}).toArray();
    const due=docs.find(x=>new Date(x.scheduled_time).getTime()<=Date.now());
    assert.ok(due,'No hay toma vencida para validar');
    const changed=await api(`/api/intake/${due._id}/check`,'PATCH',{},P());
    assert.equal(changed.intake?.status,'Tomado');return 'Toma registrada en Clinical';
  });
  await step('Reprogramar y registrar toma por familiar autorizado',async()=>{
    const tid=state.treatmentIds[0];
    await api(`/api/treatment/${tid}/reschedule`,'PATCH',{new_time:new Date(Date.now()+2500).toISOString()},P());
    await sleep(3200);
    const docs=await clinicalColl('medication_intakes').find({treatment_id:tid,status:'Pendiente'}).sort({scheduled_time:1}).toArray();
    assert.ok(docs.length>=3,'No hay suficientes tomas para comprobar permisos');
    const done=await api(`/api/care/patients/${p()}/intakes/${docs[0]._id}/check`,'PATCH',{},F());
    assert.equal(done.intake.status,'Tomado');
    const activity=await api(`/api/care/patients/${p()}/activity`,'GET',undefined,F());
    assert.ok(activity.some(x=>x.id_intake===docs[0]._id.toString()),'La auditoría de cuidado no registró la acción');
    return 'Toma de familiar y registro de auditoría';
  });
  await step('Omitir y posponer tomas con permisos de paciente',async()=>{
    const tid=state.treatmentIds[0];
    const pending=await clinicalColl('medication_intakes').find({treatment_id:tid,status:'Pendiente'}).sort({scheduled_time:1}).limit(3).toArray();
    assert.ok(pending.length>=2);
    const skipped=await api(`/api/intake/${pending[0]._id}/skip`,'PATCH',{},P());assert.equal(skipped.intake.status,'Omitido');
    const before=new Date(pending[1].scheduled_time).getTime();
    const postponed=await api(`/api/intake/${pending[1]._id}/postpone`,'PATCH',{},P());
    assert.ok(new Date(postponed.intake.scheduled_time).getTime()>before);return 'Toma omitida y otra pospuesta';
  });
  await step('Notificaciones: marcar individual y todas como leídas',async()=>{
    const r=await api('/api/notifications/my','GET',undefined,P());
    assert.ok(r.notifications.length>0,'La receta no generó notificación');
    await api(`/api/notifications/${r.notifications[0].id_notification}/read`,'PATCH',{},P());
    await api('/api/notifications/read-all','PATCH',{},P());
    const again=await api('/api/notifications/my','GET',undefined,P());
    assert.equal(again.unread_count,0);return 'Notificaciones actualizadas';
  });
  await step('Turno GraphQL con nota, archivo PNG y descarga',async()=>{
    const date=new Date(Date.now()+3*86400000).toISOString();
    const data=await gql(`mutation($input:CreateAppointmentInput!){createAppointment(input:$input){id_appointment title}}`,
      {input:{title:marker,scheduled_at:date,modality:'Virtual'}},P());
    const ap=data.createAppointment;assert.ok(ap?.id_appointment);state.appointmentIds.push(ap.id_appointment);
    const note=await apiCreated(`/api/appointments/${ap.id_appointment}/notes`,{title:'QA nota temporal',content:'Nota creada para test'},P());
    assert.ok(note.id_note);
    await api(`/api/appointments/notes/${note.id_note}`,'PATCH',{content:'Nota editada y verificada'},P());
    const detail=await api(`/api/appointments/${ap.id_appointment}`,'GET',undefined,P());
    assert.ok(detail.notes.some(n=>n.id_note===note.id_note&&n.content==='Nota editada y verificada'));
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YlxLx8AAAAASUVORK5CYII=','base64');
    const form=new FormData();form.append('files',new Blob([png],{type:'image/png'}),`${marker}.png`);
    const uploaded=expect(await http(`/api/appointments/${ap.id_appointment}/files`,{method:'POST',token:P(),form}),201);
    const file=uploaded.files?.[0];assert.ok(file?.id_file);
    const downloaded=await http(`/api/appointments/files/${file.id_file}`,{token:P(),raw:true});
    assert.equal(downloaded.status,200);assert.deepEqual(downloaded.data.subarray(0,8),png.subarray(0,8));
    await api(`/api/appointments/files/${file.id_file}`,'DELETE',undefined,P());
    await api(`/api/appointments/notes/${note.id_note}`,'DELETE',undefined,P());
    const removed=await gql(`mutation($id:ID!){deleteAppointment(id:$id)}`,{id:ap.id_appointment},P());
    assert.equal(removed.deleteAppointment,true);return 'Nota, GridFS y turno completados y eliminados';
  });
  await step('Revocar permisos y verificar respuesta 403',async()=>{
    await api(`/api/care/members/${state.memberIds[0]}`,'DELETE',undefined,P());
    expect(await http(`/api/care/patients/${p()}/medical-record`,{token:F()}),403);
    await api(`/api/patient/doctor-access/${u('doctor').userId}`,'DELETE',undefined,P());
    expect(await http(`/api/doctor/patient/qr/${p()}`,{token:D()}),403);
    return 'Accesos eliminados y bloqueados';
  });
}catch(e){fatal=e;}
finally{
  await cleanup();
  const ok=steps.filter(x=>x.ok).length;
  await mkdir(path.dirname(output),{recursive:true});
  const report=[
    '# MiSalud+ - Auditoría de operaciones de escritura','',
    `Fecha UTC: ${new Date().toISOString()}`,
    `Identificador QA: \`${id}\``,
    `**Resultado: ${ok} OK / ${steps.length-ok} ERROR**`,'',
    '| Comprobación | Estado | Detalle |','| --- | --- | --- |',
    ...steps.map(x=>`| ${x.title} | ${x.ok?'OK':'ERROR'} | ${x.detail.replace(/\|/g,'/')} |`),'',
    `**Limpieza: ${cleanupErrors.length?'REVISAR':'OK'}**`,'',
    ...(cleanupErrors.length?cleanupErrors.map(e=>'- '+e):['Los usuarios y datos temporales del proceso se eliminaron por identificadores exactos.']),
    '', 'No se utilizaron usuarios de la seed realista. No se guardaron tokens ni contraseñas. No se ejecutó Git.',
  ].join('\n');
  await writeFile(output,report,'utf8');
  console.log(`\nInforme: ${output}`);
  console.log(`Resultado: ${ok} OK / ${steps.length-ok} ERROR`);
  console.log(`Limpieza: ${cleanupErrors.length?'REVISAR':'OK'}`);
  if(fatal||cleanupErrors.length)process.exitCode=1;
  await client?.close().catch(()=>{});
}
