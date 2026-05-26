# API REST

Servicio principal de la plataforma. Gestiona la autenticación con Roble y el CRUD de proyectos. Accesible desde el navegador a través de Caddy en `http://localhost/api/*`.

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto del servidor |
| `NODE_ENV` | `development` | Entorno (`development` / `production`) |
| `ROBLE_DB_NAME` | — | **Requerido.** Nombre de la base de datos del proyecto en Roble |
| `CONTAINER_MANAGER_URL` | `http://container-manager:4001` | URL interna del container-manager |
| `FRONTEND_URL` | `http://localhost` | URL del frontend (para CORS) |
| `DB_PATH` | `/data/cubehost.db` | Ruta de la base de datos SQLite |

---

## Autenticación

La mayoría de rutas requieren un `accessToken` de Roble en el header:

```
Authorization: Bearer <accessToken>
```

El token se obtiene en `POST /api/auth/login` y se valida en cada request llamando a `GET /verify-token` de Roble. Si el token expiró, usar `POST /api/auth/refresh-token`.

---

## Rutas de autenticación

### `POST /api/auth/login`

Inicia sesión con email y contraseña de Roble.

**Body**
```json
{
  "email": "usuario@uninorte.edu.co",
  "password": "contraseña"
}
```

**Response `200`**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "usuario@uninorte.edu.co",
    "name": "Nombre Apellido",
    "role": "user"
  }
}
```

**Response `400`** — falta email o password
**Response `401`** — credenciales inválidas

---

### `POST /api/auth/signup`

Registra un nuevo usuario. Envía un código de verificación al correo.

**Body**
```json
{
  "email": "usuario@uninorte.edu.co",
  "password": "contraseña",
  "name": "Nombre Apellido"
}
```

**Response `201`** — usuario creado, pendiente de verificación
**Response `400`** — faltan campos
**Response `409`** — el correo ya está registrado

---

### `POST /api/auth/signup-direct`

Igual que `signup` pero **sin verificación de correo**. Usar solo para pruebas.

**Body** — mismo que `signup`

**Response `201`** — usuario creado y activo

---

### `POST /api/auth/verify-email`

Verifica el correo con el código recibido.

**Body**
```json
{
  "email": "usuario@uninorte.edu.co",
  "code": "123456"
}
```

**Response `200`** — verificado correctamente
**Response `400`** — código inválido o expirado

---

### `POST /api/auth/refresh-token`

Obtiene un nuevo `accessToken` usando el `refreshToken`.

**Body**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`**
```json
{ "accessToken": "eyJ..." }
```

**Response `401`** — refreshToken inválido o expirado

---

### `POST /api/auth/forgot-password`

Envía un correo de recuperación de contraseña.

**Body**
```json
{ "email": "usuario@uninorte.edu.co" }
```

**Response `200`**
```json
{ "message": "Si el correo está registrado, recibirás un enlace de recuperación" }
```

---

### `POST /api/auth/reset-password`

Restablece la contraseña usando el token del correo de recuperación.

**Body**
```json
{
  "token": "reset-token",
  "newPassword": "nuevaContraseña123"
}
```

**Response `200`** — contraseña actualizada
**Response `400`** — token inválido o expirado

---

### `POST /api/auth/logout`

🔒 Requiere `Authorization` header.

Cierra la sesión e invalida el token en Roble.

**Response `200`**
```json
{ "message": "Sesión cerrada correctamente" }
```

---

### `GET /api/auth/me`

🔒 Requiere `Authorization` header.

Devuelve el perfil del usuario autenticado.

**Response `200`**
```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@uninorte.edu.co",
  "dbName": "cubehost_xxx",
  "role": "user",
  "sessionId": "uuid-sesion"
}
```

---

## Rutas de proyectos

Todas las rutas de proyectos requieren `Authorization: Bearer <accessToken>`.

---

### `GET /api/projects`

Lista todos los proyectos del usuario autenticado.

