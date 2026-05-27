import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // ID del proyecto en acción

    // Función para obtener proyectos de la API
    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error('Error al cargar proyectos:', err);
        } finally {
            setLoadingProjects(false);
        }
    };

    useEffect(() => {
        fetchProjects();

        // Intervalo para refrescar el estado de los contenedores automáticamente cada 5 segundos
        const interval = setInterval(fetchProjects, 5000);
        return () => clearInterval(interval);
    }, []);

    // Agregar nuevo proyecto a la lista localmente
    const handleProjectCreated = (newProject) => {
        setProjects((prev) => [newProject, ...prev]);
    };

    // Iniciar contenedor (POST /api/projects/:id/start)
    const handleStart = async (id) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/projects/${id}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                await fetchProjects();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al iniciar el contenedor');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    // Detener contenedor (POST /api/projects/:id/stop)
    const handleStop = async (id) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/projects/${id}/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                await fetchProjects();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al detener el contenedor');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    // Eliminar proyecto (DELETE /api/projects/:id)
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este proyecto y su contenedor permanentemente?')) {
            return;
        }
        setActionLoading(id);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setProjects((prev) => prev.filter((p) => p.id !== id));
            } else {
                alert('Error al eliminar el proyecto');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

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
                        <button className="btn-action-primary" onClick={() => setIsModalOpen(true)}>
                            + Nuevo Proyecto
                        </button>
                    </div>

                    {loadingProjects ? (
                        <div className="loading-projects">Cargando proyectos...</div>
                    ) : projects.length === 0 ? (
                        /* Tarjeta de estado vacío */
                        <div className="empty-projects-card">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            <h3>Aún no tienes proyectos creados</h3>
                            <p>Conecta un repositorio de GitHub que contenga un Dockerfile para realizar tu primer despliegue.</p>
                            <button className="btn-create-first" onClick={() => setIsModalOpen(true)}>
                                Desplegar mi primer proyecto
                            </button>
                        </div>
                    ) : (
                        /* Cuadrícula de Proyectos */
                        <div className="projects-grid">
                            {projects.map((project) => {
                                const projectUrl = `http://${project.name}.${project.username}.localhost`;
                                const isWorking = actionLoading === project.id;

                                return (
                                    <div key={project.id} className="project-card">
                                        <div className="card-header">
                                            <div className="title-area">
                                                <span className="project-name">{project.name}</span>
                                                <span className={`status-pill ${project.status}`}>
                                                    <span className="status-dot"></span>
                                                    {project.status === 'running' && 'Activo'}
                                                    {project.status === 'stopped' && 'Detenido'}
                                                    {project.status === 'building' && 'Construyendo'}
                                                    {project.status === 'pending' && 'Pendiente'}
                                                    {project.status === 'error' && 'Error'}
                                                </span>
                                            </div>
                                            <span className="container-badge">{project.container_type}</span>
                                        </div>

                                        <div className="card-body">
                                            <div className="info-row">
                                                <span className="info-label">Repositorio</span>
                                                <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="info-val repo-link">
                                                    GitHub &nearr;
                                                </a>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Puerto Interno</span>
                                                <span className="info-val">{project.port}</span>
                                            </div>
                                            {project.status === 'running' && (
                                                <div className="info-row">
                                                    <span className="info-label">Enlace Local</span>
                                                    <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                                                        {project.name}.{project.username}.localhost &nearr;
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-actions">
                                            {project.status === 'running' ? (
                                                <button
                                                    className="btn-stop"
                                                    onClick={() => handleStop(project.id)}
                                                    disabled={isWorking}
                                                >
                                                    {isWorking ? 'Procesando...' : 'Detener'}
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-start"
                                                    onClick={() => handleStart(project.id)}
                                                    disabled={isWorking || project.status === 'building'}
                                                >
                                                    {isWorking ? 'Procesando...' : 'Iniciar'}
                                                </button>
                                            )}

                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(project.id)}
                                                disabled={isWorking}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Modal de Creación */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />

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

        .loading-projects {
          padding: 40px;
          text-align: center;
          color: var(--text);
          font-size: 15px;
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

        /* Cuadrícula de Proyectos */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          width: 100%;
        }

        .project-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: var(--shadow);
          transition: transform 0.2s, border-color 0.2s;
        }

        .project-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-border);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .title-area {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .project-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-h);
        }

        .container-badge {
          background: var(--code-bg);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        /* Status Pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 12px;
          width: max-content;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-pill.running {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        .status-pill.running .status-dot {
          background: #22c55e;
        }

        .status-pill.stopped {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        .status-pill.stopped .status-dot {
          background: #6b7280;
        }

        .status-pill.building {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .status-pill.building .status-dot {
          background: #3b82f6;
          animation: pulse 1.5s infinite;
        }

        .status-pill.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .status-pill.pending .status-dot {
          background: #f59e0b;
        }

        .status-pill.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .status-pill.error .status-dot {
          background: #ef4444;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        /* Body de Tarjeta */
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,0,0,0.02);
          padding-bottom: 6px;
        }

        .info-label {
          color: var(--text);
        }

        .info-val {
          font-weight: 500;
          color: var(--text-h);
        }

        .repo-link, .project-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }

        .repo-link:hover, .project-link:hover {
          text-decoration: underline;
        }

        /* Acciones de Tarjeta */
        .card-actions {
          display: flex;
          gap: 10px;
        }

        .btn-start, .btn-stop, .btn-delete {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }

        .btn-start {
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          color: var(--accent);
        }

        .btn-start:hover {
          background: var(--accent);
          color: white;
        }

        .btn-stop {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-h);
        }

        .btn-stop:hover {
          background: var(--code-bg);
        }

        .btn-delete {
          background: transparent;
          border: 1px solid transparent;
          color: #ef4444;
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-start:disabled, .btn-stop:disabled, .btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
