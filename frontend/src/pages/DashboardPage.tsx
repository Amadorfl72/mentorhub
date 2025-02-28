import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Dropdown, Card, Toast, Modal, Label } from 'flowbite-react';
import { 
  HiMenuAlt1, 
  HiOutlineLogout, 
  HiOutlineUser, 
  HiOutlineCog, 
  HiPlus, 
  HiViewList, 
  HiCheck, 
  HiX, 
  HiExclamation,
  HiCalendar,
  HiUsers
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import LanguageSelector from '../components/LanguageSelector';
import { getMentorSessions, deleteSession, Session } from '../services/sessionService';
import { fetchData } from '../services/apiService';
import CachedImage from '../components/CachedImage';

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Interface for mentor information
interface MentorInfo {
  id: number;
  name: string;
  email: string;
  photoUrl?: string;
  role: string;
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
    totalMentors: 0,
    totalMentees: 0,
    totalSessions: 0
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPastSessions, setShowPastSessions] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  // Estado para almacenar información de mentores
  const [mentors, setMentors] = useState<Record<number, MentorInfo>>({});
  
  // Nuevo estado para el modal de confirmación de borrado
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    sessionId: number | null;
  }>({
    show: false,
    sessionId: null
  });

  // Función para obtener información básica del usuario
  const getUserInfo = async (userId: number): Promise<MentorInfo | null> => {
    try {
      // Intentar obtener la información del usuario desde el backend
      const response = await fetch(`http://localhost:5001/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      
      return {
        id: userData.id,
        name: userData.username || userData.name,
        email: userData.email,
        photoUrl: userData.photoUrl,
        role: userData.role
      };
    } catch (error) {
      console.error(`Error fetching user info for ID ${userId}:`, error);
      return null;
    }
  };

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
        
        // Mapear los nombres de las propiedades del backend a los nombres que usa el frontend
        setStats({
          totalUsers: data.total_users || 0,
          totalMentors: data.total_mentors || 0,
          totalMentees: data.total_mentees || 0,
          totalSessions: data.total_sessions || 0
        });
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
        
        // Ordenar las sesiones por fecha (las más próximas primero)
        const sortedSessions = userSessions.sort((a, b) => {
          const dateA = new Date(a.scheduled_time).getTime();
          const dateB = new Date(b.scheduled_time).getTime();
          return dateA - dateB;
        });
        
        setSessions(sortedSessions);
      } catch (error) {
        console.error('Error al cargar las sesiones:', error);
        showNotification(t('sessions.load_error'), 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadSessions();
  }, [t]);

  // Filtrar las sesiones cuando cambia el estado de showPastSessions o sessions
  useEffect(() => {
    if (showPastSessions) {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(session => !isSessionPast(session.scheduled_time)));
    }
  }, [showPastSessions, sessions]);

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

  // Función para mostrar el modal de confirmación de borrado
  const confirmDelete = (sessionId: number) => {
    setDeleteModal({
      show: true,
      sessionId
    });
  };

  // Función para cancelar el borrado
  const cancelDelete = () => {
    setDeleteModal({
      show: false,
      sessionId: null
    });
  };

  // Función para ejecutar el borrado
  const handleDelete = async () => {
    if (!deleteModal.sessionId) return;
    
    setLoading(true);
    try {
      await deleteSession(deleteModal.sessionId);
      
      // Actualizar la lista de sesiones manteniendo el orden
      const updatedSessions = sessions
        .filter(session => session.id !== deleteModal.sessionId)
        .sort((a, b) => {
          const dateA = new Date(a.scheduled_time).getTime();
          const dateB = new Date(b.scheduled_time).getTime();
          return dateA - dateB;
        });
      
      setSessions(updatedSessions);
      
      // Mostrar notificación de éxito
      showNotification(t('sessions.delete_success'), 'success');
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
      showNotification(t('sessions.delete_error'), 'error');
    } finally {
      setLoading(false);
      cancelDelete();
    }
  };

  // Función para verificar si una sesión ya ha pasado
  const isSessionPast = (scheduledTime: string): boolean => {
    const sessionDate = new Date(scheduledTime).getTime();
    const now = new Date().getTime();
    return sessionDate < now;
  };

  // Función para manejar el cambio en el switch de mostrar sesiones pasadas
  const handleTogglePastSessions = (value: boolean) => {
    setShowPastSessions(value);
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
                  onClick={() => navigate('/session/new')}
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
            <h2 className="text-xl font-bold text-white mb-3">
              {t('dashboard.userStats')}
            </h2>
            
            {/* Una sola fila con 4 columnas para todas las estadísticas */}
            <div className="grid grid-cols-4 gap-2">
              {/* Total de usuarios */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-blue-400">
                  {stats.totalUsers}
                </div>
                <div className="text-xs text-gray-400">
                  {t('dashboard.totalUsers')}
                </div>
              </div>
              
              {/* Total de sesiones */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-yellow-400">
                  {stats.totalSessions}
                </div>
                <div className="text-xs text-gray-400">
                  {t('dashboard.totalSessions')}
                </div>
              </div>
              
              {/* Mentores */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-green-400">
                  {stats.totalMentors}
                </div>
                <div className="text-xs text-gray-400">
                  {t('dashboard.mentors')}
                </div>
              </div>
              
              {/* Mentees */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-purple-400">
                  {stats.totalMentees}
                </div>
                <div className="text-xs text-gray-400">
                  {t('dashboard.mentees')}
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
          <div className="flex items-center gap-4">
            {/* Switch para mostrar sesiones pasadas */}
            <div className="flex items-center">
              <Label className="mr-3 text-sm font-medium text-gray-300">
                {t('sessions.show_past')}
              </Label>
              <div className="inline-flex rounded-lg border border-gray-600">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded-l-lg ${showPastSessions ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                  onClick={() => handleTogglePastSessions(true)}
                >
                  {t('common.yes')}
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded-r-lg ${!showPastSessions ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                  onClick={() => handleTogglePastSessions(false)}
                >
                  {t('common.no')}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map(session => {
              const isPast = isSessionPast(session.scheduled_time);
              
              return (
                <div 
                  key={session.id} 
                  className={`bg-gray-800 rounded-lg p-5 shadow h-full flex flex-col ${isPast ? 'opacity-70' : ''}`}
                >
                  {/* Título de la sesión */}
                  <h3 className="text-xl font-semibold mb-3">
                    {session.title}
                    {isPast && (
                      <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {t('sessions.past')}
                      </span>
                    )}
                  </h3>
                  
                  <div className="mb-4 flex-grow">
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
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {session.keywords.split(',').filter(Boolean).map(keyword => (
                        <span 
                          key={keyword.trim()} 
                          className="bg-purple-900 text-purple-100 px-2.5 py-1 text-xs rounded-full"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-400 mt-auto mb-4 py-1 border-t border-b border-gray-700">
                    <div className="flex items-center">
                      <HiCalendar className="mr-1.5 h-4 w-4 text-blue-400" />
                      <span>
                        {new Date(session.scheduled_time).toLocaleDateString()} - {new Date(session.scheduled_time).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <HiUsers className="mr-1.5 h-4 w-4 text-green-400" />
                      <span>Max: {session.max_attendees}</span>
                    </div>
                  </div>
                  
                  {/* Fila inferior con información del mentor y botones */}
                  <div className="mt-2 flex justify-between items-center">
                    {/* Información del mentor */}
                    <div className="flex items-center space-x-2">
                      <CachedImage 
                        src={user?.photoUrl || ''}
                        alt={user?.name || 'Mentor'}
                        className="w-6 h-6 rounded-full"
                        fallbackSrc="https://via.placeholder.com/40"
                      />
                      <span className="text-sm font-medium">{user?.name}</span>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <Button 
                        size="xs" 
                        color="light"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button 
                        size="xs" 
                        color="failure"
                        onClick={() => confirmDelete(session.id!)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {showPastSessions 
                ? t('sessions.no_sessions') 
                : t('sessions.no_upcoming_sessions')}
            </p>
            <Button 
              color="blue" 
              onClick={() => navigate('/session/new')}
              className="mt-4"
            >
              {t('sessions.create_first_session')}
            </Button>
          </div>
        )}
      </div>
      
      {/* Modal de confirmación de borrado */}
      <Modal
        show={deleteModal.show}
        size="md"
        popup={true}
        onClose={cancelDelete}
        theme={{
          content: {
            base: "relative h-full w-full p-4 md:h-auto",
            inner: "relative rounded-lg bg-gray-800 shadow dark:bg-gray-800"
          }
        }}
      >
        <Modal.Header theme={{ base: "flex items-start justify-between rounded-t border-b p-5 border-gray-700" }} />
        <Modal.Body>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-yellow-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-300">
              {t('common.delete_confirmation')}
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleDelete}
              >
                {t('common.yes')}
              </Button>
              <Button
                color="gray"
                onClick={cancelDelete}
              >
                {t('common.no')}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      
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