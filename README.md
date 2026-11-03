# MiSalud+ | TP Integrador de Programación III (2026)

<img src="frontend/public/logo-icon.png" alt="Logotipo de MiSalud+" width="96">

**Plataforma web académica para gestionar información de salud de pacientes y compartirla de forma controlada con médicos y familiares autorizados.**

## Integrantes:

- Enzo Rojas
- Lautaro Videla
- Gustavo Vera
- Matías Agüero

## 1. Problemática, destinatarios y solución

La información sobre turnos, vacunas, antecedentes médicos, medicación y documentos de atención suele distribuirse entre distintas fuentes. Esto dificulta el acceso oportuno, el seguimiento de tratamientos y la coordinación del cuidado.

MiSalud+ propone centralizar esos registros y permitir que cada paciente controle quién puede consultar determinada información. La solución aporta a:

- **Pacientes:** organización de turnos, vacunas, ficha médica y tratamientos, con registro de tomas.
- **Médicos:** consulta de información pertinente de pacientes que hayan otorgado autorización y registro de consultas y recetas.
- **Familiares/cuidadores:** acompañamiento con permisos específicos, sin acceso irrestricto a los datos.
- **Personal de enfermería y centros sanitarios:** la información ordenada y el seguimiento de medicación pueden facilitar la continuidad de la atención. **No existe en esta entrega un rol de enfermería ni un módulo institucional de centros de salud**; son posibles extensiones del prototipo.

El objetivo es mejorar la **organización y disponibilidad de información**, la **adherencia a los tratamientos** y la **coordinación de cuidados**. Se trata de un escenario de demostración local, no de una historia clínica interoperable con instituciones reales.

## 2. Arquitectura y tecnologías

| Componente | Tecnología | Responsabilidad |
| --- | --- | --- |
| Interfaz | React + Vite | Componentes reutilizables y vistas responsivas según el acceso del usuario |
| API Gateway | NestJS | Endpoints REST, GraphQL, autenticación JWT, validación, autorización y Swagger |
| Identity Service | NestJS, transporte TCP | Cuentas, roles, perfiles, datos personales, contactos de emergencia, autorizaciones y cuidado compartido |
| Clinical Service | NestJS, transporte TCP | Ficha médica, vacunas, turnos, consultas, tratamientos, tomas, notificaciones, documentos y análisis descriptivo |
| Persistencia | MongoDB 8 y GridFS | Dos bases de datos lógicas y almacenamiento de archivos asociados a turnos |
| Despliegue local | Docker y Docker Compose | Construcción y orquestación de los cinco servicios |
| Calidad | Vitest, React Testing Library, Node.js Test Runner | Pruebas unitarias, E2E y verificaciones funcionales |

```text
Navegador / React :5173
          |
          | HTTP (REST y GraphQL) + JWT
          v
API Gateway / NestJS :3000 ------ Swagger /api/docs
          |
          +---- TCP ----> Identity Service ----> MongoDB / misalud_identity
          |
          +---- TCP ----> Clinical Service ----> MongoDB / misalud_clinical
                                                 + GridFS para adjuntos
```

**Decisiones de diseño:** el navegador utiliza un único punto de entrada (API Gateway); los microservicios se comunican internamente por TCP; cada dominio concentra sus responsabilidades y mantiene sus datos en una base lógica de MongoDB. El frontend no debe decidir por sí solo si una persona tiene acceso: esa autorización se comprueba en el backend.

Los microservicios no exponen sus puertos TCP directamente al navegador. El QR y la búsqueda por DNI **no conceden acceso automáticamente**: se requiere autorización previa del paciente.

## 3. Funcionalidades implementadas

| Módulo | Funcionalidades |
| --- | --- |
| Autenticación | Registro, inicio de sesión, JWT, distinción de roles `Paciente` y `Médico`, recursos protegidos |
| Paciente | Perfil, datos personales, ficha médica, contactos de emergencia y credencial QR |
| Vacunación | CRUD GraphQL: crear, consultar, listar, actualizar y eliminar vacunas |
| Turnos | CRUD GraphQL: crear, consultar, listar, actualizar y eliminar turnos |
| Documentos de turno | Notas y adjuntos PDF/JPG/PNG; archivos guardados con MongoDB GridFS |
| Consultas médicas | Acceso autorizado por DNI/QR, registro de consultas e historial |
| Medicación | Recetas, edición e historial de cambios, generación de tomas, registro, omisión y reprogramación |
| Notificaciones | Consulta de notificaciones internas y marcado individual o general como leídas |
| Cuidado compartido | Invitaciones a familiares, aceptación, permisos específicos, revocación y registro de actividad |
| Portal médico | Listado de pacientes autorizados, ficha, consultas, recetas y análisis clínico descriptivo |
| Interfaz | Componentes React reutilizables, navegación protegida y diseño adaptable a dispositivos móviles |

