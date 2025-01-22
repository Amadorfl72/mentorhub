import React from 'react';
import { Card, Dropdown } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { HiTranslate } from 'react-icons/hi';

const LoginPage = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const handleGoogleLogin = () => {
    console.log('Iniciando login con Google...'); // Debug log
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found');
      return;
    }
    console.log('Client ID encontrado:', clientId); // Debug log

    const params = {
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'email profile openid',
      access_type: 'offline',
      prompt: 'consent',
    };

    console.log('Parámetros de auth:', params); // Debug log
    const queryString = new URLSearchParams(params).toString();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
    
    console.log('URL de autenticación:', authUrl); // Debug log
    window.location.href = authUrl;
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <Dropdown
          label={<HiTranslate className="w-5 h-5" />}
          dismissOnClick={true}
          className="bg-white"
        >
          {languages.map((lang) => (
            <Dropdown.Item
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={i18n.language === lang.code ? 'bg-gray-100' : ''}
            >
              {lang.name}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>

      <Card className="w-[450px] p-8 rounded-3xl shadow-lg">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('login.welcome', { appName: t('app.name') })}
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            {t('app.slogan')}
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white py-4 px-6 rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            <span className="text-lg font-medium">{t('login.button')}</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage; 