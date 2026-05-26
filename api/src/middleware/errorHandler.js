function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Axios errors from container-manager
  if (err.response) {
    return res.status(err.response.status || 502).json({
      error: err.response.data?.error || 'Error en container-manager',
    });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { errorHandler };
