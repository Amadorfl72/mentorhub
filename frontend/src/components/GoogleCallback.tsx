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
      
      console.log('Received code:', code);
      
      if (!code) {
        console.error('No code found in URL');
        navigate('/login');
        return;
      }

      try {
        const url = `${process.env.REACT_APP_API_URL}/auth/google/callback?code=${code}`;
        console.log('Calling backend URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.token) {
          await login(data);
          if (data.isNewUser) {
            navigate('/register');
          } else {
            navigate('/dashboard');
          }
        } else {
          console.error('No token in response:', data);
          navigate('/login');
        }
      } catch (error) {
        console.error('Error during callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default GoogleCallback; 