# MiSalud+ — Memoria técnica del TP Integrador

## Problemática

La información de salud personal suele estar distribuida entre papeles, aplicaciones y distintos prestadores. Esto dificulta el seguimiento de vacunas, turnos y antecedentes y puede producir pérdidas de información.

## Solución propuesta

MiSalud+ ofrece una plataforma para pacientes y médicos. Permite registrar usuarios, autenticar mediante JWT, administrar perfiles y datos personales, guardar fichas médicas y contactos de emergencia, y gestionar vacunas y turnos. Los datos de demostración son ficticios y **no reemplazan la atención médica profesional**.

## Arquitectura

- **API Gateway (NestJS)**: punto de entrada REST y GraphQL, validación de DTO y JWT, autorización y Swagger. Puerto 3000.
- **Identity Service (NestJS TCP)**: usuarios, registro/login, perfiles y contactos, base MongoDB `misalud_identity`. Puerto TCP 4001 interno.
- **Clinical Service (NestJS TCP)**: fichas médicas, vacunas y turnos; base MongoDB `misalud_clinical`. Puerto TCP 4002 interno.
- **MongoDB 8**: una instancia con bases diferenciadas por responsabilidad; volumen persistente de Docker.
- **React/Vite**: interfaz de demostración `frontend` en el puerto 5173, con vistas protegidas para pacientes.

Los microservicios usan `@MessagePattern` y los clientes TCP de NestJS. No se exponen los puertos TCP al navegador: el usuario se comunica solamente con el gateway. El identificador del paciente se obtiene desde el JWT y su perfil en Identity Service; no se confía en identificadores enviados por el navegador para modificar información clínica propia.

## CRUD GraphQL

- `vaccines`, `vaccine(id)`, `createVaccine`, `updateVaccine`, `deleteVaccine`.
- `appointments`, `appointment(id)`, `createAppointment`, `updateAppointment`, `deleteAppointment`.

Ambos CRUD están en `http://localhost:3000/graphql`; sus datos se guardan en `misalud_clinical`.

## Calidad y validación

- Pruebas unitarias con Vitest, sobre DTO reales de autenticación y ficha médica.
- Dos escenarios E2E con `node:test` + `fetch` contra la pila completa: registro/login/permisos y CRUD GraphQL real.
- Pruebas de componentes React con React Testing Library y Vitest.
- Swagger/OpenAPI en `/api/docs` y especificación en `/api/docs-json`.

## Alcance y límites

La interfaz `frontend` incluye autenticacion, perfiles, ficha medica, vacunas, turnos, consultas, tratamientos, tomas, notificaciones, autorizaciones y cuidado familiar, ademas de notas y adjuntos. Google OAuth y correo SMTP no estan habilitados en la entrega; Gemini es opcional y requiere consentimiento y configuracion. La instancia MongoDB local no dispone de autenticacion, por lo que Docker Compose esta pensado para desarrollo academico y no para produccion.

**Integrantes:** completar nombres y roles antes de entregar.
