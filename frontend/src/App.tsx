import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import { AuthProvider } from './context/AuthContext';
import GoogleCallback from './components/GoogleCallback';
import PrivateRoute from './components/PrivateRoute';
import SessionDetailsPage from './pages/SessionDetailsPage';
import { initCacheCleanup } from './services/imageCache';
import AllSessionsPage from './pages/AllSessionsPage';
import { verifyToken } from './services/authService';

const AppRoutes = () => {
  const { isAuthenticated, login } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const { valid, user } = await verifyToken();
        
        if (valid && user) {
          // Si el token es válido y tenemos datos del usuario, hacemos login automático
          const token = localStorage.getItem('token');
          if (token) {
            login({ token, user });
          }
        }
      } catch (error) {
        console.error('Error verificando token:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [login]);

  // Mientras verificamos el token, mostramos un indicador de carga
  if (isVerifying) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white">Verificando sesión...</div>
    </div>;
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
      } />
      <Route path="/auth/callback" element={<GoogleCallback />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <RegisterPage />
          </PrivateRoute>
        } 
      />
      
      {/* Rutas de sesiones */}
      <Route 
        path="/sessions" 
        element={
          <PrivateRoute>
            <AllSessionsPage />
          </PrivateRoute>
        } 
      />
      <Route path="/session/new" element={<SessionDetailsPage />} />
      <Route path="/session/:id" element={<SessionDetailsPage />} />
      
      {/* Redirección por defecto */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
      } />
      <Route path="*" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Iniciar limpieza de caché cada hora
    const cleanup = initCacheCleanup();
    return () => cleanup(); // Limpiar al desmontar
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App; 