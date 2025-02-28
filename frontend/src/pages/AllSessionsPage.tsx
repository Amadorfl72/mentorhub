import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button, Card, Toast, Modal, Label, TextInput } from 'flowbite-react';
import { 
  HiSearch, 
  HiCalendar, 
  HiUsers, 
  HiCheck, 
  HiX, 
  HiExclamation,
  HiOutlineFilter,
  HiArrowLeft
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import LanguageSelector from '../components/LanguageSelector';
import { getMentorSessions, deleteSession, Session } from '../services/sessionService';
import CachedImage from '../components/CachedImage';
import { getMentorsInfo, MentorInfo } from '../services/userService';

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Función para truncar la descripción
const truncateDescription = (description: string, maxLength: number = 100) => {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength).trim();
};

const AllSessionsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPastSessions, setShowPastSessions] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<NotificationState>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  // Estado para almacenar información de mentores
  const [mentors, setMentors] = useState<Record<number, MentorInfo>>({});
  
  // Estado para el modal de confirmación de borrado
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    sessionId: number | null;
  }>({
    show: false,
    sessionId: null
  });

  // Función para obtener información básica del usuario (versión simplificada)
  const getUserInfo = async (userId: number) => {
    // En lugar de hacer una llamada a la API, devolvemos un objeto con datos genéricos
    return {
      id: userId,
      name: `Mentor ${userId}`,
      email: `mentor${userId}@example.com`,
      photoUrl: '',
      role: 'mentor'
    };
  };

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
        
        // Obtener IDs de mentores únicos
        const mentorIds = sortedSessions
          .map(session => session.mentor_id)
          .filter((id): id is number => id !== undefined);
        
        // Cargar información de mentores
        if (mentorIds.length > 0) {
          try {
            // Usar un objeto para almacenar la información de los mentores
            const mentorsData: Record<number, MentorInfo> = {};
            
            // Obtener información del usuario actual
            const currentUserStr = localStorage.getItem('user');
            if (currentUserStr) {
              const currentUser = JSON.parse(currentUserStr);
              
              // Para cada ID de mentor
              for (const mentorId of mentorIds) {
                // Si el usuario actual es el mentor
                if (currentUser.id === mentorId) {
                  mentorsData[mentorId] = {
                    id: mentorId,
                    name: currentUser.name || currentUser.username || `Mentor ${mentorId}`,
                    email: currentUser.email,
                    photoUrl: currentUser.photoUrl,
                    photoBlob: currentUser.photoBlob,
                    role: currentUser.role
                  };
                } else {
                  // Si no es el usuario actual, usar información genérica
                  mentorsData[mentorId] = {
                    id: mentorId,
                    name: `Mentor ${mentorId}`,
                    photoUrl: `https://ui-avatars.com/api/?name=Mentor+${mentorId}&background=random`
                  };
                }
              }
            } else {
              // Si no hay usuario actual, usar información genérica para todos los mentores
              for (const mentorId of mentorIds) {
                mentorsData[mentorId] = {
                  id: mentorId,
                  name: `Mentor ${mentorId}`,
                  photoUrl: `https://ui-avatars.com/api/?name=Mentor+${mentorId}&background=random`
                };
              }
            }
            
            setMentors(mentorsData);
          } catch (error) {
            console.error('Error loading mentors info:', error);
            
            // En caso de error, crear información genérica para todos los mentores
            const fallbackMentorsData: Record<number, MentorInfo> = {};
            for (const mentorId of mentorIds) {
              fallbackMentorsData[mentorId] = {
                id: mentorId,
                name: `Mentor ${mentorId}`,
                photoUrl: `https://ui-avatars.com/api/?name=Mentor+${mentorId}&background=random`
              };
            }
            setMentors(fallbackMentorsData);
          }
        }
      } catch (error) {
        console.error('Error al cargar las sesiones:', error);
        showNotification(t('sessions.load_error'), 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadSessions();
  }, [t]);

  // Filtrar las sesiones cuando cambia el estado de showPastSessions, searchTerm o sessions
  useEffect(() => {
    let filtered = [...sessions]; // Crear una copia para no modificar el original
    
    // Filtrar por sesiones pasadas si es necesario
    if (!showPastSessions) {
      filtered = filtered.filter(session => !isSessionPast(session.scheduled_time));
    }
    
    // Filtrar por término de búsqueda si hay uno
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(session => {
        // Obtener información del mentor si existe
        const mentorInfo = session.mentor_id ? mentors[session.mentor_id] : null;
        const mentorName = mentorInfo ? mentorInfo.name.toLowerCase() : '';
        
        return (
          session.title.toLowerCase().includes(term) ||
          session.description.toLowerCase().includes(term) ||
          (session.keywords && session.keywords.toLowerCase().includes(term)) ||
          mentorName.includes(term)
        );
      });
    }
    
    // Asegurar que las sesiones filtradas mantengan el orden cronológico
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_time).getTime();
      const dateB = new Date(b.scheduled_time).getTime();
      return dateA - dateB;
    });
    
    setFilteredSessions(filtered);
  }, [showPastSessions, searchTerm, sessions, mentors]);

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

  // Función para manejar el cambio en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                {t('sessions.allSessions')}
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
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          {/* Buscador */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <TextInput
                type="search"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          
          {/* Filtros */}
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
            
            {/* Botón para volver al dashboard */}
            <Button 
              color="dark"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700"
            >
              <HiArrowLeft className="w-4 h-4" />
              {t('common.back_to_dashboard')}
            </Button>
          </div>
        </div>
        
        {/* Lista de sesiones */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map(session => {
              const isPast = isSessionPast(session.scheduled_time);
              const mentorInfo = session.mentor_id ? mentors[session.mentor_id] : null;
              
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
                    <div className="flex items-center mt-3 mb-4">
                      <div className="flex-shrink-0">
                        {mentorInfo && (
                          mentorInfo.photoBlob ? (
                            <img 
                              src={mentorInfo.photoBlob} 
                              alt={mentorInfo.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                // Si falla la carga de la imagen, usar una imagen de fallback
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Evitar bucle infinito
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorInfo.name)}&background=random`;
                              }}
                            />
                          ) : mentorInfo.photoUrl ? (
                            <img 
                              src={mentorInfo.photoUrl} 
                              alt={mentorInfo.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                // Si falla la carga de la imagen, usar una imagen de fallback
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Evitar bucle infinito
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorInfo.name)}&background=random`;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {mentorInfo.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-300">
                          {mentorInfo ? mentorInfo.name : t('sessions.unknown_mentor')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <Button 
                        size="xs" 
                        color="light"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        {t('common.view')}
                      </Button>
                      {/* Mostrar botones de edición/eliminación solo para administradores */}
                      {user?.role === 'admin' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {searchTerm 
                ? t('sessions.no_search_results') 
                : (showPastSessions 
                  ? t('sessions.no_sessions') 
                  : t('sessions.no_upcoming_sessions'))}
            </p>
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

export default AllSessionsPage;