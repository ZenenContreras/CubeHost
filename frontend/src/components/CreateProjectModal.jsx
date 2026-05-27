import { useState } from 'react';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
    const [name, setName] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [containerType, setContainerType] = useState('dockerfile');
    const [port, setPort] = useState('80');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validación básica del nombre (mismo regex del backend)
        if (!/^[a-z0-9-]+$/.test(name)) {
            setError('El nombre del proyecto solo puede contener letras minúsculas, números y guiones (sin espacios).');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    repoUrl,
                    containerType,
                    port: Number(port)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Ocurrió un error al crear el proyecto.');
            }

            // Notificar al componente padre que se creó el proyecto con éxito
            onProjectCreated(data);
            onClose(); // Cerrar el modal
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Encabezado */}
                <div className="modal-header">
                    <h2>Nuevo Proyecto</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="error-message">{error}</div>}

                    {/* Campo: Nombre del proyecto */}
                    <div className="form-group">
                        <label htmlFor="proj-name">Nombre del Proyecto</label>
                        <input
                            type="text"
                            id="proj-name"
                            placeholder="ej. mi-app-web"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <span className="field-hint">Solo minúsculas, números y guiones.</span>
                    </div>

                    {/* Campo: URL de repositorio */}
                    <div className="form-group">
                        <label htmlFor="repo-url">URL del Repositorio de GitHub</label>
                        <input
                            type="url"
                            id="repo-url"
                            placeholder="https://github.com/usuario/repositorio"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            required
                        />
                    </div>

                    {/* Campo: Tipo de contenedor (Dockerfile / Compose) */}
                    <div className="form-group">
                        <label>Tipo de Configuración</label>
                        <div className="radio-group">
                            <label className={`radio-card ${containerType === 'dockerfile' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="containerType"
                                    value="dockerfile"
                                    checked={containerType === 'dockerfile'}
                                    onChange={() => setContainerType('dockerfile')}
                                />
                                <div className="radio-content">
                                    <span className="radio-title">Dockerfile</span>
                                    <span className="radio-desc">Ideal para aplicaciones individuales con un único puerto expuesto.</span>
                                </div>
                            </label>
                            <label className={`radio-card ${containerType === 'compose' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="containerType"
                                    value="compose"
                                    checked={containerType === 'compose'}
                                    onChange={() => setContainerType('compose')}
                                />
                                <div className="radio-content">
                                    <span className="radio-title">Docker Compose</span>
                                    <span className="radio-desc">Ideal para multi-contenedores o proyectos complejos de varias capas.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Campo: Puerto */}
                    <div className="form-group">
                        <label htmlFor="proj-port">Puerto a Exponer</label>
                        <input
                            type="number"
                            id="proj-port"
                            placeholder="80"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            min="1"
                            max="65535"
                            required
                        />
                        <span className="field-hint">El puerto interno en el que escucha tu aplicación dentro del contenedor.</span>
                    </div>

                    {/* Botones de acción */}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Construyendo contenedor...' : 'Crear Proyecto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Estilos locales para el Modal */}
            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 100%;
          max-width: 550px;
          box-shadow: var(--shadow);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          font-size: 20px;
          margin: 0;
          color: var(--text-h);
        }

        .btn-close {
          background: transparent;
          border: none;
          font-size: 24px;
          color: var(--text);
          cursor: pointer;
          transition: color 0.2s;
        }

        .btn-close:hover {
          color: var(--text-h);
        }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-h);
        }

        .form-group input[type="text"],
        .form-group input[type="url"],
        .form-group input[type="number"] {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          background: var(--bg);
          color: var(--text-h);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg);
        }

        .field-hint {
          font-size: 11px;
          color: var(--text);
          opacity: 0.8;
        }

        /* Radio Cards */
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .radio-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .radio-card:hover {
          background: var(--code-bg);
        }

        .radio-card.active {
          border-color: var(--accent);
          background: var(--accent-bg);
        }

        .radio-card input {
          margin-top: 4px;
        }

        .radio-content {
          display: flex;
          flex-direction: column;
        }

        .radio-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-h);
        }

        .radio-desc {
          font-size: 12px;
          color: var(--text);
          line-height: 1.4;
          margin-top: 2px;
        }

        /* Botones del Modal */
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-h);
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-cancel:hover {
          background: var(--code-bg);
        }

        .btn-submit {
          background: var(--accent);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.2s;
        }

        .btn-submit:hover {
          filter: brightness(1.1);
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
