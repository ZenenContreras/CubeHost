const robleService = require('../services/robleService');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const userData = await robleService.verifyToken(token);
    // Roble devuelve la info del usuario; la adjuntamos al request
    req.user = userData;
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
