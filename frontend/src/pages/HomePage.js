import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="flex mb-4">
        <button onClick={() => changeLanguage('en')} className="mx-2">
          <img src="/flags/en.png" alt="English" className="flag-icon" />
        </button>
        <button onClick={() => changeLanguage('es')} className="mx-2">
          <img src="/flags/es.png" alt="Español" className="flag-icon" />
        </button>
        <button onClick={() => changeLanguage('fr')} className="mx-2">
          <img src="/flags/fr.png" alt="Français" className="flag-icon" />
        </button>
      </div>
      <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
      <p className="text-lg text-gray-700 mb-6">{t('loginPrompt')}</p>
      <Link to="/login">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {t('login')}
        </button>
      </Link>
    </div>
  );
};

export default HomePage;
