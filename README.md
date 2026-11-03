# MiSalud+ | TP Integrador de Programacion III (2026)

**Plataforma academica de gestion de salud para pacientes, medicos y familiares autorizados.**

> Proyecto universitario de demostracion. Las cuentas y los registros de ejemplo son ficticios. No esta preparado para atender pacientes reales ni para desplegarse publicamente sin medidas adicionales de seguridad.

## Equipo

**Integrantes (COMPLETAR ANTES DE ENTREGAR):**

- Integrante 1: Enzo Rojas
- Integrante 2: Lautaro Videla
- Integrante 3: Gustavo Vera
- Integrante 4: Matías Agüero

**Materia:** Programacion III. **Entrega:** 03/11/2026.

## Problematica y solucion

Turnos, vacunas, antecedentes y medicacion suelen registrarse en lugares diferentes. MiSalud+ centraliza la informacion del paciente, ayuda a organizar los controles y permite compartir ciertos datos con profesionales y familiares **solo mediante autorizaciones**. Incluye roles diferenciados para paciente y medico y un flujo de seguimiento de tratamientos.

## Arquitectura y tecnologias

- **React + Vite:** interfaz web responsiva en `frontend-tp/`.
- **NestJS API Gateway:** expone REST y GraphQL, valida JWT/roles y publica Swagger.
- **Identity Service (NestJS TCP):** usuarios, perfiles, datos personales, contactos de emergencia, permisos medicos y grupos de cuidado. Base `misalud_identity`.
- **Clinical Service (NestJS TCP):** fichas, vacunas, turnos, consultas, tratamientos, tomas, notificaciones, adjuntos GridFS y analisis descriptivo. Base `misalud_clinical`.
- **MongoDB 8:** persistencia en dos bases logicas con volumen Docker.
- **Docker Compose:** orquesta MongoDB, Gateway, dos microservicios y el frontend.
- **Testing:** Vitest + React Testing Library, pruebas E2E con Node.js y pruebas funcionales reales mediante HTTP.

```text
Navegador (React :5173)
         |
         | HTTP / REST / GraphQL + JWT
         v
API Gateway NestJS (:3000) --- Swagger /api/docs
         |
         +--- TCP ---> Identity Service ---> MongoDB: misalud_identity
         |
         +--- TCP ---> Clinical Service ---> MongoDB: misalud_clinical
```

Los puertos TCP de los microservicios no estan publicados al navegador. El acceso medico por identificador o QR requiere autorizacion del paciente; conocer un DNI no concede permisos por si solo.

## Funcionalidades implementadas

- **Autenticacion:** registro, login JWT, roles y rutas protegidas.
- **Paciente:** perfil, datos personales ampliados, ficha medica, contactos de emergencia y credencial QR.
- **Vacunas:** CRUD GraphQL completo (crear, listar, consultar, actualizar, eliminar).
- **Turnos:** CRUD GraphQL completo; notas y adjuntos PDF/JPG/PNG almacenados en MongoDB GridFS.
- **Consulta medica:** acceso consentido por DNI/QR, registro de consultas e historial.
- **Tratamientos y tomas:** receta, modificacion, historial de cambios, programacion de dosis, registro, omision y reprogramacion.
- **Notificaciones internas:** listado y marcado como leidas.
- **Cuidado compartido:** invitaciones, aceptacion, permisos, revocacion y registro de actividad familiar.
- **Portal medico:** pacientes autorizados, consultas, recetas y analisis clinico descriptivo.
- **Interfaz responsiva:** pantallas de pacientes, medicos y familiar autorizado.

**Integraciones opcionales:** Gemini requiere API key y consentimiento especifico. Google OAuth y correos SMTP **no estan habilitados ni validados** en esta entrega local; no deben presentarse como operativos.

## Requisitos

- Docker Desktop + Docker Compose.
- Node.js 20+ y npm (para seeds, auditorias y pruebas ejecutadas en el host).
- Puertos libres: `5173` (React), `3000` (API), `27018` (MongoDB accesible solo en localhost).

## Instalacion y ejecucion (Windows PowerShell)

Clonar el repositorio y situarse en su raiz:

```powershell
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_CLONADA>
```

Preparar la configuracion local (el ejemplo **no** contiene secretos):

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

**Editar `backend/.env` y definir `JWT_SECRET` con un valor largo y aleatorio antes de iniciar.** No subir `.env` a GitHub. El `docker-compose.yml` sobrescribe internamente las URI de MongoDB con las direcciones de Docker.

Levantar la pila:

```powershell
docker compose up -d --build
docker compose ps
```

Direcciones:

| Recurso | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API Gateway / Health | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |
| JSON OpenAPI | http://localhost:3000/api/docs-json |
| GraphQL | http://localhost:3000/graphql |

Detener los contenedores **sin borrar MongoDB**:

```powershell
docker compose down
```

