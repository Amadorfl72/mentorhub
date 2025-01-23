import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Dropdown, Card } from 'flowbite-react';
import { HiMenuAlt1, HiOutlineLogout, HiOutlineUser, HiOutlineCog } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Añadir estado para las estadísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    mentors: 0
  });

  useEffect(() => {
    // Verificar si el usuario necesita completar su perfil
    if (user?.role === 'pending') {
      navigate('/profile/edit', { 
        state: { 
          isNewUser: true,
          message: t('profile.complete_profile_message')
        } 
      });
    }
  }, [user, navigate, t]);

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    navigate('/register', { state: { isNewUser: false } });
  };

  // Si el usuario es 'pending', no renderizar el dashboard
  if (user?.role === 'pending') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            {t('dashboard.title')}
          </h1>
          <Button 
            onClick={handleEditProfile}
            gradientDuoTone="purpleToBlue"
            className="hover:bg-blue-700"
          >
            {t('dashboard.profile')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Sessions Card */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {t('dashboard.upcomingSessions')}
              </h2>
              <Button 
                size="sm"
                gradientDuoTone="purpleToBlue"
                className="hover:bg-blue-700"
              >
                {t('dashboard.viewAllSessions')}
              </Button>
            </div>
            {/* Contenido de sesiones */}
          </Card>

          {/* User Stats Card */}
          <Card className="bg-gray-800 border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {t('dashboard.userStats')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.totalUsers}
                </div>
                <div className="text-gray-400">
                  {t('dashboard.totalUsers')}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {stats.mentors}
                </div>
                <div className="text-gray-400">
                  {t('dashboard.mentors')}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 