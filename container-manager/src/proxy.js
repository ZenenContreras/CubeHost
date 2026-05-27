const http = require('http');
const httpProxy = require('http-proxy');
const config = require('./config');
const { containers } = require('./db');
const docker = require('./docker');

const proxy = httpProxy.createProxyServer({ timeout: 30_000 });

// Rate limiting: max 100 requests por minuto por subdominio
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;

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
  console.log(`[proxy] Waking container for ${record.subdomain}`);
  await docker.startContainer(record.container_id);
  containers.updateStatus(record.container_id, 'running');

  // Wait up to 30s for the container to be ready
  const target = `http://${record.container_name}:${record.internal_port}`;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const ready = await isContainerReady(target);
    if (ready) return;
    await sleep(500);
  }
  throw new Error('Container did not become ready in time');
}

function isContainerReady(target) {
  return new Promise((resolve) => {
    const req = http.get(target, (res) => {
      res.destroy();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const server = http.createServer(async (req, res) => {
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

  // Wake up if stopped
  if (record.status === 'stopped') {
    try {
      await wakeContainer(record);
    } catch (err) {
      console.error(`[proxy] Failed to wake ${subdomain}: ${err.message}`);
      res.writeHead(503);
      return res.end('503 - No se pudo iniciar el contenedor');
    }
  }

  // Usar IP directa si está disponible para evitar problemas de resolución DNS
  const host = record.container_ip || record.container_name;
  const target = `http://${host}:${record.internal_port}`;
  console.log(`[proxy] → ${req.headers.host} → ${target}`);
  proxy.web(req, res, { target });
});

// Also proxy WebSocket connections
server.on('upgrade', async (req, socket, head) => {
  const subdomain = parseSubdomain(req.headers.host);
  if (!subdomain) return socket.destroy();

  const record = containers.findBySubdomain(subdomain);
  if (!record) return socket.destroy();

  containers.touchActivity(subdomain);
  const target = `http://${record.container_name}:${record.internal_port}`;
  proxy.ws(req, socket, head, { target });
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