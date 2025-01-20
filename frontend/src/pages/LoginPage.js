import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  console.log('Client ID:', GOOGLE_CLIENT_ID); // Para debugging

  const handleGoogleLogin = () => {
    const params = {
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: 'http://localhost:3000/auth/callback',
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    };

    console.log('OAuth Params:', params); // Para debugging

    const queryString = new URLSearchParams(params).toString();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <button 
        onClick={handleGoogleLogin}
        className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center"
      >
        <img 
          src="/google-icon.png" 
          alt="Google" 
          className="w-5 h-5 mr-2"
        />
        Iniciar Sesión con Google
      </button>
    </div>
  );
};

export default LoginPage;
