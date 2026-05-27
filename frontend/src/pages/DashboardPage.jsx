import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      {/* Header del Dashboard */}
      <header className="dash-header">
        <div className="brand">
          <span className="logo-cube">■</span>
          <span className="brand-name">CubeHost</span>
          <span className="badge-dash">Dashboard</span>
        </div>
        <div className="user-menu">
          <span className="user-email">{user?.email}</span>
          <button className="btn-logout" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="dash-main">
        <section className="welcome-banner">
          <h1>¡Bienvenido, <span className="gradient-text">{user?.name || 'Estudiante'}</span>!</h1>
          <p>Este es tu panel de control de CubeHost. Desde aquí podrás gestionar tus aplicaciones y contenedores Docker.</p>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <h2>Mis Proyectos</h2>
            <button className="btn-action-primary" onClick={() => alert('Próximamente: Crear y desplegar nuevo proyecto')}>
              + Nuevo Proyecto
            </button>
          </div>

          {/* Tarjeta de estado vacío (Empty State) */}
          <div className="empty-projects-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h3>Aún no tienes proyectos creados</h3>
            <p>Conecta un repositorio de GitHub que contenga un Dockerfile para realizar tu primer despliegue.</p>
            <button className="btn-create-first" onClick={() => alert('Próximamente: Abrir formulario de creación')}>
              Desplegar mi primer proyecto
            </button>
          </div>
        </section>
      </main>

      {/* Estilos locales para el Dashboard */}
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 0 24px;
          background: var(--bg);
        }

        /* Header */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 22px;
          color: var(--text-h);
        }

        .logo-cube {
          color: var(--accent);
          font-size: 26px;
        }

        .badge-dash {
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-email {
          font-size: 14px;
          color: var(--text);
        }

        .btn-logout {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-h);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-logout:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        /* Contenido */
        .dash-main {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 40px 0;
          text-align: left;
        }

        .welcome-banner h1 {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 8px 0;
          color: var(--text-h);
        }

        .welcome-banner p {
          font-size: 16px;
          color: var(--text);
          margin: 0;
          max-width: 600px;
          line-height: 1.5;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent), #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Seccion Proyectos */
        .projects-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          font-size: 22px;
          margin: 0;
          color: var(--text-h);
        }

        .btn-action-primary {
          background: var(--accent);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow);
          transition: filter 0.2s;
        }

        .btn-action-primary:hover {
          filter: brightness(1.1);
        }

        /* Tarjeta Estado Vacio */
        .empty-projects-card {
          border: 1px dashed var(--border);
          border-radius: 12px;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: var(--code-bg);
        }

        .empty-icon {
          color: var(--text);
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-projects-card h3 {
          font-size: 18px;
          margin: 0 0 8px 0;
          color: var(--text-h);
        }

        .empty-projects-card p {
          font-size: 14px;
          color: var(--text);
          max-width: 400px;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .btn-create-first {
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .btn-create-first:hover {
          background: var(--accent);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
