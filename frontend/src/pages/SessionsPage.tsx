import React from 'react';
import { useTranslation } from 'react-i18next';

const SessionsPage: React.FC = () => {
  const { t }: { t: (key: string) => string } = useTranslation();

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{t('sessions.title')}</h1>
      <p className="text-gray-700">{t('sessions.description')}</p>
    </div>
  );
};

export default SessionsPage; 