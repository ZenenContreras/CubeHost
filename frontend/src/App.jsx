import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  // Redirigir a la HomePage al cerrar sesión
  useEffect(() => {
    if (!user) {
      setCurrentView('home');
    }
  }, [user]);

  // Si está validando el token al cargar la página
  if (loading) {
    return (
      <div className="loading-container">
        <span className="logo-spinner">■</span>
        <p>Cargando sesión...</p>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
          }
          .logo-spinner {
            color: var(--accent);
            font-size: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si el usuario ya está autenticado, se muestra el Dashboard directamente
  if (user) {
    return <DashboardPage />;
  }

  // Si no está autenticado, navegamos entre la página pública y el login/registro
  return (
    <>
      {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
      {currentView === 'login' && <LoginPage onNavigate={setCurrentView} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;



