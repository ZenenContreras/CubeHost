# CubeHost

Plataforma de hosting de páginas web basada en contenedores Docker. Permite a usuarios autenticados mediante Roble desplegar sitios web directamente desde un repositorio de GitHub, accesibles en subdominios locales del tipo `http://nombreProyecto.nombreUsuario.localhost`.

---

## Demo

> _Enlace al video de demostración en YouTube (se añadirá al entregar)_

El video incluye:
- Registro e inicio de sesión con Roble
- Creación y despliegue de un proyecto desde GitHub
- Funcionamiento de la gestión de recursos y apagado automático

---

## Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Frontend   │────▶│   API Backend    │────▶│  Container Manager   │
│  (React)    │     │  (Node/Express)  │     │  (Dockerode)         │
└─────────────┘     └──────────────────┘     └──────────┬───────────┘
                            │                           │
                     ┌──────┴──────┐            ┌───────▼────────┐
                     │  Auth Roble │            │  Docker Daemon │
                     │  (OAuth2)   │            └───────┬────────┘
                     └─────────────┘                    │
                                              ┌─────────▼──────────┐
                                              │   Caddy (Proxy)    │
                                              │ *.localhost routing │
                                              └────────────────────┘
```

### Servicios

| Servicio | Descripción | Puerto |
|---|---|---|
| `frontend` | Dashboard de proyectos en React | 3000 |
| `api` | REST API principal, autenticación y lógica de negocio | 4000 |
| `container-manager` | Gestión del ciclo de vida de contenedores Docker | 4001 (interno) |
| `caddy` | Reverse proxy con enrutamiento dinámico por subdominio | 80 |

---

## Requerimientos funcionales

### 1. Autenticación
- Integración con Roble para registro e inicio de sesión
- Cada usuario tiene un espacio personal de proyectos

### 2. Creación de proyectos
El usuario provee:
1. Nombre del proyecto
2. URL del repositorio GitHub
3. Tipo de contenedor (`Dockerfile` o `docker-compose`)
4. Puerto expuesto por la aplicación

La plataforma clona el repositorio, construye la imagen y levanta el contenedor automáticamente.

### 3. Despliegue y acceso
- Cada proyecto corre en su propio contenedor aislado
- Accesible en: `http://{nombreProyecto}.{nombreUsuario}.localhost`
- El routing es gestionado dinámicamente por Caddy

### 4. Gestión de recursos
- Rate limiting por contenedor (límite de peticiones por minuto)
- Restricciones de CPU y memoria (`--cpus`, `--memory`) al crear el contenedor
- Apagado automático tras 30 minutos de inactividad
- Reinicio automático al recibir una nueva solicitud

---

## Flujo de trabajo del sistema

```
Usuario crea proyecto
        │
        ▼
API valida token Roble
        │
        ▼
Container Manager clona repo de GitHub
        │
        ▼
Construye imagen (Dockerfile / docker-compose)
        │
        ▼
Levanta contenedor con límites CPU/memoria
        │
        ▼
Caddy registra nueva ruta: nombreProyecto.nombreUsuario.localhost → contenedor
        │
        ▼
Sitio disponible en http://nombreProyecto.nombreUsuario.localhost
        │
        ▼
Monitor de inactividad: si sin tráfico > 30 min → apagar contenedor
        │
        ▼
Nueva petición al subdominio → reiniciar contenedor automáticamente
```

---

## Seguridad y optimización de recursos

**Seguridad:**
- Autenticación centralizada vía Roble (tokens JWT validados en cada request)
- Cada proyecto corre en un contenedor aislado (namespaces y cgroups de Linux)
- Sin acceso entre contenedores de distintos usuarios
- Rate limiting en Caddy para prevenir abuso

**Optimización:**
- Límites de CPU y memoria por contenedor configurables al momento del despliegue
- Apagado automático de contenedores inactivos (+30 min) para liberar recursos
- Reinicio on-demand transparente para el usuario
- Imágenes construidas y cacheadas para acelerar redespliegues

---

## Estructura del repositorio

```
CubeHost/
├── frontend/               # React + Vite — dashboard de proyectos
│   ├── src/
│   └── Dockerfile
├── api/                    # Node.js + Express — REST API y auth
│   ├── src/
│   └── Dockerfile
├── container-manager/      # Servicio de gestión de contenedores (Dockerode)
│   ├── src/
│   └── Dockerfile
├── caddy/                  # Configuración de Caddy (reverse proxy)
│   └── Caddyfile
├── docker-compose.yml      # Orquestación de todos los servicios
└── README.md
```

---

## Requisitos previos

- Docker >= 24.x
- Docker Compose >= 2.x
- Acceso a red con resolución de `*.localhost`

## Instalación y ejecución

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd CubeHost

# Copiar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Roble

# Levantar todos los servicios
docker compose up --build
```

La plataforma queda disponible en `http://localhost:3000`.

---

## Equipo

| Nombre | Participación |
|---|---|
| Claudia Elias Sierra | Team Member |
| Carlos Ruidiaz Mendoza | Team Member |
| Juan Fernandez Barrios | Team Member |
| Zenen Contreras Royero | Team Member |

