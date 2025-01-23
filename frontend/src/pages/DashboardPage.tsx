import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Dropdown, Card } from 'flowbite-react';
import { HiMenuAlt1, HiOutlineLogout, HiOutlineUser, HiOutlineCog, HiPlus, HiViewList } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import LanguageSelector from '../components/LanguageSelector';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

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
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                {t('dashboard.title')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Primer Card */}
          <Card className="bg-gray-800">
            <h5 className="text-xl font-bold tracking-tight text-white">
              {t('dashboard.quick_actions')}
            </h5>
            <div className="flex flex-col space-y-3">
              {(user?.role === 'mentor' || user?.role === 'both') && (
                <Button
                  color="blue"
                  onClick={() => navigate('/sessions/new')}
                >
                  <HiPlus className="mr-2 h-5 w-5" />
                  {t('sessions.new_session')}
                </Button>
              )}
               <Button 
                size="sm"
                gradientDuoTone="purpleToBlue"
                className="hover:bg-blue-700"
              >
                {t('dashboard.viewAllSessions')}
              </Button>
            </div>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {t('dashboard.upcomingSessions')}
              </h2>
              
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