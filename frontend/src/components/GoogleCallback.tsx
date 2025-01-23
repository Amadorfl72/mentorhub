import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        console.error('No code found in URL');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/google/callback?code=${encodeURIComponent(code)}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.token) {
          await login(data);
          
          // Limpiar la URL después de procesar el código
          window.history.replaceState({}, document.title, window.location.pathname);
          
          if (data.isNewUser || data.user.role === 'pending') {
            navigate('/register', { 
              state: { 
                isNewUser: true,
                message: 'Please complete your profile information'
              },
              replace: true 
            });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          throw new Error('No token in response');
        }
      } catch (error) {
        console.error('Error during callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, login]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default GoogleCallback; 