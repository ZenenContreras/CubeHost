const axios = require('axios');
const config = require('../config');

const roble = axios.create({
  baseURL: `${config.roble.baseUrl}/${config.roble.dbName}`,
  timeout: 10_000,
});

async function login(email, password) {
  const { data } = await roble.post('/login', { email, password });
  return data; // { accessToken, refreshToken }
}

async function signup(email, password, name) {
  const { data } = await roble.post('/signup', { email, password, name });
  return data;
}

async function signupDirect(email, password, name) {
  const { data } = await roble.post('/signup-direct', { email, password, name });
  return data;
}

async function verifyEmail(email, code) {
  const { data } = await roble.post('/verify-email', { email, code });
  return data;
}

async function refreshToken(token) {
  const { data } = await roble.post('/refresh-token', { refreshToken: token });
  return data; // { accessToken }
}

async function forgotPassword(email) {
  const { data } = await roble.post('/forgot-password', { email });
  return data;
}

async function resetPassword(token, newPassword) {
  const { data } = await roble.post('/reset-password', { token, newPassword });
  return data;
}

async function logout(accessToken) {
  const { data } = await roble.post('/logout', null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

async function verifyToken(accessToken) {
  const { data } = await roble.get('/verify-token', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data; // información del usuario
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
  verifyToken,
};