**Roles y permisos:** en el backend existen los roles **Paciente** y **Médico**. Un familiar autorizado utiliza una cuenta de tipo **Paciente** y recibe permisos de cuidado compartido; no constituye un tercer rol global. Las relaciones entre pacientes, médicos, familiares, consultas y tratamientos se representan mediante identificadores y documentos de permisos, no mediante tablas SQL.

**Integraciones externas:** la generación de un resumen con Gemini es opcional, exige una API key válida y consentimiento específico. **Google OAuth y el envío de correos SMTP no están habilitados ni validados en la versión entregada.**

## 4. Requisitos para ejecutar el proyecto

- Docker Desktop con Docker Compose.
- Node.js **20 o superior** y npm para ejecutar las seeds y pruebas desde el equipo local (los contenedores utilizan su propia imagen de Node.js).
- Git para clonar el repositorio.
- Puertos locales disponibles: `5173` (React), `3000` (Gateway) y `27018` (MongoDB, restringido a `127.0.0.1`).
- Uso exclusivo con **datos ficticios** en un entorno de desarrollo.

## 5. Instalación

**1. Clonar el repositorio:**

```powershell
git clone https://github.com/EnzoER16/Mi-Salud-Fullstack
cd <CARPETA_CLONADA>
```

**2. Preparar la configuración local:**

```powershell
Copy-Item .\backend\.env.example .\backend\.env
code .\backend\.env
```

Definir en `backend/.env` un `JWT_SECRET`. Revisar las demás variables del ejemplo. Docker Compose utiliza direcciones internas de red para MongoDB y los microservicios.

**3. Construir y levantar los servicios:**

```powershell
docker compose up -d --build
docker compose ps
```

Se esperan cinco servicios: `mongo`, `identity-service`, `clinical-service`, `api-gateway` y `frontend`.

**4. Instalar dependencias en el host para ejecutar pruebas:**

```powershell
npm --prefix backend ci
npm --prefix frontend ci
```

Docker instala las dependencias dentro de las imágenes. Los comandos anteriores solo son necesarios para las herramientas y las pruebas ejecutadas desde PowerShell.

**Accesos locales:**

| Recurso | URL |
| --- | --- |
| Interfaz React | http://localhost:5173 |
| Estado del Gateway | http://localhost:3000/api/health |
| Swagger / REST | http://localhost:3000/api/docs |
| Especificación OpenAPI | http://localhost:3000/api/docs-json |
| GraphQL | http://localhost:3000/graphql |

**Detener sin borrar la base de datos:**

```powershell
docker compose stop
```

También puede usarse `docker compose down` para quitar contenedores y red sin eliminar el volumen. **No ejecutar `docker compose down -v` si se desean conservar los datos.**

## 6. Inicialización de MongoDB con información ficticia

Con Docker levantado y **desde la raíz del repositorio**, ejecutar este orden, que se comprobó con éxito en un clon limpio:

```powershell
node .\backend\scripts\seed-realista.mjs
node .\backend\scripts\seed-workflows.mjs
```

- `seed-realista.mjs`: crea o completa perfiles ficticios de paciente y médica, ficha, vacunas, contactos y agenda.
- `seed-workflows.mjs`: agrega autorización médica, vínculo familiar, consulta, tratamiento, tomas, notificaciones, nota y un adjunto PDF de muestra.
- `seed-demo.mjs`: escenario básico **opcional**.

**Cuentas ficticias de referencia:**

| Acceso | Correo |
| --- | --- |
| Paciente | `paciente.tp.demo@gmail.com` |
| Médico | `medico.tp.demo@gmail.com` |
| Familiar autorizado | `familiar.tp.demo@gmail.com` |

La contraseña depende de `DEMO_PASSWORD` o de los valores de demostración configurados por las seeds. No incorporar credenciales reales al README. Las seeds deben ejecutarse **únicamente en bases de desarrollo**.

## 7. API REST, GraphQL y documentación

