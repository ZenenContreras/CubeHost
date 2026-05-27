import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigate }) {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación básica del correo institucional
    if (!email.endsWith('@uninorte.edu.co')) {
      setError('Por favor, ingresa tu correo institucional de Uninorte (@uninorte.edu.co).');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await signup(name, email, password);
      }

      if (result.success) {
        // Redirigir al dashboard tras inicio de sesión exitoso
        onNavigate('dashboard');
      } else {
        setError(result.error || 'Ocurrió un error. Verifica tus datos.');
      }
    } catch (err) {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Botón flotante para regresar al Home */}
      <button className="btn-back" onClick={() => onNavigate('home')}>
        &larr; Volver al inicio
      </button>

      <div className="auth-card">
        {/* Lado Izquierdo: Información / Panel decorativo */}
        <div className="auth-sidebar">
          <div className="sidebar-header">
            <span className="logo-cube">■</span>
            <span className="brand-name">CubeHost</span>
          </div>
          <div className="sidebar-body">
            <h2>Hospeda tus proyectos académicos</h2>
            <p>Sube tus laboratorios, sitios web y backend directamente en contenedores aislados y accede a ellos mediante subdominios locales.</p>
          </div>
          <div className="sidebar-footer">
            <span>Universidad del Norte &bull; Roble Auth</span>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="auth-form-panel">
          {/* Selector de pestañas */}
          <div className="tab-selector">
            <button
              className={`tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-header">
              <h3>{isLogin ? 'Bienvenido de nuevo' : 'Regístrate en la plataforma'}</h3>
              <p>{isLogin ? 'Ingresa tus credenciales institucionales para acceder.' : 'Crea tu espacio de trabajo personal.'}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Campo: Nombre (Solo visible en Registro) */}
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Nombre Completo</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            {/* Campo: Correo Institucional */}
            <div className="form-group">
              <label htmlFor="email">Correo Institucional</label>
              <input
                type="email"
                id="email"
                placeholder="ejemplo@uninorte.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Botón de acción */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Procesando...' : isLogin ? 'Ingresar' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>

      {/* Estilos locales para la página de login */}
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 24px;
          background: var(--bg);
          position: relative;
        }

        .btn-back {
          position: absolute;
          top: 24px;
          left: 24px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-back:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Card Principal */
        .auth-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          min-height: 550px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        /* Barra Lateral Izquierda */
        .auth-sidebar {
          flex: 1;
          background: linear-gradient(135deg, #101827, #1e293b);
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #f3f4f6;
          border-right: 1px solid var(--border);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 20px;
        }

        .sidebar-header .logo-cube {
          color: var(--accent);
          font-size: 24px;
        }

        .sidebar-body h2 {
          font-size: 28px;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.25;
          text-align: left;
        }

        .sidebar-body p {
          font-size: 15px;
          color: #9ca3af;
          line-height: 1.6;
          text-align: left;
        }

        .sidebar-footer {
          font-size: 13px;
          color: #6b7280;
          text-align: left;
        }

        /* Formulario Derecho */
        .auth-form-panel {
          flex: 1.1;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--bg);
        }

        /* Selector de Pestañas */
        .tab-selector {
          display: flex;
          border-bottom: 1px solid var(--border);
          margin-bottom: 30px;
          gap: 20px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 8px 4px 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .tab-btn:hover {
          color: var(--accent);
        }

        .tab-btn.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        /* Formularios */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .form-header h3 {
          font-size: 22px;
          margin: 0 0 6px 0;
          color: var(--text-h);
        }

        .form-header p {
          font-size: 14px;
          color: var(--text);
          margin: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-h);
        }

        .form-group input {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 15px;
          background: var(--bg);
          color: var(--text-h);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg);
        }

        .btn-submit {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.2s;
          margin-top: 8px;
        }

        .btn-submit:hover {
          filter: brightness(1.1);
        }

        .btn-submit:disabled {
          background: var(--border);
          color: var(--text);
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .auth-card {
            flex-direction: column;
          }
          .auth-sidebar {
            padding: 30px;
          }
          .auth-form-panel {
            padding: 30px;
          }
        }
      `}</style>
    </div>
  );
}
