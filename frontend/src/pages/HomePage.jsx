import { useState } from 'react';

export default function HomePage({ onNavigate }) {
    const [isHovered, setIsHovered] = useState(null);

    // Características de CubeHost
    const features = [
        {
            id: 'deploy',
            title: 'Despliegues Instantáneos',
            description: 'Conecta tu repositorio de GitHub y levanta tu aplicación en segundos. Soporte nativo para Dockerfile y Docker Compose.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            )
        },
        {
            id: 'isolation',
            title: 'Aislamiento Seguro',
            description: 'Cada proyecto corre en su propio contenedor aislado. Sin interferencias ni accesos no autorizados entre usuarios.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            )
        },
        {
            id: 'hibernation',
            title: 'Ahorro Inteligente',
            description: 'Los contenedores se apagan automáticamente tras 30 minutos de inactividad y se reactivan instantáneamente al recibir tráfico.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon">
                    <path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.61.35-.95.24a10 10 0 1 0-11.83-11.83c-.11.34-.01.71.24.95A10 10 0 0 1 12 2Z" />
                </svg>
            )
        }
    ];

    return (
        <div className="homepage-container">
            {/* Header / Navbar */}
            <header className="navbar">
                <div className="brand">
                    <span className="logo-cube">■</span>
                    <span className="brand-name">CubeHost</span>
                </div>
                <nav className="nav-links">
                    <a href="#features">Características</a>
                    {/*<a href="#about">Nosotros</a>*/}
                    <button className="btn-primary" onClick={() => onNavigate('login')}>
                        Iniciar Sesión
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="hero-section">
                <div className="hero-badge">
                    <span className="badge-dot"></span> Plataforma de Hosting basada en Contenedores
                </div>
                <h1 className="hero-title">
                    Tus aplicaciones <span className="gradient-text">desplegadas al instante</span>
                </h1>
                <p className="hero-subtitle">
                    CubeHost clona tu repositorio de GitHub, construye una imagen aislada y despliega tu aplicación en un subdominio local automáticamente.
                </p>
                <div className="hero-actions">
                    <button className="btn-action-primary" onClick={() => onNavigate('login')}>
                        Iniciar Sesión
                    </button>
                    <a href="#features" className="btn-action-secondary">
                        Saber Más &rarr;
                    </a>
                </div>

                {/* Floating card mockup */}
                {/*
                <div className="mockup-container">
                    <div className="mockup-header">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                        <span className="mockup-title">mi-proyecto.zenentest.localhost</span>
                    </div>
                    <div className="mockup-body">
                        <pre>
                            <code>
                                {`$ git push origin main
Enumerating objects: 5, done.
Writing objects: 100% (3/3), 326 bytes, done.
To github.com/zenentest/my-app.git
   f42c1d8..9a3f8b1  main -> main

[CubeHost] Detectado cambio en rama main.
[CubeHost] Descargando repositorio...
[CubeHost] Construyendo imagen Docker...
[CubeHost] Contenedor creado exitosamente [ID: c82f91a9]
[CubeHost] Servidor Caddy actualizado.
[CubeHost] ¡Tu aplicación ya está en línea en http://mi-proyecto.zenentest.localhost!`}
                            </code>
                        </pre>
                    </div>
                </div>
                */}
            </main>

            {/* Features Section */}
            <section id="features" className="features-section">
                <h2 className="section-title">¿Por qué CubeHost?</h2>
                <p className="section-subtitle">
                    Diseñado para desarrolladores que buscan rapidez, aislamiento y eficiencia en el uso de recursos.
                </p>
                <div className="features-grid">
                    {features.map((feat, idx) => (
                        <div
                            key={feat.id}
                            className={`feature-card ${isHovered === idx ? 'active' : ''}`}
                            onMouseEnter={() => setIsHovered(idx)}
                            onMouseLeave={() => setIsHovered(null)}
                        >
                            <div className="feature-icon-wrapper">
                                {feat.icon}
                            </div>
                            <h3>{feat.title}</h3>
                            <p>{feat.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} CubeHost. Todos los derechos reservados.</p>
                    <div className="footer-links">
                        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                        <span>&bull;</span>
                        <a href="#features">Documentación</a>
                    </div>
                </div>
            </footer>

            {/* Estilos locales para esta página */}
            <style>{`
        .homepage-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 0 24px;
        }

        /* Navbar */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
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

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-links a {
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--accent);
        }

        .btn-primary {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: filter 0.2s, transform 0.2s;
        }

        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* Hero */
        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 0 60px;
          gap: 24px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        .hero-title {
          font-size: 52px;
          line-height: 1.15;
          font-weight: 800;
          max-width: 800px;
          margin: 0;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent), #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 18px;
          color: var(--text);
          max-width: 600px;
          line-height: 1.6;
          margin: 0;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .btn-action-primary {
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow);
          transition: filter 0.2s, transform 0.2s;
        }

        .btn-action-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        .btn-action-secondary {
          color: var(--text-h);
          text-decoration: none;
          display: flex;
          align-items: center;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s, transform 0.2s;
        }

        .btn-action-secondary:hover {
          color: var(--accent);
          transform: translateX(4px);
        }

        /* Mockup */
        .mockup-container {
          width: 100%;
          max-width: 700px;
          background: #1e1e24;
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow);
          overflow: hidden;
          text-align: left;
          margin-top: 32px;
        }

        .mockup-header {
          background: #141416;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #2e303a;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        .mockup-title {
          color: #8a8f98;
          font-family: var(--mono);
          font-size: 13px;
          margin-left: 12px;
        }

        .mockup-body {
          padding: 20px;
          margin: 0;
        }

        .mockup-body pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .mockup-body code {
          background: transparent;
          color: #c9d1d9;
          font-size: 14px;
          line-height: 1.5;
          padding: 0;
        }

        /* Features Section */
        .features-section {
          padding: 80px 0;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .section-title {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .section-subtitle {
          font-size: 16px;
          color: var(--text);
          max-width: 500px;
          margin-bottom: 48px;
          line-height: 1.5;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 100%);
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          width: 100%;
        }

        .feature-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
          text-align: left;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
        }

        .feature-card:hover, .feature-card.active {
          border-color: var(--accent-border);
          box-shadow: var(--shadow);
          transform: translateY(-4px);
        }

        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: var(--accent-bg);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 20px;
          margin: 0 0 10px;
          color: var(--text-h);
        }

        .feature-card p {
          font-size: 14px;
          color: var(--text);
          line-height: 1.6;
          margin: 0;
        }

        /* Footer */
        .footer {
          margin-top: auto;
          border-top: 1px solid var(--border);
          padding: 24px 0;
          font-size: 14px;
          color: var(--text);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-links {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .footer-links a {
          color: var(--text);
          text-decoration: none;
        }

        .footer-links a:hover {
          color: var(--accent);
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 38px; }
          .navbar { flex-direction: column; gap: 16px; }
          .footer-content { flex-direction: column; text-align: center; }
        }
      `}</style>
        </div>
    );
}
