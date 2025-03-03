import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button, Card, Toast, Modal, Label, TextInput, Pagination } from 'flowbite-react';
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
import ThemeSwitch from '../components/ThemeSwitch';
import { getMentorSessions, deleteSession, Session, getAllSessions, enrollMentee } from '../services/sessionService';
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

  // Añadir estos estados para manejar la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Limitado a 6 registros por página

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
        // Usar getAllSessions en lugar de getMentorSessions para obtener todas las sesiones
        const allSessions = await getAllSessions();
        
        // Ordenar las sesiones por fecha (las más próximas primero)
        const sortedSessions = allSessions.sort((a, b) => {
          const dateA = new Date(a.scheduled_time).getTime();
          const dateB = new Date(b.scheduled_time).getTime();
          return dateA - dateB;
        });
        
        setSessions(sortedSessions);
        
        // Obtener IDs de mentores únicos
        const mentorIds = sortedSessions
          .map(session => session.mentor_id)
          .filter((id): id is number => id !== undefined);
        
        // Cargar información de mentores usando getMentorsInfo
        if (mentorIds.length > 0) {
          try {
            const mentorsData = await getMentorsInfo(mentorIds);
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
    let filtered = [...sessions];
    
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
    
    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [showPastSessions, searchTerm, sessions, mentors]);

  // Función para obtener las sesiones de la página actual
  const getCurrentPageSessions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  };

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Opcional: hacer scroll al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Función para manejar el cambio en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Añadir la función handleEnrol
  const handleEnrol = async (sessionId: number) => {
    try {
      setLoading(true);
      // Obtener el ID del usuario actual
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser.id) {
        throw new Error('Usuario no autenticado');
      }
      
      // Llamar al servicio para inscribir al usuario
      await enrollMentee(sessionId, currentUser.id);
      
      // Mostrar notificación de éxito
      showNotification(t('sessions.enrol_success'), 'success');
    } catch (error) {
      console.error('Error al inscribirse en la sesión:', error);
      showNotification(t('sessions.enrol_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Componente de paginación personalizado para tema oscuro
  const CustomPagination = ({ currentPage, totalPages }: { currentPage: number, totalPages: number }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center my-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showIcons={true}
          layout="pagination"
          theme={{
            base: "",
            layout: {
              table: {
                base: "text-sm text-gray-300"
              }
            },
            pages: {
              base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
              showIcon: "inline-flex",
              previous: {
                base: "ml-0 rounded-l-lg border border-gray-700 bg-gray-800 py-2 px-3 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                icon: "h-5 w-5"
              },
              next: {
                base: "rounded-r-lg border border-gray-700 bg-gray-800 py-2 px-3 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                icon: "h-5 w-5"
              },
              selector: {
                base: "w-12 border border-gray-700 bg-gray-800 py-2 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                active: "bg-gray-700 text-white hover:bg-gray-600 hover:text-white",
                disabled: "opacity-50 cursor-not-allowed"
              }
            }
          }}
        />
      </div>
    );
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
              <ThemeSwitch />
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra de búsqueda, filtros y paginación superior */}
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
              color="blue"
              onClick={() => navigate('/dashboard')}
            >
              <HiArrowLeft className="mr-2 h-5 w-5" />
              {t('common.back_to_dashboard')}
            </Button>
          </div>
        </div>
        
        {/* Paginación superior */}
        {!loading && filteredSessions.length > 0 && (
          <div className="mb-4">
            <CustomPagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredSessions.length / itemsPerPage)} 
            />
          </div>
        )}
        
        {/* Contador de resultados */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-400">
            {filteredSessions.length > 0 
              ? t('sessions.showing_results', { 
                  from: (currentPage - 1) * itemsPerPage + 1, 
                  to: Math.min(currentPage * itemsPerPage, filteredSessions.length), 
                  total: filteredSessions.length 
                })
              : t('sessions.no_results')
            }
          </div>
        )}
        
        {/* Lista de sesiones */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentPageSessions().map(session => {
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
                        
                        {/* Si el usuario es el mentor de la sesión o es admin, mostrar botones de editar/eliminar */}
                        {(session.mentor_id === user?.id || user?.role === 'admin') ? (
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
                        ) : (
                          /* Si no es el mentor ni admin, mostrar botón de inscribirse */
                          <Button 
                            size="xs" 
                            color="success"
                            onClick={() => handleEnrol(session.id!)}
                          >
                            {t('common.enrol')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Paginación inferior */}
            <div className="mt-6">
              <CustomPagination 
                currentPage={currentPage} 
                totalPages={Math.ceil(filteredSessions.length / itemsPerPage)} 
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">{t('sessions.no_sessions_found')}</p>
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