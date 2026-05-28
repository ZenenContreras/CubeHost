# Caddy (Reverse Proxy)

Caddy actúa como punto de entrada único de la plataforma. Escucha en el puerto `80` y enruta el tráfico según el dominio de la petición.

---

## Archivo de configuración

`caddy/Caddyfile`

```
{
    auto_https off
}

http://*.*.localhost {
    reverse_proxy container-manager:5000
}

http://localhost {
    handle /api/* {
        reverse_proxy api:4000
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

---

## Reglas de enrutamiento

### `http://localhost` — Plataforma principal

| Patrón | Destino | Descripción |
|---|---|---|
| `/api/*` | `api:4000` | Todas las rutas del API REST |
| `/*` (resto) | `frontend:80` | Dashboard React |

**Ejemplos:**

| Request | Va a |
|---|---|
| `GET http://localhost/` | frontend |
| `GET http://localhost/login` | frontend |
| `POST http://localhost/api/auth/login` | api |
| `GET http://localhost/api/projects` | api |

---

### `http://*.*.localhost` — Proyectos desplegados (Dos niveles)

Cualquier subdominio de dos niveles (`nombreProyecto.nombreUsuario.localhost`) se reenvía al **proxy del container-manager** (`container-manager:5000`), que se encarga de:

- Identificar el proyecto por el subdominio
- Despertar el contenedor si está inactivo
- Hacer forward al contenedor correspondiente

**Ejemplos:**

| Request | Va a |
|---|---|
| `GET http://mi-blog.zenentest.localhost/` | container-manager:5000 → contenedor del proyecto |
| `GET http://api-rest.carlos.localhost/users` | container-manager:5000 → contenedor del proyecto |

---

## `auto_https off`

Deshabilita la obtención automática de certificados TLS. En desarrollo local con `.localhost` no se necesita HTTPS y Let's Encrypt no emite certificados para estos dominios.

---

## Control de sobrecargas (Rate Limiting)

Para proteger los proyectos de los usuarios y garantizar la estabilidad del host central, se han implementado dos niveles de rate limiting:

### 1. En la API REST principal (api)
Implementado a nivel de software en Express mediante `express-rate-limit`, restringiendo a un máximo de **100 peticiones por minuto por IP** para evitar abusos en peticiones de base de datos o autenticación.

### 2. En el Proxy de Subdominios (container-manager) — Implementado (Opción B)
Para los sitios web de los usuarios, se optó por implementar un rate limiter en memoria directamente en el proxy del Container Manager (`container-manager/src/proxy.js`). 
*   **Límite:** Máximo de **100 peticiones por minuto por subdominio**.
*   **Control:** Si una aplicación supera este umbral, el proxy responde de inmediato con un código **`429 Too Many Requests`**, previniendo que un ataque dirigido a un proyecto de un estudiante sature los recursos compartidos.

---

## Puertos expuestos

| Puerto host | Puerto container | Servicio |
|---|---|---|
| `80` | `80` | Caddy (HTTP) |

El resto de servicios (`api:4000`, `frontend:80`, `container-manager:4001/5000`) solo son accesibles dentro de la red Docker `cubehost-network` — no están expuestos al host.

---

## Red Docker

Todos los servicios comparten la red `cubehost-network` (bridge). Caddy resuelve los nombres de servicio (`api`, `frontend`, `container-manager`) por DNS interno de Docker.

Los contenedores de proyectos de usuarios también se conectan a esta red, lo que permite que el proxy del container-manager los alcance por nombre (`cubehost-{projectId}:{port}`).
