const robleService = require('../services/robleService');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const response = await robleService.verifyToken(token);
    // Roble devuelve { valid: true, user: { sub, email, dbName, role, sessionId } }
    if (!response.valid) return res.status(401).json({ error: 'Token inválido o expirado' });
    req.user = response.user; // { sub, email, dbName, role, sessionId }
    req.token = token;
    next();
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    next(err);
  }
}

module.exports = { requireAuth };
