import {test} from 'node:test';
import assert from 'node:assert/strict';
const BASE=process.env.API_ORIGIN||'http://localhost:3000';
const PASS=process.env.DEMO_PASSWORD||'Demo2026!Segura';
async function call(path,method='GET',data,token){
  const r=await fetch(`${BASE}${path}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{}) ,...(data?{'Content-Type':'application/json'}:{})},
    ...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(12000)});
  let result;try{result=await r.json()}catch{result={}}
  return {status:r.status,body:result};
}
async function login(email){const r=await call('/api/auth/login','POST',{email,password:PASS});assert.equal(r.status,200);return r.body.token;}
test('Paciente autoriza al médico y ve su grupo de cuidado',async()=>{
  const p=await login(process.env.DEMO_PATIENT_EMAIL||'paciente.tp.demo@gmail.com');
  const grants=await call('/api/patient/doctor-access','GET',undefined,p);assert.equal(grants.status,200);
  assert.ok(Array.isArray(grants.body));
  const group=await call('/api/care/members','GET',undefined,p);assert.equal(group.status,200);
  assert.ok(Array.isArray(group.body));
});
test('Profesional solo consulta pacientes autorizados',async()=>{
  const d=await login(process.env.DEMO_DOCTOR_EMAIL||'medico.tp.demo@gmail.com');
  const list=await call('/api/doctor/patients','GET',undefined,d);assert.equal(list.status,200);
  assert.ok(Array.isArray(list.body));
  const unknown=await call('/api/doctor/patient/qr/507f1f77bcf86cd799439011','GET',undefined,d);
  assert.equal(unknown.status,403);
});
test('Notas de turno: requiere rol paciente, sin token responde 401',async()=>{
  const r=await call('/api/appointments/507f1f77bcf86cd799439011','GET');assert.equal(r.status,401);
});
