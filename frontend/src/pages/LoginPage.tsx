import React from 'react';
import { Card } from 'flowbite-react';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) return;
    
    const params = {
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: 'http://localhost:3000/auth/callback',
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    };

    const queryString = new URLSearchParams(params).toString();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to MentorHub
          </h1>
          <p className="text-gray-500 text-sm">
            Conectando mentes, construyendo futuros
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          Sign in with Google
        </button>
      </Card>
    </div>
  );
};

export default LoginPage; 