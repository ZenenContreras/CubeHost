# Caddy (Reverse Proxy)

Caddy actúa como punto de entrada único de la plataforma. Escucha en el puerto `80` y enruta el tráfico según el dominio de la petición.

---

## Archivo de configuración

`caddy/Caddyfile`

```
{
    auto_https off
}

http://*.localhost {
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

### `http://*.localhost` — Proyectos desplegados

Cualquier subdominio de `*.localhost` se reenvía al **proxy del container-manager** (`container-manager:5000`), que se encarga de:

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

## Agregar rate limiting (pendiente)

El Caddyfile estándar no incluye rate limiting nativo — requiere el plugin `caddy-ratelimit` que no viene en la imagen oficial. Para activarlo hay dos opciones:

### Opción A — Imagen personalizada con xcaddy

Crear `caddy/Dockerfile`:

```dockerfile
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/mholt/caddy-ratelimit

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

Actualizar `docker-compose.yml`:
```yaml
caddy:
  build: ./caddy      # en vez de image: caddy:2-alpine
```

Agregar al `Caddyfile`:
```
http://*.localhost {
    rate_limit {remote_host} 60r/m
    reverse_proxy container-manager:5000
}
```

### Opción B — Rate limiting en el container-manager (más simple)

Agregar `express-rate-limit` en el proxy del container-manager para limitar por IP/subdominio sin necesidad de modificar Caddy.

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
