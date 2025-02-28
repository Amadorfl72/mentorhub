import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import { AuthProvider } from './context/AuthContext';
import GoogleCallback from './components/GoogleCallback';
import PrivateRoute from './components/PrivateRoute';
import SessionPage from './pages/SessionPage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/session/new" element={<SessionPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App; 