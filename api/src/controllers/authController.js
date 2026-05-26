const robleService = require('../services/robleService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }
    const data = await robleService.login(email, password);
    res.json(data);
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    next(err);
  }
}

async function signup(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password y name son requeridos' });
    }
    const data = await robleService.signup(email, password, name);
    res.status(201).json(data);
  } catch (err) {
    if (err.response?.status === 409) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    next(err);
  }
}

async function signupDirect(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password y name son requeridos' });
    }
    const data = await robleService.signupDirect(email, password, name);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'email y code son requeridos' });
    }
    const data = await robleService.verifyEmail(email, code);
    res.json(data);
  } catch (err) {
    if (err.response?.status === 400) {
      return res.status(400).json({ error: 'Código de verificación inválido o expirado' });
    }
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken es requerido' });
    }
    const data = await robleService.refreshToken(refreshToken);
    res.json(data);
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'refreshToken inválido o expirado' });
    }
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email es requerido' });
    }
    await robleService.forgotPassword(email);
    res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token y newPassword son requeridos' });
    }
    const data = await robleService.resetPassword(token, newPassword);
    res.json(data);
  } catch (err) {
    if (err.response?.status === 400) {
      return res.status(400).json({ error: 'Token de recuperación inválido o expirado' });
    }
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await robleService.logout(req.token);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json(req.user);
}

module.exports = {
  login,
  signup,
  signupDirect,
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  me,
};
