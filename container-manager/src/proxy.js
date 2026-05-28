const http = require('http');
const path = require('path');
const { execSync } = require('child_process');
const httpProxy = require('http-proxy');
const config = require('./config');
const { containers } = require('./db');
const docker = require('./docker');

const proxy = httpProxy.createProxyServer({ timeout: 30_000 });

// Rate limiting: max 100 requests por minuto por subdominio
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Deduplicar llamadas de encendido por subdominio
const wakingPromises = new Map();

function isRateLimited(subdomain) {
  const now = Date.now();
  const entry = rateLimitMap.get(subdomain);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(subdomain, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

proxy.on('error', (err, req, res) => {
  console.error(`[proxy] error for ${req.headers.host}: ${err.code || err.message}`);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  res.end('502 - El contenedor no está disponible');
});

function parseSubdomain(host) {
  // host: "mi-proyecto.usuario.localhost" → "mi-proyecto.usuario"
  if (!host) return null;
  const withoutPort = host.split(':')[0];
  const parts = withoutPort.split('.');
  // Drop the last part ("localhost")
  parts.pop();
  return parts.join('.');
}

async function wakeContainer(record) {
  const subdomain = record.subdomain;

  // Si ya hay un proceso de encendido en curso para este subdominio, reusarlo
  if (wakingPromises.has(subdomain)) {
    return wakingPromises.get(subdomain);
  }

  const promise = (async () => {
    console.log(`[proxy] Waking container for ${subdomain}`);
    try {
      if (record.container_type === 'compose') {
        const repoPath = path.join(config.workDir, String(record.project_id));
        const projectName = `cubehost-${record.project_id}`;
        execSync(`docker compose -p ${projectName} start`, { cwd: repoPath, stdio: 'pipe' });
      } else {
        await docker.startContainer(record.container_id);
      }
    } catch (err) {
      if (err.statusCode !== 304) { // 304 = already started
        throw err;
      }
    }
    containers.updateStatus(record.container_id, 'running');

    // Esperar hasta 30s a que el contenedor responda HTTP
    const target = `http://${record.container_name}:${record.internal_port}`;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const ready = await isContainerReady(target);
      if (ready) {
        // Tiempo de estabilización para servidores de desarrollo (Vite)
        await sleep(1500);
        return;
      }
      await sleep(500);
    }
    throw new Error('Container did not become ready in time');
  })();

  wakingPromises.set(subdomain, promise);

  try {
    await promise;
  } finally {
    wakingPromises.delete(subdomain);
  }
}

function isContainerReady(target) {
  return new Promise((resolve) => {
    const req = http.get(target, (res) => {
      console.log(`[proxy] isContainerReady success for ${target}, statusCode: ${res.statusCode}`);
      res.destroy();
      resolve(true);
    });
    req.on('error', (err) => {
      console.log(`[proxy] isContainerReady error for ${target}: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(1000, () => {
      console.log(`[proxy] isContainerReady timeout for ${target}`);
      req.destroy();
      resolve(false);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const server = http.createServer(async (req, res) => {
  console.log(`[proxy] Received request for host: ${req.headers.host}, url: ${req.url}`);
  const subdomain = parseSubdomain(req.headers.host);
  if (!subdomain) {
    res.writeHead(400);
    return res.end('400 - Subdominio inválido');
  }

  const record = containers.findBySubdomain(subdomain);
  if (!record) {
    res.writeHead(404);
    return res.end('404 - Proyecto no encontrado');
  }

  // Rate limiting por subdominio
  if (isRateLimited(subdomain)) {
    res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('429 - Demasiadas solicitudes, intenta más tarde');
  }

  // Update last activity
  containers.touchActivity(subdomain);

  // Wake up if stopped OR if not reachable (e.g. still booting up)
  const target = `http://${record.container_name}:${record.internal_port}`;
  const isReady = await isContainerReady(target);

  if (record.status === 'stopped' || !isReady) {
    try {
      await wakeContainer(record);
    } catch (err) {
      console.error(`[proxy] Failed to wake ${subdomain}: ${err.message}`);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('503 - El contenedor está iniciando. Por favor, recarga en unos segundos.');
    }
  }

  console.log(`[proxy] → ${req.headers.host} → ${target}`);
  // Reescribir el Host header a "localhost" para evitar que Vite/Next/etc.
  // rechacen la petición por hostname desconocido (403 Forbidden)
  proxy.web(req, res, { target, headers: { host: 'localhost' } });
});

// Also proxy WebSocket connections
server.on('upgrade', async (req, socket, head) => {
  const subdomain = parseSubdomain(req.headers.host);
  if (!subdomain) return socket.destroy();

  const record = containers.findBySubdomain(subdomain);
  if (!record) return socket.destroy();

  containers.touchActivity(subdomain);
  const target = `http://${record.container_name}:${record.internal_port}`;
  proxy.ws(req, socket, head, { target, headers: { host: 'localhost' } });
});

function start() {
  server.listen(config.proxyPort, () => {
    console.log(`[proxy] Listening on port ${config.proxyPort}`);
  });

  server.on('error', (err) => {
    console.error(`[proxy] Failed to start: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { start };