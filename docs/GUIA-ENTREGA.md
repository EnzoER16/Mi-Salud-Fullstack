# MiSalud+ — Guía rápida de ejecución y entrega

## Requisitos

- Docker Desktop iniciado.
- Node.js 24 (en Windows, si vas a ejecutar los tests fuera de Docker).
- Puerto HTTP `3000` y Vite `5173` libres; Docker MongoDB publicado en `127.0.0.1:27018` para no interferir con `mongod` local en 27017.
- Archivo `backend/.env` con `JWT_SECRET` largo y secreto. Nunca subir ese archivo.

## Ejecutar toda la solución

Desde la **raíz** del repo:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail 60 api-gateway
```

Accesos:

- App React: http://localhost:5173
- REST: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs
- Swagger JSON: http://localhost:3000/api/docs-json
- GraphQL: http://localhost:3000/graphql

El primer build puede tardar. Si `/api/health` responde 503 justo después de arrancar, revisá los logs de los servicios internos y volvé a consultar cuando estén listos.

## Datos de demostración

Con los contenedores iniciados, desde `backend`:

```powershell
cd .\backend
node .\scripts\seed-demo.mjs
cd ..
```

El script crea dos usuarios FICTICIOS e incluye ficha médica, vacuna y turno. La contraseña se imprime al finalizar. Puede personalizarse con `$env:DEMO_PASSWORD = '...'` antes de ejecutarlo. No utilizar datos reales.

## Pruebas

```powershell
cd .\backend
npm run test:unit
npm run test:e2e
cd ..\frontend-tp
npm test
npm run build
cd ..
```

Las E2E requieren que `docker compose up -d --build` haya levantado correctamente MongoDB y ambos servicios. Los tests crean usuarios aleatorios de prueba en MongoDB y no requieren credenciales personales.

## Parada

Desde la raíz:

```powershell
docker compose down
```

No utilizar `docker compose down -v` salvo que se quiera **borrar** deliberadamente la base de datos.

## Antes de la entrega

- Completar los nombres de los integrantes en README y `docs/ARQUITECTURA-TP.md`.
- Subir a GitHub los archivos del proyecto sin subir ningún `.env` ni credenciales.
- Comprobar `docker compose ps`, Swagger, GraphQL, pantallas React, pruebas y seed.
- Adjuntar o indicar el documento breve de problemática, propuesta y microservicios.
- Conservar capturas de evidencia de pruebas y pantallas.