La API REST se documenta en **Swagger** (`/api/docs`), donde pueden consultarse los endpoints, sus parámetros y los esquemas. Incluye operaciones sobre autenticación, perfiles, ficha médica, contactos, autorizaciones, consultas, tratamientos y seguimiento.

El Gateway expone **dos CRUD completos mediante GraphQL**:

| Recurso | Lectura | Escritura |
| --- | --- | --- |
| Vacunas | `vaccines`, `vaccine(id)` | `createVaccine`, `updateVaccine`, `deleteVaccine` |
| Turnos | `appointments`, `appointment(id)` | `createAppointment`, `updateAppointment`, `deleteAppointment` |

Las operaciones de lectura/escritura están sujetas a JWT y verificaciones de identidad, rol, propiedad o consentimiento según corresponda. Hay respuestas de error verificadas **401** (sin autenticación) y **403** (sin autorización).

## 8. Calidad, pruebas y logging

Con Docker iniciado y las dependencias del host instaladas:

```powershell
# Backend: 5 pruebas unitarias
npm --prefix backend run test:unit

# Backend: 2 pruebas E2E (registro, JWT, seguridad, REST/GraphQL)
npm --prefix backend run test:e2e

# Backend: 3 pruebas E2E adicionales de workflows
node --test .\backend\tests\e2e\workflows.test.mjs

# Frontend: 7 pruebas de componentes
npm --prefix frontend test

# Frontend: compilación de producción
npm --prefix frontend run build
```

**Auditorías funcionales complementarias:**

```powershell
# Consultas y controles de acceso (principalmente lectura)
node .\qa\auditar-api.mjs

# Escritura real: crea usuarios y datos QA temporales, y trata de limpiarlos
node .\qa\auditar-escrituras.mjs
```

La auditoría de escritura **no debe ejecutarse en producción ni con datos reales**. Una interrupción puede dejar datos QA temporales.

**Resultados obtenidos el 03/11/2026:**

| Comprobación | Resultado reportado |
| --- | --- |
| Verificación técnica inicial (Docker, Swagger, GraphQL y pruebas) | 17/17 OK |
| Validación funcional inicial | 15/15 OK |
| Auditoría de API ampliada | 33/33 OK |
| Auditoría visual de React ampliado | 13/13 OK |
| Auditoría de escrituras y permisos | 14/14 OK; limpieza OK |
| Unitarias de backend | 5/5 OK |
| E2E de backend, incluyendo workflows | 5/5 OK |
| Pruebas de React | 7/7 OK |

La compilación React y la construcción Docker **también funcionaron desde un clon limpio de GitHub**, tras ejecutar ambas seeds. Estos resultados describen el entorno probado; no garantizan todos los entornos posibles.

**Logging y diagnóstico:** los mensajes de ejecución y errores de los servicios pueden consultarse mediante `docker compose logs`. Por ejemplo:

```powershell
docker compose logs --tail 100 api-gateway
docker compose logs --tail 100 identity-service clinical-service
```

Se realizaron pruebas de acceso y se registra la actividad de cuidado familiar. **No se afirma que exista un sistema centralizado de logs, métricas o trazabilidad distribuida**; son mejoras futuras para producción.

## 9. Organización del código

```text
backend/
  apps/
    api-gateway/                 REST, GraphQL, JWT, Swagger
    identity-service/            Cuentas, perfiles, autorizaciones
    clinical-service/            Registros clínicos, vacunas, turnos, tratamientos
  libs/contracts/                Tipos y contratos compartidos
  scripts/                       Seeds de desarrollo
  tests/unit/                    Pruebas unitarias
  tests/e2e/                     Pruebas de extremo a extremo
frontend/
  src/                            Componentes, pantallas y cliente API
  public/logo-icon.png            Ícono original de MiSalud+
qa/                                Auditorías funcionales complementarias
docs/                              Arquitectura e informe de alcance
docker-compose.yml                Orquestación local
```

## 10. Documentación complementaria

- [`docs/INFORME-ALCANCE-ACTUALIZADO.md`](docs/INFORME-ALCANCE-ACTUALIZADO.md): descripción de la problemática, propuesta, componentes, pruebas y límites.
- [`docs/ARQUITECTURA-TP.md`](docs/ARQUITECTURA-TP.md): arquitectura y organización técnica.
- [`docs/GUIA-ENTREGA.md`](docs/GUIA-ENTREGA.md): indicaciones de entrega y ejecución.