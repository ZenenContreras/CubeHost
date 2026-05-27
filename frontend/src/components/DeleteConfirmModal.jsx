export default function DeleteConfirmModal({ project, onCancel, onConfirm }) {
  if (!project) return null;

  return (
    <>
      <div className="dcm-overlay" onClick={onCancel}>
        <div className="dcm-card" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="dcm-header">
            <div className="dcm-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="dcm-title-group">
              <h2 className="dcm-title">Eliminar proyecto</h2>
              <p className="dcm-subtitle">Esta acción no se puede deshacer</p>
            </div>
            <button className="dcm-close" onClick={onCancel} aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="dcm-body">
            <p className="dcm-desc">
              Estás a punto de eliminar permanentemente el proyecto{' '}
              <span className="dcm-project-name">{project.name}</span>.
            </p>

            <div className="dcm-warning-box">
              <div className="dcm-warning-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>Todos los contenedores Docker serán destruidos</span>
              </div>
              <div className="dcm-warning-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>El subdominio <code className="dcm-code">{project.name}.{project.username}.localhost</code> dejará de funcionar</span>
              </div>
              <div className="dcm-warning-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>Los datos asociados no podrán ser recuperados</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dcm-footer">
            <button className="dcm-btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button className="dcm-btn-delete" onClick={onConfirm}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Sí, eliminar proyecto
            </button>
          </div>

        </div>
      </div>

      <style>{`
        .dcm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: dcm-fadeIn 0.2s ease-out;
        }

        @keyframes dcm-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .dcm-card {
          background: #1c1c1e;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          width: 100%;
          max-width: 440px;
          margin: 16px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(239, 68, 68, 0.1),
            0 24px 48px -12px rgba(0, 0, 0, 0.7),
            0 0 60px -20px rgba(239, 68, 68, 0.2);
          animation: dcm-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dcm-slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* ── Header ────────────────────────────── */
        .dcm-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 22px 22px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .dcm-icon-wrap {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: dcm-shake 0.5s ease-in-out 0.2s both;
        }

        @keyframes dcm-shake {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-8deg); }
          40%       { transform: rotate(8deg); }
          60%       { transform: rotate(-5deg); }
          80%       { transform: rotate(5deg); }
        }

        .dcm-title-group {
          flex: 1;
          min-width: 0;
        }

        .dcm-title {
          margin: 0 0 3px;
          font-size: 17px;
          font-weight: 700;
          color: #f87171;
          letter-spacing: -0.01em;
        }

        .dcm-subtitle {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 500;
        }

        .dcm-close {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .dcm-close:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
        }

        /* ── Body ──────────────────────────────── */
        .dcm-body {
          padding: 20px 22px;
        }

        .dcm-desc {
          margin: 0 0 16px;
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.55;
        }

        .dcm-project-name {
          font-weight: 700;
          color: #fff;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 1px 7px;
          border-radius: 5px;
        }

        .dcm-warning-box {
          background: rgba(239, 68, 68, 0.04);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dcm-warning-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.45;
        }

        .dcm-warning-item svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .dcm-code {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 1px 5px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.65);
        }

        /* ── Footer ────────────────────────────── */
        .dcm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dcm-btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.65);
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .dcm-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.09);
          color: #fff;
        }

        .dcm-btn-delete {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ef4444;
          border: 1px solid #dc2626;
          color: #fff;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px -4px rgba(239, 68, 68, 0.5);
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }

        .dcm-btn-delete:hover {
          background: #dc2626;
          box-shadow: 0 6px 20px -4px rgba(239, 68, 68, 0.65);
        }

        .dcm-btn-delete:active {
          transform: scale(0.97);
        }
      `}</style>
    </>
  );
}
