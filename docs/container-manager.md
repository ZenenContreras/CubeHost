# Container Manager

Servicio interno que gestiona el ciclo de vida de los contenedores Docker de cada proyecto. Expone dos servidores:

- **API REST** en el puerto `4001` — usada exclusivamente por el servicio `api`
- **Proxy HTTP** en el puerto `5000` — recibe el tráfico de usuarios desde Caddy

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `API_PORT` | `4001` | Puerto de la API interna |
| `PROXY_PORT` | `5000` | Puerto del proxy de usuario |
| `DOCKER_NETWORK` | `cubehost-network` | Red Docker compartida entre servicios |
| `DB_PATH` | `/data/containers.db` | Ruta de la base de datos SQLite |
| `WORK_DIR` | `/tmp/cubehost-repos` | Directorio temporal para clonar repos |
| `INACTIVITY_TIMEOUT_MS` | `1800000` | Tiempo de inactividad antes de apagar (ms) |
| `CONTAINER_CPUS` | `0.5` | Límite de CPU por contenedor |
| `CONTAINER_MEMORY_MB` | `256` | Límite de RAM por contenedor (MB) |

---

## API REST interna (puerto 4001)

> Solo accesible desde dentro de la red Docker (`api` → `container-manager:4001`).

### `GET /health`

Verifica que el servicio esté corriendo.

**Response `200`**
```json
{ "status": "ok" }
```

---

### `POST /containers/deploy`

Clona el repositorio, construye la imagen Docker y levanta el contenedor con los límites configurados. Registra el subdominio en la base de datos interna.

**Body**
```json
{
  "projectId": 1,
  "repoUrl": "https://github.com/usuario/repo",
  "containerType": "dockerfile",
  "port": 3000,
  "subdomain": "mi-app.zenentest"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | number | ✅ | ID del proyecto en el API |
| `repoUrl` | string | ✅ | URL pública del repositorio GitHub |
| `containerType` | string | ✅ | `dockerfile` o `compose` |
| `port` | number | ✅ | Puerto que expone la app dentro del contenedor |
| `subdomain` | string | ✅ | Subdominio de acceso (`nombre.usuario`) |

**Response `200`**
```json
{
  "containerId": "a3f9c2d1e4b5...",
  "status": "running"
}
```

**Response `400`**
```json
{ "error": "Faltan parámetros requeridos" }
```

**Notas:**
- Para `dockerfile`: clona el repo y ejecuta `docker build` desde el directorio raíz.
- Para `compose`: clona el repo, ejecuta `docker compose up -d --build` y conecta el contenedor principal a `cubehost-network`.
- El contenedor se crea con `--cpus` y `--memory` según las variables de entorno.
- El contenedor se nombra `cubehost-{projectId}`.

---

### `POST /containers/:containerId/stop`

Detiene un contenedor activo.

**Params**
- `containerId` — ID completo del contenedor Docker

**Response `200`**
```json
{ "status": "stopped" }
```

---

### `POST /containers/:containerId/start`

Inicia un contenedor previamente detenido.

**Response `200`**
```json
{ "status": "running" }
```

---

### `DELETE /containers/:containerId`

Detiene y elimina el contenedor y su imagen. También elimina el registro de la base de datos interna.

**Response `204`** — sin body

---

### `GET /containers/:containerId/status`

Consulta el estado actual del contenedor inspeccionando el Docker daemon.

**Response `200`**
```json
{
  "status": "running",
  "lastActivity": "2026-05-26 18:00:00"
}
```

| Campo | Valores posibles |
|---|---|
| `status` | `running`, `stopped` |
| `lastActivity` | Timestamp ISO de la última petición proxeada |

---

## Proxy HTTP (puerto 5000)

Recibe todo el tráfico de `*.localhost` reenviado por Caddy. Por cada request:

1. Extrae el subdominio del header `Host` (ej: `mi-app.zenentest.localhost` → `mi-app.zenentest`)
2. Busca el contenedor registrado para ese subdominio
3. Actualiza el timestamp de última actividad
4. Si el contenedor está **detenido**, lo despierta (espera hasta 30 segundos)
5. Hace forward del request al contenedor en `http://{containerName}:{port}`

**Respuestas de error del proxy:**

| Código | Causa |
|---|---|
| `400` | Header `Host` ausente o sin subdominio válido |
| `404` | Subdominio no registrado en la base de datos |
| `503` | El contenedor no pudo iniciarse en 30 segundos |
| `502` | El contenedor está corriendo pero no responde |

También soporta **WebSockets** (evento `upgrade`).

---

## Monitor de inactividad

Cron que se ejecuta **cada minuto**. Busca contenedores con `status = 'running'` cuyo `last_activity` sea anterior al umbral de inactividad (`INACTIVITY_TIMEOUT_MS`). Los contenedores encontrados son detenidos con `docker stop` y marcados como `stopped` en la DB.

El reinicio es transparente para el usuario: la siguiente petición al subdominio activa el proxy que despierta el contenedor automáticamente.

---

## Base de datos interna (SQLite)

Tabla `containers`:

| Columna | Tipo | Descripción |
|---|---|---|
| `project_id` | INTEGER PK | ID del proyecto (viene del API) |
| `subdomain` | TEXT UNIQUE | `nombre.usuario` |
| `container_id` | TEXT | ID del contenedor Docker |
| `container_name` | TEXT | Nombre del contenedor (`cubehost-{id}`) |
| `container_type` | TEXT | `dockerfile` o `compose` |
| `internal_port` | INTEGER | Puerto interno de la app |
| `status` | TEXT | `running` o `stopped` |
| `last_activity` | TEXT | Timestamp de última petición |
