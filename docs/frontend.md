# Documentación del Frontend — CubeHost

Este documento describe la arquitectura, estructura de archivos, diseño visual y flujos del cliente web construido para **CubeHost**.

---

## 1. Tecnologías y Librerías Utilizadas

El frontend ha sido desarrollado como una **Single Page Application (SPA)** moderna con un diseño extremadamente visual y fluido:

*   **Core:** React 18 con Vite como herramienta de empaquetado y servidor de desarrollo ultrarrápido.
*   **Estilos:** Vanilla CSS con variables CSS personalizadas (sistema de temas HSL oscuro, glassmorphism, sombras neon y micro-animaciones premium).
*   **Gestión de Estado:** React Context API para el control de sesiones y autenticación centralizada.
*   **Iconografía:** SVG nativos optimizados para mantener el peso mínimo y máxima nitidez en cualquier resolución.

---

## 2. Estructura de Directorios

```
frontend/
├── public/                 # Recursos estáticos (logos, favicons)
├── src/
│   ├── components/         # Componentes reutilizables de UI
│   │   ├── CreateProjectModal.jsx  # Formulario de creación de proyectos
│   │   └── DeleteConfirmModal.jsx  # Modal premium de confirmación de borrado
│   ├── context/
│   │   └── AuthContext.jsx # Contexto global de autenticación
│   ├── pages/              # Páginas y vistas principales
│   │   ├── HomePage.jsx    # Landing page pública e interactiva
│   │   ├── LoginPage.jsx   # Formulario animado de login y registro
│   │   └── DashboardPage.jsx # Panel de control de proyectos del usuario
│   ├── App.css             # Estilos compartidos de animación y base
│   ├── App.jsx             # Enrutador principal y layout
│   ├── index.css           # Sistema de diseño, paleta HSL y variables globales
│   └── main.jsx            # Punto de entrada de la aplicación
├── Dockerfile              # Empaquetado de producción con Docker y multi-stage
├── nginx.conf              # Configuración de Nginx para producción y redirecciones SPA
├── package.json            # Dependencias del proyecto
├── pnpm-lock.yaml          # Archivo de bloqueo de dependencias de pnpm
└── vite.config.js          # Configuración de Vite con proxy de desarrollo
```

---

## 3. Sistema de Diseño (CSS HSL)

La interfaz utiliza una paleta de colores cohesiva basada en **HSL** (Hue-Saturation-Lightness) con soporte nativo para efectos premium:

*   **Fondo principal (`--bg`):** `#0f0f11` (un negro azulado profundo y tecnológico).
*   **Fondo de tarjetas (`--card-bg`):** `rgba(255, 255, 255, 0.03)` con bordes semi-transparentes (`rgba(255, 255, 255, 0.07)`) y filtro de desenfoque de fondo (`backdrop-filter: blur(12px)`).
*   **Colores de acento:** 
    *   `--accent` (Violeta neón: `#8b5cf6`).
    *   `--accent-glow` (Resplandor violeta).
    *   `--success` (Verde esmeralda para estados activos: `#10b981`).
    *   `--danger` (Rojo carmesí para peligro y alertas de borrado: `#ef4444`).

---

## 4. Flujo de Autenticación (`AuthContext.jsx`)

La sesión se gestiona a través del `AuthProvider` que expone los siguientes elementos a toda la aplicación:

1.  **Estado `user`:** Almacena la información del usuario autenticado (nombre, correo) decodificada.
2.  **Estado `loading`:** Evita parpadeos de interfaz mientras se valida la sesión activa al recargar la página.
3.  **Persistencia:** Los tokens `accessToken` y `refreshToken` se guardan en el `localStorage` del navegador.
4.  **Autenticación Automática:** Si existe un token al cargar la aplicación, se consulta el endpoint `/api/auth/me`. Si el token ha expirado, el sistema intenta de forma transparente renovarlo mediante `/api/auth/refresh-token` antes de desloguear al usuario.

---

## 5. Descripción de Páginas y Vistas

### A. HomePage (`pages/HomePage.jsx`)
*   **Propósito:** Página de aterrizaje del proyecto que muestra los beneficios clave de CubeHost (aislamiento, optimización de recursos, rate limiting, etc.).
*   **Interacciones:** Navegación animada mediante botones interactivos hacia la vista de inicio de sesión o registro.

### B. LoginPage (`pages/LoginPage.jsx`)
*   **Propósito:** Interfaz unificada de Login y Registro.
*   **Características:** 
    *   Interruptor animado para cambiar de pestaña sin recargas.
    *   Validación de campos en tiempo real.
    *   Integración directa con los endpoints `/api/auth/login` y `/api/auth/signup-direct`.

### C. DashboardPage (`pages/DashboardPage.jsx`)
*   **Propósito:** Panel central del desarrollador.
*   **Características:**
    *   Mapeo dinámico de proyectos del usuario.
    *   **Polling Automático:** Monitorea el estado del contenedor cada 5 segundos cuando está en estado `building` para reflejar el estado actual sin obligar al usuario a refrescar la pestaña.
    *   Acciones en tiempo real para **Detener**, **Iniciar** y **Eliminar** proyectos de forma interactiva.
    *   Cálculo del subdominio en tiempo real: `http://{nombreProyecto}.{nombreUsuario}.localhost`.

### D. CreateProjectModal (`components/CreateProjectModal.jsx`)
*   **Propósito:** Formulario modal premium con desenfoque de fondo.
*   **Validaciones:**
    *   **Nombre del proyecto:** Solo se permiten caracteres alfanuméricos en minúsculas y guiones (ej. `mi-app-web`).
    *   **URL del repositorio:** Enlace válido de GitHub.
    *   **Puerto interno:** Validado numéricamente entre 1 y 65535.

### E. DeleteConfirmModal (`components/DeleteConfirmModal.jsx`)
*   **Propósito:** Advertencia de peligro destructivo con glassmorphism.
*   **Características:**
    *   Muestra el subdominio dinámico exacto del usuario que dejará de funcionar.
    *   Vibración de alerta (`shake`) animada al abrirse.

---

## 6. Configuración de Producción (Nginx)

Cuando se compila el proyecto mediante Docker, se utiliza una imagen multi-stage que optimiza el tamaño y velocidad:
1.  **Etapa de Construcción (Node + PNPM):** Transforma el código React/Vite en archivos estáticos minimizados en la carpeta `/dist`.
2.  **Etapa de Servidor (Nginx Alpine):** Sirve el contenido con la configuración optimizada en `/etc/nginx/conf.d/default.conf` para redireccionar cualquier ruta inexistente a `index.html`, garantizando el correcto funcionamiento del enrutamiento de la SPA.
