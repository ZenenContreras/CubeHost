// ============================================================
// src/lib/api.js — Cliente HTTP centralizado de CubeHost
// ============================================================
// Todas las llamadas al backend pasan por aquí.
// El token de autenticación se inyecta automáticamente en
// cada request protegida desde localStorage.
// ============================================================

const API_BASE = '/api';

/**
 * Función auxiliar interna que ejecuta todas las peticiones.
 * - Agrega el header Authorization si existe un accessToken.
 * - Si el servidor responde con un error, lanza una excepción
 *   con el mensaje del backend (o un mensaje genérico).
 *
 * @param {string} endpoint  - Ruta relativa, ej. "/projects"
 * @param {RequestInit} opts - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>}   - JSON de respuesta
 */
async function request(endpoint, opts = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...opts,
    headers,
  });

  // Respuestas sin cuerpo (ej. 204 No Content en DELETE)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.error || data.message || `Error ${response.status} en ${endpoint}`;
    throw new Error(message);
  }

  return data;
}

// ============================================================
// AUTH — Autenticación con Roble
// ============================================================

/**
 * Inicia sesión con email y contraseña.
 * @returns {{ accessToken, refreshToken, user }}
 */
export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Registra un usuario nuevo (modo directo, sin verificación por email).
 * @returns {{ accessToken, refreshToken, user }}
 */
export function signup(name, email, password) {
  return request('/auth/signup-direct', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * Cierra la sesión del usuario en el backend.
 */
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

/**
 * Obtiene los datos del usuario autenticado actualmente.
 * @returns {{ id, email, name, ... }}
 */
export function getMe() {
  return request('/auth/me');
}

/**
 * Renueva el accessToken usando el refreshToken.
 * @returns {{ accessToken }}
 */
export function refreshToken(token) {
  return request('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

// ============================================================
// PROJECTS — Gestión de proyectos / contenedores
// ============================================================

/**
 * Lista todos los proyectos del usuario autenticado.
 * @returns {Array<Project>}
 */
export function getProjects() {
  return request('/projects');
}

/**
 * Obtiene un proyecto por ID.
 * @returns {Project}
 */
export function getProject(projectId) {
  return request(`/projects/${projectId}`);
}

/**
 * Crea y despliega un nuevo proyecto.
 * @param {{ name, repoUrl, containerType, port }} projectData
 * @returns {Project}  - El proyecto creado (status inicial: "building")
 */
export function createProject(projectData) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

/**
 * Elimina un proyecto y destruye su contenedor.
 * @returns {null}
 */
export function deleteProject(projectId) {
  return request(`/projects/${projectId}`, { method: 'DELETE' });
}

/**
 * Inicia un contenedor detenido.
 * @returns {{ message }}
 */
export function startProject(projectId) {
  return request(`/projects/${projectId}/start`, { method: 'POST' });
}

/**
 * Detiene un contenedor en ejecución.
 * @returns {{ message }}
 */
export function stopProject(projectId) {
  return request(`/projects/${projectId}/stop`, { method: 'POST' });
}

/**
 * Consulta el estado actual de un proyecto (útil para polling durante "building").
 * @returns {{ status: 'pending'|'building'|'running'|'stopped'|'error' }}
 */
export function getProjectStatus(projectId) {
  return request(`/projects/${projectId}/status`);
}
