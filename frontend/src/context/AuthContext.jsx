import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar el componente, verificamos si hay una sesión activa en localStorage
  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Consultar el perfil del usuario autenticado
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else if (res.status === 401) {
          // Si el token expiró, intentamos renovarlo con el refreshToken
          await refreshSessionTokens();
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  // Función para renovar el accessToken usando el refreshToken
  async function refreshSessionTokens() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);

        // Volvemos a pedir los datos del usuario con el nuevo token
        const meRes = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.accessToken}`
          }
        });

        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error al renovar tokens:', err);
      logout();
    }
  }

  // Iniciar Sesión (POST /api/auth/login)
  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Credenciales inválidas');
      }

      // Guardar tokens en localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Guardar información básica del usuario en el estado
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Registro de Usuario (usaremos signup-direct para saltarnos la verificación por correo en pruebas locales)
  async function signup(name, email, password) {
    try {
      const res = await fetch('/api/auth/signup-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Error al registrar el usuario');
      }

      // Una vez registrado con signup-direct, iniciamos sesión automáticamente
      return await login(email, password);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Cerrar Sesión (POST /api/auth/logout)
  async function logout() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Error al notificar logout al servidor:', err);
      }
    }

    // Limpiar localStorage y estado local
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
