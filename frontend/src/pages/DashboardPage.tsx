import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Dropdown, Card, Toast } from 'flowbite-react';
import { HiMenuAlt1, HiOutlineLogout, HiOutlineUser, HiOutlineCog, HiPlus, HiViewList, HiCheck, HiX } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import LanguageSelector from '../components/LanguageSelector';
import { getMentorSessions, Session } from '../services/sessionService';

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Añadir esta función para truncar la descripción
const truncateDescription = (description: string, maxLength: number = 100) => {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength).trim();
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Añadir estado para las estadísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    mentors: 0
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    show: false, 
    message: '', 
    type: 'success' 
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

  // Cargar las sesiones al montar el componente
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const userSessions = await getMentorSessions();
        setSessions(userSessions);
      } catch (error) {
        console.error('Error al cargar las sesiones:', error);
        showNotification('Error al cargar las sesiones', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadSessions();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    navigate('/register', { state: { isNewUser: false } });
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Si el usuario es 'pending', no renderizar el dashboard
  if (user?.role === 'pending') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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

      {/* Sección de sesiones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('sessions.mySessions')}</h2>
          <Button 
            color="blue" 
            onClick={() => navigate('/session/new')}
            className="flex items-center gap-2"
          >
            <HiPlus className="h-5 w-5" />
            {t('sessions.new_session')}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(session => (
              <div key={session.id} className="bg-gray-800 rounded-lg p-4 shadow h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                <div className="mb-3 flex-grow">
                  <p className="text-gray-300">
                    {truncateDescription(session.description)}
                    {session.description.length > 100 && (
                      <button 
                        onClick={() => navigate(`/session/${session.id}`)}
                        className="text-blue-400 hover:text-blue-300 ml-1 focus:outline-none"
                      >
                        {t('sessions.show_more')}
                      </button>
                    )}
                  </p>
                </div>
                
                {/* Keywords como etiquetas */}
                {session.keywords && session.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {session.keywords.split(',').filter(Boolean).map(keyword => (
                      <span 
                        key={keyword.trim()} 
                        className="bg-purple-900 text-purple-100 px-2 py-0.5 text-xs rounded-full"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-400 mt-auto">
                  <span>
                    {new Date(session.scheduled_time).toLocaleDateString()} - {new Date(session.scheduled_time).toLocaleTimeString()}
                  </span>
                  <span>Max: {session.max_attendees}</span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button 
                    size="xs" 
                    color="light"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button size="xs" color="failure">{t('common.cancel')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No tienes sesiones programadas.</p>
            <Button 
              color="blue" 
              onClick={() => navigate('/session/new')}
              className="mt-4"
            >
              Crear tu primera sesión
            </Button>
          </div>
        )}
      </div>
      
      {/* Notificación */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              {notification.type === 'success' ? (
                <HiCheck className="h-5 w-5 text-green-500" />
              ) : (
                <HiX className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">
              {notification.message}
            </div>
            <Toast.Toggle />
          </Toast>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 