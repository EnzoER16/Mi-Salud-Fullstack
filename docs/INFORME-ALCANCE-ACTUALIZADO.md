# MiSalud+ | Informe tecnico del TP Integrador

**Programacion III — 03/11/2026**

**Integrantes:** Enzo Rojas, Lautaro Videla, Gustavo Vera, Matías Agüero

## 1. Problematica elegida

La informacion personal de salud suele repartirse entre recetas, turnos anotados, carnets de vacunacion y documentos de diferentes centros. Esto dificulta su consulta ordenada y el seguimiento de tratamientos. El problema se hace mayor cuando un familiar ayuda con el cuidado de una persona y necesita permisos limitados para acompanarla.

## 2. Solucion propuesta

MiSalud+ es una aplicacion web academica que centraliza perfiles, datos de salud, agenda de turnos, vacunacion y medicamentos. Dispone de portales diferenciados para pacientes y medicos, con autenticacion JWT y un modulo de cuidado compartido con consentimiento. Permite cargar consultas y tratamientos, administrar tomas, adjuntar documentacion a turnos y consultar notificaciones internas.

## 3. Arquitectura

**API Gateway (NestJS):** entrada HTTP, REST, GraphQL, DTO, JWT, controles de roles y Swagger. Expone el puerto 3000.

**Identity Service (NestJS TCP):** usuarios, perfiles, datos personales, contactos, permisos de acceso medico, invitaciones familiares y autorizaciones. Usa la base MongoDB `misalud_identity`.

**Clinical Service (NestJS TCP):** fichas medicas, vacunas, turnos, consultas, tratamientos, tomas, notificaciones, adjuntos GridFS y analisis descriptivos. Usa `misalud_clinical`.

**React + Vite:** interfaz en `frontend`, servida en el puerto 5173, con pantallas segun rol. **Docker Compose** inicia la API, los dos microservicios, MongoDB y React con una sola orden.

El navegador solo se conecta con el gateway; la comunicacion interna entre servicios usa TCP. Los permisos sobre datos medicos son validados del lado del servidor, y el acceso mediante DNI o QR requiere autorizacion.

## 4. Operaciones principales

- Registro/login, perfiles y datos personales, ficha y contactos de emergencia (REST).
- CRUD completo de vacunas y de turnos (GraphQL, cinco operaciones por recurso).
- Consentimiento de paciente para acceso medico por DNI o QR.
- Consultas, recetas, programacion y registro de tomas, adherencia y cambios de tratamiento.
- Grupos familiares con invitaciones, permisos y revocacion.
- Notificaciones internas y adjuntos de turno por GridFS.
- Resumen clinico descriptivo; Gemini solo opcional y sujeto a configuracion y consentimiento.

## 5. Calidad y testing

Los resultados de la instancia local del 03/11/2026 fueron:

| Comprobacion | Evidencia reportada |
| --- | --- |
| Infraestructura | 17/17 OK (Docker, Swagger, GraphQL, compilaciones y tests) |
| Funciones basicas REST/GraphQL | 15/15 OK |
| API de los modulos nuevos | 33/33 OK |
| Navegacion React de modulos nuevos | 13/13 OK |
| Operaciones de escritura reales | 14/14 OK, limpieza de QA OK |
| Pruebas unitarias backend | 5/5 OK |
| Pruebas E2E backend | 5/5 OK |
| Componentes React | 7/7 OK |

La auditoria de escrituras creo tres cuentas de QA separadas de las cuentas de demostracion; comprobó permisos 403, consultas, recetas, cambios, tomas, invitaciones, notificaciones, archivos y revocaciones, y limpio los registros temporales al finalizar. Esas pruebas no sustituyen una auditoria de seguridad profesional.

## 6. Riesgos y limites

Se trata de un prototipo local educativo y no de un producto listo para uso clinico. Google OAuth y correo SMTP no estan configurados. La integracion con un proveedor de IA es opcional y requiere una clave valida y consentimiento explicito. En un despliegue real serian necesarios controles mas estrictos sobre credenciales, permisos, datos sensibles, cifrado, profesionales, cumplimiento regulatorio y respaldos.

## 7. Puesta en marcha

```powershell
Copy-Item .\backend\.env.example .\backend\.env
# Editar JWT_SECRET en backend/.env
docker compose up -d --build
node .\backend\scripts\seed-demo.mjs
node .\backend\scripts\seed-realista.mjs
node .\backend\scripts\seed-workflows.mjs
```

Aplicacion: `http://localhost:5173`. Swagger: `http://localhost:3000/api/docs`. GraphQL: `http://localhost:3000/graphql`.

**Nota:** no subir datos reales de salud, archivos `.env`, tokens, respaldos ni logs locales. Los nombres y registros de las seeds son ficticios.