**Response `200`**
```json
[
  {
    "id": 1,
    "roble_user_id": "uuid",
    "username": "zenentest",
    "name": "mi-app",
    "repo_url": "https://github.com/usuario/repo",
    "container_type": "dockerfile",
    "port": 3000,
    "container_id": "a3f9c2...",
    "status": "running",
    "created_at": "2026-05-26 18:00:00",
    "updated_at": "2026-05-26 18:00:00"
  }
]
```

---

### `POST /api/projects`

Crea y despliega un nuevo proyecto. El deploy ocurre en background — la respuesta es inmediata con `status: "building"`.

**Body**
```json
{
  "name": "mi-app",
  "repoUrl": "https://github.com/usuario/repo",
  "containerType": "dockerfile",
  "port": 3000
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | Solo letras minúsculas, números y guiones (`/^[a-z0-9-]+$/`) |
| `repoUrl` | string | URL del repositorio GitHub |
| `containerType` | string | `dockerfile` o `compose` |
| `port` | number | 1–65535 |

**Response `202`** — aceptado, deploy en progreso
```json
{
  "id": 1,
  "name": "mi-app",
  "status": "building",
  "url": "http://mi-app.zenentest.localhost",
  ...
}
```

**Response `400`** — validación fallida
**Response `409`** — ya existe un proyecto con ese nombre

> El `status` evoluciona: `building` → `running` (éxito) o `error` (fallo).
> Hacer polling a `GET /api/projects/:id/status` para seguir el progreso.

---

### `GET /api/projects/:id`

Detalle de un proyecto específico del usuario.

**Response `200`** — mismo objeto que en el listado
**Response `404`** — no encontrado o no pertenece al usuario

---

### `DELETE /api/projects/:id`

Elimina el proyecto, detiene y borra el contenedor Docker.

**Response `204`** — eliminado
**Response `404`** — no encontrado

---

### `POST /api/projects/:id/start`

Inicia manualmente un contenedor detenido.

**Response `200`**
```json
{ "status": "running" }
```

**Response `400`** — el proyecto no tiene contenedor asignado aún
**Response `404`** — proyecto no encontrado

---

### `POST /api/projects/:id/stop`

Detiene manualmente el contenedor del proyecto.

**Response `200`**
```json
{ "status": "stopped" }
```

---

### `GET /api/projects/:id/status`

Consulta el estado actual del contenedor directamente desde el Docker daemon.

**Response `200`**
```json
{
  "status": "running",
  "lastActivity": "2026-05-26 18:30:00"
}
```

| `status` | Significado |
|---|---|
| `pending` | Creado, sin contenedor asignado todavía |
| `building` | Build de imagen en progreso |
| `running` | Contenedor activo y accesible |
| `stopped` | Detenido (manualmente o por inactividad) |
| `error` | El deploy falló |

---

## Códigos de error comunes

| Código | Causa |
|---|---|
| `400` | Campos faltantes o inválidos en el body |
| `401` | Token ausente, inválido o expirado |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: nombre de proyecto duplicado) |
| `429` | Demasiadas peticiones (rate limit: 100 req/min por IP) |
| `500` | Error interno del servidor |
| `502` | Error de comunicación con Roble o container-manager |

---

## Base de datos (SQLite)

Tabla `projects`:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | ID autoincremental |
| `roble_user_id` | TEXT | UUID del usuario en Roble (`sub`) |
| `username` | TEXT | Parte local del email (`usuario@...` → `usuario`) |
| `name` | TEXT | Nombre del proyecto (único por usuario) |
| `repo_url` | TEXT | URL del repositorio |
| `container_type` | TEXT | `dockerfile` o `compose` |
| `port` | INTEGER | Puerto interno de la app |
| `container_id` | TEXT | ID del contenedor Docker (null mientras construye) |
| `status` | TEXT | Estado actual del proyecto |
| `created_at` | TEXT | Fecha de creación |
| `updated_at` | TEXT | Última actualización (trigger automático) |
