const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = Router();

// POST /api/auth/login           → email + password → { accessToken, refreshToken }
router.post('/login', authController.login);

// POST /api/auth/signup          → email + password + name (envía verificación por correo)
router.post('/signup', authController.signup);

// POST /api/auth/signup-direct   → igual sin verificación (para pruebas)
router.post('/signup-direct', authController.signupDirect);

// POST /api/auth/verify-email    → { email, code }
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/refresh-token   → { refreshToken } → { accessToken }
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/forgot-password → { email }
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password  → { token, newPassword }
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/logout          → Bearer token (requiere auth)
router.post('/logout', requireAuth, authController.logout);

// GET  /api/auth/me              → perfil del usuario autenticado
router.get('/me', requireAuth, authController.me);

module.exports = router;
