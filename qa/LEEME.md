# Auditorias complementarias de MiSalud+

Esta carpeta contiene scripts autocontenidos para validar la API de desarrollo. Se copiara desde los paquetes de trabajo si se encuentran disponibles.

```powershell
node .\qa\auditar-api.mjs
node .\qa\auditar-escrituras.mjs
```

`auditar-api.mjs` es de lectura. `auditar-escrituras.mjs` crea tres usuarios QA y los elimina por ID al terminar. Requiere Docker local, `backend/node_modules` y MongoDB en `127.0.0.1:27018`.

**Nunca ejecutar la auditoria de escritura en produccion ni en una base con datos reales.** Una interrupcion puede dejar registros temporales.

La seed realista reproducible se encuentra en `backend/scripts/seed-realista.mjs`; las otras seeds ya estan en esa carpeta.