No utilizar `docker compose down -v` si se quieren conservar las bases de datos.

## Cargar datos ficticios de presentacion

Con Docker funcionando y sobre una base de **desarrollo**:

```powershell
node .\backend\scripts\seed-demo.mjs
node .\backend\scripts\seed-realista.mjs
node .\backend\scripts\seed-workflows.mjs
```

El orden es importante: primero crea las cuentas basicas; luego completa datos personales, vacuna y agenda; por ultimo agrega permisos, una consulta, tratamiento, notas y archivo de muestra.

Cuentas previstas: `paciente.tp.demo@gmail.com`, `medico.tp.demo@gmail.com`, `familiar.tp.demo@gmail.com`. La contrasena de demo se controla con `DEMO_PASSWORD` o con la configuracion de las seeds. **No ejecutar contra pacientes reales.** Las seeds conservan cuentas y registros no pertenecientes a sus identificadores de demostracion.

## APIs y Swagger

La referencia de REST esta en `/api/docs`; se puede usar el boton `Authorize` con un JWT de demostracion.

**GraphQL: dos CRUD completos** sobre `http://localhost:3000/graphql`:

| Dominio | Lectura | Escritura |
| --- | --- | --- |
| Vacunas | `vaccines`, `vaccine(id)` | `createVaccine`, `updateVaccine`, `deleteVaccine` |
| Turnos | `appointments`, `appointment(id)` | `createAppointment`, `updateAppointment`, `deleteAppointment` |

Las operaciones estan protegidas por autenticacion y autorizacion. Las consultas medicas compartidas y las recetas tienen controles adicionales de consentimiento y propiedad.

## Pruebas

Con la pila Docker iniciada:

```powershell
npm --prefix backend run test:unit
npm --prefix backend run test:e2e
node --test .\backend\tests\e2e\workflows.test.mjs
npm --prefix frontend-tp test
npm --prefix frontend-tp run build
```

Pruebas de alcance ampliado (si se incorpora la carpeta `qa/`):

```powershell
node .\qa\auditar-api.mjs
node .\qa\auditar-escrituras.mjs
```

**Advertencia:** `auditar-escrituras.mjs` crea tres usuarios QA temporales y ejecuta cambios reales en MongoDB local. Valida la limpieza al finalizar, pero una interrupcion puede dejar registros temporales. **No ejecutar en produccion ni contra una base compartida.**

### Resultados obtenidos el 03/11/2026

Los informes de la ejecucion local indicaron:

| Auditoria | Resultado |
| --- | --- |
| Infraestructura, Swagger, GraphQL y compilaciones | 17 OK / 0 ERROR |
| Pruebas funcionales iniciales | 15 OK / 0 ERROR |
| Auditoria API de la ampliacion (lectura/permisos) | 33 OK / 0 ERROR |
| Auditoria React de la ampliacion | 13 OK / 0 ERROR |
| Auditoria de operaciones de escritura | 14 OK / 0 ERROR, limpieza OK |
| Unit tests backend | 5/5 |
| E2E backend base + ampliacion | 5/5 |
| Tests React | 7/7 |

Son resultados de la instancia local evaluada, no una garantia de ejecucion en todos los equipos. Las capturas y los logs completos pueden mantenerse como evidencias locales o incorporarse de forma selectiva a la entrega.

## Estructura de carpetas

```text
backend/
  apps/api-gateway/          API publica REST/GraphQL + Swagger
  apps/identity-service/     Usuarios, perfiles, accesos y cuidado
  apps/clinical-service/     Registro clinico, turnos y tratamientos
  scripts/                   Seeds de desarrollo
  tests/                     Pruebas unitarias y E2E
frontend-tp/                 Aplicacion React actual
frontend/                    Frontend historico, si sigue conservado
qa/                          Auditorias complementarias (si se incluyen)
docs/                        Documentacion academica
docker-compose.yml            Contenedores de desarrollo
```

## Documentacion complementaria

- [`docs/INFORME-ALCANCE-ACTUALIZADO.md`](docs/INFORME-ALCANCE-ACTUALIZADO.md): problema, solucion, componentes, seguridad, pruebas y limites.
- [`docs/ARQUITECTURA-TP.md`](docs/ARQUITECTURA-TP.md): diagrama y descripcion de la arquitectura inicial.

## Seguridad y limitaciones

Prototipo academico local. Para uso real harian falta endurecimiento de MongoDB y de la red, gestion segura de secretos, controles de acceso clinico mas exhaustivos, verificacion de identidad y matricula profesional, cifrado, privacidad y backups, tratamiento regulatorio de datos de salud y mecanismos de correo/IA formalmente configurados y autorizados.

Los nombres, instituciones, telefonos, documentos y antecedentes de la seed son ficticios. La ausencia de una marca superpuesta en las capturas no cambia esa condicion.
