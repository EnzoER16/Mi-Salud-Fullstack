import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPatient, gql } from './helpers.mjs';

test('E2E 2: CRUD GraphQL reales de vacuna y turno', async () => {
  const { token } = await createPatient();
  const vaccine = (await gql(`mutation($input:CreateVaccineInput!){createVaccine(input:$input){id_vaccine name}}`, {
    input: { name: 'Vacuna E2E', applied_on: '2026-05-10' },
  }, token)).createVaccine;
  assert.equal(vaccine.name, 'Vacuna E2E');
  const changed = (await gql(`mutation($id:ID!,$input:UpdateVaccineInput!){updateVaccine(id:$id,input:$input){name notes}}`, {
    id: vaccine.id_vaccine, input: { notes: 'Verificado' },
  }, token)).updateVaccine;
  assert.equal(changed.notes, 'Verificado');
  assert.ok((await gql(`query{vaccines{id_vaccine}}`, {}, token)).vaccines.some(x => x.id_vaccine === vaccine.id_vaccine));
  assert.equal((await gql(`mutation($id:ID!){deleteVaccine(id:$id)}`, {
    id: vaccine.id_vaccine,
  }, token)).deleteVaccine, true);

  const at = new Date(Date.now() + 3 * 86400000).toISOString();
  const appointment = (await gql(`mutation($input:CreateAppointmentInput!){createAppointment(input:$input){id_appointment title}}`, {
    input: { title: 'Turno E2E', scheduled_at: at, modality: 'Virtual' },
  }, token)).createAppointment;
  assert.equal(appointment.title, 'Turno E2E');
  const updated = (await gql(`mutation($id:ID!,$input:UpdateAppointmentInput!){updateAppointment(id:$id,input:$input){modality}}`, {
    id: appointment.id_appointment, input: { modality: 'Presencial' },
  }, token)).updateAppointment;
  assert.equal(updated.modality, 'Presencial');
  assert.ok((await gql(`query{appointments{id_appointment}}`, {}, token)).appointments.some(x => x.id_appointment === appointment.id_appointment));
  assert.equal((await gql(`mutation($id:ID!){deleteAppointment(id:$id)}`, {
    id: appointment.id_appointment,
  }, token)).deleteAppointment, true);
});
