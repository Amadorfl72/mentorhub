import React, { useState, useEffect, useMemo } from 'react';
import { Button, Label, TextInput, Textarea, Select, Modal, Avatar } from 'flowbite-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createSession, getSession, updateSession, deleteSession, enrollMentee, unenrollMentee, Session, sendSessionNotifications } from '../services/sessionService';
import { HiX, HiArrowLeft, HiExclamation, HiCalendar, HiClock, HiUsers, HiCheckCircle } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { fetchData } from '../services/apiService';
import ThemeSwitch from '../components/ThemeSwitch';
import { verifyToken } from '../services/authService';
import { useAuth, User } from '../context/AuthContext';
import CachedImage from '../components/CachedImage';
import Linkify from 'react-linkify';

interface SessionFormData {
  title: string;
  description: string;
  scheduled_time: string;
  max_attendees: number;
  keywords: string;
  mentees: {
    id: number;
    name: string;
    email: string;
    role: string;
    photoUrl?: string;
  }[];
  mentor_id?: number;
}

interface MentorInfo {
  id: number;
  name: string;
  email: string;
  photoUrl?: string;
  role: string;
}

interface FormData {
  title: string;
  description: string;
  mentor_id: number;
  scheduled_time: string;
  max_attendees: number;
  keywords: string;
  is_cloned?: boolean;
}

const SessionDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isExistingSession = !!id;
  const { t } = useTranslation();
  const location = useLocation();
  
  // Estado para el modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Estado para la información del mentor
  const [mentorInfo, setMentorInfo] = useState<MentorInfo | null>(null);
  const [loadingMentor, setLoadingMentor] = useState<boolean>(false);

  const { user } = useAuth();
  
  // Estado para mostrar mensaje de error de autorización
  const [showAuthError, setShowAuthError] = useState<boolean>(false);
  
  // Verificar si el usuario actual es propietario o admin
  const isOwnerOrAdmin = useMemo(() => {
    if (!user || !mentorInfo) return false;
    return mentorInfo.id === user.id || user?.role === 'admin';
  }, [user, mentorInfo]);
  
  // Obtener parámetros de la URL
  const queryParams = new URLSearchParams(location.search);
  const urlHasEditParam = queryParams.get('edit') === 'true';
  const isClonedSession = queryParams.get('cloned') === 'true';
  
  // Solo permitir modo edición si es propietario o admin Y tiene el parámetro de edición (o es una sesión clonada)
  const isEditMode = (urlHasEditParam || isClonedSession) && isOwnerOrAdmin;
  
  // Los campos solo son editables si es una sesión nueva o si estamos en modo edición
  const isEditable = !isExistingSession || isEditMode;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionFormData>({
    title: '',
    description: '',
    scheduled_time: '',
    max_attendees: 10,
    keywords: '',
    mentees: [],
  });
  
  // Verificar si el usuario actual es el mentor de la sesión
  const isSessionMentor = useMemo(() => {
    if (!user || !sessionData.mentor_id) return false;
    return Number(sessionData.mentor_id) === Number(user.id);
  }, [user, sessionData.mentor_id]);
  
  // Verificar si intentó acceder al modo edición sin autorización
  useEffect(() => {
    if (urlHasEditParam && !isOwnerOrAdmin && mentorInfo) {
      setShowAuthError(true);
      // Redirigir a la vista sin el parámetro de edición
      setTimeout(() => {
        navigate(`/session/${id}`, { replace: true });
        // Ocultar la notificación después de redireccionar
        setShowAuthError(false);
      }, 3000);
    }
  }, [urlHasEditParam, isOwnerOrAdmin, mentorInfo, id, navigate]);
  
  // Añadir este estado para el modal de confirmación de desinscripción
  const [unenrolModal, setUnenrolModal] = useState<boolean>(false);

  // Añadir estado para notificaciones de éxito
  const [successNotification, setSuccessNotification] = useState<string>('');
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);

  // Función para obtener información del usuario por ID
  const getUserById = async (userId: number): Promise<MentorInfo | null> => {
    try {
      const userData = await fetchData(`users/${userId}`);
      return {
        id: userData.id,
        name: userData.username || userData.name,
        email: userData.email,
        photoUrl: userData.photoUrl,
        role: userData.role
      };
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      return null;
    }
  };

  // Función para mostrar notificación de éxito
  const showSuccess = (message: string) => {
    setSuccessNotification(message);
    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000); // Ocultar después de 3 segundos
  };

  // Modificar la función fetchSession para poder reutilizarla
  const fetchSession = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // console.log(`Fetching session data for id: ${id}`);
      const session = await getSession(parseInt(id));
      // console.log('Session data received:', session);
      
      if (session) {
        // Verificar y registrar datos de mentees
        // console.log('Session mentees data:', session.mentees);
        
        // Procesar cada mentee para obtener su información completa
        const processedMentees = await Promise.all((session.mentees || []).map(async (mentee) => {
          // Comprobar si mentee es un objeto o un ID numérico
          if (typeof mentee === 'object' && mentee !== null) {
            return { 
              id: mentee.id || 0,
              name: mentee.name || '',
              email: mentee.email || '',
              role: mentee.role || '',
              photoUrl: mentee.photoUrl || ''
            };
          } else {
            // Es un ID numérico, obtener los datos completos
            const menteeId = Number(mentee);
            // console.log(`Mentee is just an ID: ${menteeId}`);
            try {
              const menteeData = await getUserById(menteeId);
              if (menteeData) {
                return {
                  id: menteeData.id,
                  name: menteeData.name,
                  email: menteeData.email,
                  role: menteeData.role,
                  photoUrl: menteeData.photoUrl || ''
                };
              }
            } catch (error) {
              console.error(`Error fetching mentee data for ID ${menteeId}:`, error);
            }
            // Si falla, devolver solo el ID
            return { 
              id: menteeId,
              name: '',
              email: '',
              role: '',
              photoUrl: ''
            };
          }
        }));
        
        setSessionData({
          title: session.title,
          description: session.description,
          scheduled_time: session.scheduled_time,
          max_attendees: session.max_attendees,
          keywords: session.keywords || '',
          mentees: processedMentees,
          mentor_id: session.mentor_id
        });
        
        // Obtener información del mentor
        if (session.mentor_id) {
          setLoadingMentor(true);
          const mentor = await getUserById(session.mentor_id);
          setMentorInfo(mentor);
          setLoadingMentor(false);
        }
      }
    } catch (error) {
      console.error('Error al cargar la sesión:', error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExistingSession) {
      fetchSession();
    }
  }, [id, isExistingSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Solo permitir cambios si los campos son editables
    if (!isEditable) return;
    
    const { name, value } = e.target;
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handlers para las keywords
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();
      
      if (value) {
        const currentKeywords = sessionData.keywords ? sessionData.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
        if (!currentKeywords.includes(value)) {
          setSessionData({
            ...sessionData,
            keywords: [...currentKeywords, value].join(', ')
          });
        }
        input.value = '';
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    const keywords = sessionData.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const filtered = keywords.filter(k => k !== keyword);
    setSessionData({
      ...sessionData,
      keywords: filtered.join(', ')
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo permitir el envío si los campos son editables
    if (!isEditable) return;
    
    setLoading(true);
    try {
      // Preparar datos para envío
      const formData: FormData = {
        title: sessionData.title,
        description: sessionData.description,
        scheduled_time: sessionData.scheduled_time,
        max_attendees: sessionData.max_attendees,
        keywords: sessionData.keywords,
        mentor_id: user?.id || 0
      };
      
      // Solo añadir la bandera is_cloned si estamos en el caso específico de clonación
      if (isClonedSession) {
        (formData as any).is_cloned = true;
      }
      
      let sessionId: number;
      
      if (isExistingSession) {
        // Actualizar sesión existente
        const updatedSession = await updateSession(parseInt(id as string), formData as Partial<Session>);
        sessionId = updatedSession.id as number;
        
        // Manejar redirección según el caso:
        
        // CASO 1: Si es una sesión clonada (cloned=true)
        if (isClonedSession) {
          // Guardar el valor antes de navegar para no perderlo
          const clonedSessionId = sessionId; 
          
          // Primero navegar a la URL normal para quitar el parámetro cloned
          navigate(`/session/${sessionId}`, { replace: true });
          
          // Después de guardar, enviar notificaciones de nueva sesión
          try {
            console.log('Enviando notificaciones para sesión clonada:', clonedSessionId);
            await sendSessionNotifications(clonedSessionId);
            console.log('Notificaciones de nueva sesión enviadas para la sesión clonada:', clonedSessionId);
          } catch (error) {
            console.error('Error al enviar notificaciones de nueva sesión:', error);
          }
        } 
        // CASO 2: Si es una edición normal (edit=true)
        else if (urlHasEditParam) {
          console.log('Sesión normal actualizada. Las notificaciones las gestiona el backend.');
          // Solo quitar el parámetro de edición (las notificaciones de actualización las maneja el backend)
          navigate(`/session/${sessionId}`, { replace: true });
        }
        // CASO 3: Otros casos (aunque no debería ocurrir)
        else {
          navigate(`/session/${sessionId}`, { replace: true });
        }
      } 
      // CASO 4: Creación de nueva sesión
      else {
        // Crear nueva sesión
        const newSession = await createSession(formData as Omit<Session, 'id'>);
        sessionId = newSession.id as number;
        navigate(`/session/${sessionId}`);
      }
      
      // Mostrar notificación de éxito
      showSuccess(isExistingSession ? t('common.save_success') : t('common.create_success'));
    } catch (error) {
      console.error("Error al guardar la sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar el modal de confirmación
  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  // Función para cancelar el borrado
  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Función para ejecutar el borrado
  const handleDelete = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      await deleteSession(parseInt(id));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setLoading(false);
    }
  };

  const handleEnrol = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Obtener el ID del usuario actual
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      
      const userId = Number(user.id);
      
      // Llamar al servicio para inscribir al usuario
      await enrollMentee(parseInt(id), userId);
      
      // Mostrar notificación de éxito
      showSuccess(t('sessions.enrol_success'));
      
      // Refrescar los datos de la sesión para mostrar avatares actualizados
      await fetchSession();
      
    } catch (error) {
      console.error('Error al inscribirse en la sesión:', error);
      // Mostrar notificación de error
      setSuccessNotification(t('sessions.enrol_error'));
      setShowSuccessNotification(true);
    } finally {
      setLoading(false);
    }
  };

  // Añadir una función para verificar si el usuario está inscrito en la sesión
  const isUserEnrolled = (): boolean => {
    if (!user || !user.id || !sessionData) {
      return false;
    }
    
    const userId = Number(user.id);
    
    // Verificar si la sesión tiene mentees y si el usuario actual está entre ellos
    if (sessionData.mentees && sessionData.mentees.length > 0) {
      return sessionData.mentees.some(mentee => 
        // Asegurarse de comparar números con números para evitar problemas con tipos
        mentee && mentee.id && Number(mentee.id) === userId
      );
    }
    
    return false;
  };

  // Función para mostrar el modal de confirmación de desinscripción
  const confirmUnenrol = () => {
    setUnenrolModal(true);
  };

  // Función para cancelar la desinscripción
  const cancelUnenrol = () => {
    setUnenrolModal(false);
  };

  const handleUnenrol = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Obtener el ID del usuario actual
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      
      const userId = Number(user.id);
      
      // Llamar al servicio para desuscribir al usuario
      await unenrollMentee(parseInt(id), userId);
      
      // Mostrar notificación de éxito
      showSuccess(t('sessions.unenrol_success'));
      
      // Refrescar los datos de la sesión para mostrar avatares actualizados
      await fetchSession();
      
      // Cerrar el modal de confirmación
      cancelUnenrol();
      
    } catch (error) {
      console.error('Error al desuscribirse de la sesión:', error);
      // Mostrar notificación de error
      setSuccessNotification(t('sessions.unenrol_error'));
      setShowSuccessNotification(true);
    } finally {
      setLoading(false);
    }
  };

  // Añadir función para verificar si una sesión ya ha pasado
  const isSessionPast = (): boolean => {
    if (!sessionData || !sessionData.scheduled_time) {
      return false;
    }
    const sessionDate = new Date(sessionData.scheduled_time).getTime();
    const now = new Date().getTime();
    return sessionDate < now;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mostrar mensaje de error de autorización si es necesario */}
      {showAuthError && (
        <div className="fixed top-4 right-4 z-50 bg-red-800 text-white px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <HiExclamation className="h-6 w-6 mr-2" />
            <p>{t('common.not_authorized')}</p>
          </div>
          <p className="text-sm mt-1">{t('common.redirecting')}</p>
        </div>
      )}
      
      {/* Notificación de éxito */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-800 text-white px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <HiCheckCircle className="h-6 w-6 mr-2" />
            <p>{successNotification}</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {!isExistingSession ? t('sessions.create_session') : 
             isClonedSession ? t('sessions.duplicate') : 
             isEditMode ? t('sessions.edit_session') : 
             t('sessions.session_details')}
          </h1>
          
          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            
            {/* Información del mentor (solo en modo edición) */}
            {isExistingSession && mentorInfo && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('sessions.mentor')}</p>
                  <p className="font-medium">{mentorInfo.name}</p>
                </div>
                <CachedImage 
                  src={mentorInfo.photoUrl || ""}
                  alt={mentorInfo.name}
                  className="h-10 w-10 rounded-full"
                  fallbackSrc="/images/default-avatar.svg"
                  userId={sessionData.mentor_id}
                />
              </div>
            )}
            
            {isExistingSession && loadingMentor && (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse h-10 w-24 bg-gray-700 rounded"></div>
                <div className="animate-pulse h-10 w-10 bg-gray-700 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 shadow-lg max-w-3xl mx-auto">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" value={t('sessions.title_label')} className="text-white mb-2" />
                <TextInput
                  id="title"
                  name="title"
                  value={sessionData.title}
                  onChange={handleChange}
                  required
                  className="bg-gray-700 text-white border-gray-600"
                  disabled={!isEditable}
                />
              </div>
              
              <div>
                <Label htmlFor="description" value={t('sessions.description_label')} className="text-white mb-2" />
                {isEditable ? (
                  <Textarea
                    id="description"
                    name="description"
                    value={sessionData.description}
                    onChange={handleChange}
                    rows={4}
                    className="bg-gray-700 text-white border-gray-600"
                    disabled={!isEditable}
                  />
                ) : (
                  <div className="bg-gray-700 text-white border border-gray-600 rounded-lg p-3 whitespace-pre-line">
                    <Linkify componentDecorator={(decoratedHref: string, decoratedText: string, key: number) => (
                      <a 
                        href={decoratedHref} 
                        key={key} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {decoratedText}
                      </a>
                    )}>
                      {sessionData.description}
                    </Linkify>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="scheduled_time" value={t('sessions.date_time')} className="text-white mb-2" />
                <TextInput
                  id="scheduled_time"
                  name="scheduled_time"
                  type="datetime-local"
                  value={sessionData.scheduled_time}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border-gray-600"
                  disabled={!isEditable}
                />
              </div>
              
              <div>
                <Label htmlFor="max_attendees" value={t('sessions.max_attendees')} className="text-white mb-2" />
                <TextInput
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  value={sessionData.max_attendees}
                  onChange={handleChange}
                  className="bg-gray-700 text-white border-gray-600"
                  disabled={!isEditable}
                />
              </div>
              
              {isEditable && (
                <div>
                  <Label htmlFor="keywords" value={t('sessions.keywords')} className="text-white mb-2" />
                  <TextInput
                    id="keywords"
                    name="keywords_input"
                    placeholder={t('sessions.keywords_placeholder')}
                    onKeyDown={handleKeywordKeyPress}
                    className="bg-gray-700 text-white border-gray-600"
                    disabled={!isEditable}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sessionData.keywords.split(',').filter(Boolean).map((keyword) => (
                      <span 
                        key={keyword.trim()} 
                        className="bg-purple-900 text-purple-100 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {keyword.trim()}
                        {isEditable && (
                          <HiX 
                            className="cursor-pointer hover:text-purple-300" 
                            onClick={() => removeKeyword(keyword.trim())}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {!isEditable && sessionData.keywords && (
                <div>
                  <Label htmlFor="keywords" value={t('sessions.keywords')} className="text-white mb-2" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sessionData.keywords.split(',').filter(Boolean).map((keyword) => (
                      <span 
                        key={keyword.trim()} 
                        className="bg-purple-900 text-purple-100 px-2 py-1 rounded-full text-sm"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Detalles de fecha y hora */}
              <div className="flex flex-col md:flex-row justify-between gap-4 my-5">
                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <HiCalendar className="h-6 w-6 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-300 font-semibold">
                      {t('sessions.scheduled_date')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {sessionData.scheduled_time ? new Date(sessionData.scheduled_time).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <HiClock className="h-6 w-6 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-300 font-semibold">
                      {t('sessions.scheduled_time')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {sessionData.scheduled_time ? new Date(sessionData.scheduled_time).toLocaleTimeString() : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <HiUsers className="h-6 w-6 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-300 font-semibold">
                      {t('sessions.attendees')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {sessionData.mentees ? sessionData.mentees.length : 0}/{sessionData.max_attendees}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sección de información de la sesión */}
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                {/* Información de mentees */}
                <div className="mb-4 border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('sessions.attendees')}</h3>
                  
                  <div className="flex items-center justify-between">
                    {/* Avatares de mentees */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-4">
                        {sessionData.mentees && sessionData.mentees.length > 0 ? (
                          <>
                            {sessionData.mentees.slice(0, 8).map((mentee, index) => {
                              // Asegurar que el ID del mentee sea válido y no sea 0
                              const menteeId = typeof mentee.id === 'string' ? parseInt(mentee.id, 10) : Number(mentee.id);
                              // console.log(`Rendering mentee in detail view: id=${menteeId}, photoUrl=${mentee.photoUrl}, name=${mentee.name}`);
                              
                              // Ya no usaremos la URL directa porque podría estar vacía
                              // En su lugar, siempre usaremos CachedImage con el ID para obtener los datos completos
                              return (
                                <div key={`${menteeId || index}-${index}`} className="relative z-10" style={{ zIndex: 8 - index }}>
                                  <CachedImage 
                                    src={''}  // No usamos la URL directa
                                    alt={mentee.name || `User ${menteeId}`}
                                    className="w-8 h-8 rounded-full border border-gray-800"
                                    fallbackSrc="/images/default-avatar.svg"
                                    userId={menteeId}  // Este es el ID real del usuario
                                  />
                                </div>
                              );
                            })}
                            {sessionData.mentees.length > 8 && (
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white border border-gray-800 relative z-0">
                                +{sessionData.mentees.length - 8}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">{t('sessions.no_attendees')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción - Reorganizados */}
              <div className="flex justify-between items-center mt-8">
                {/* Botón de volver al dashboard a la izquierda */}
                <Button
                  color="blue"
                  onClick={() => navigate('/dashboard')}
                >
                  <HiArrowLeft className="mr-2 h-5 w-5" />
                  {t('common.back_to_dashboard')}
                </Button>
                
                {/* Botones de acción a la derecha */}
                <div className="flex gap-2">
                  {/* Si no estamos en modo edición y el usuario es el mentor o admin, mostrar botones de editar y eliminar */}
                  {isExistingSession && !isEditMode && (mentorInfo?.id === user?.id || user?.role === 'admin') && (
                    <>
                      <Button
                        color="failure"
                        onClick={confirmDelete}
                      >
                        {t('common.delete')}
                      </Button>
                      <Button
                        color="info"
                        onClick={() => navigate(`/session/${id}?edit=true`)}
                      >
                        {t('common.edit')}
                      </Button>
                    </>
                  )}
                  
                  {/* Si es el creador de la sesión o es admin y estamos en modo edición, mostrar botón de guardar */}
                  {isExistingSession && isEditMode && (mentorInfo?.id === user?.id || user?.role === 'admin') ? (
                    <Button
                      color="success"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? t('common.saving') : t('common.save')}
                    </Button>
                  ) : isExistingSession && !isEditMode ? (
                    /* Si está en modo visualización, mostrar botón según inscripción */
                    !isSessionPast() && !isSessionMentor ? (
                      isUserEnrolled() ? (
                        <Button
                          color="warning"
                          onClick={confirmUnenrol}
                          disabled={loading}
                        >
                          {loading ? t('common.processing') : t('common.unenrol')}
                        </Button>
                      ) : (
                        <Button
                          color="success"
                          onClick={handleEnrol}
                          disabled={loading}
                        >
                          {loading ? t('common.processing') : t('common.enrol')}
                        </Button>
                      )
                    ) : (
                      /* Si la sesión ya pasó o el usuario es el mentor, no mostrar botón de inscripción */
                      isSessionPast() && (
                        <span className="px-3 py-2 bg-gray-700 text-gray-400 text-sm rounded">
                          {t('sessions.past')}
                        </span>
                      )
                    )
                  ) : (
                    /* Si es modo creación, mostrar botón de crear */
                    <Button
                      color="success"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? t('common.creating') : t('common.create')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
      
      {/* Modal de confirmación de borrado */}
      <Modal
        show={showDeleteModal}
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

      {/* Modal de confirmación de desinscripción */}
      <Modal
        show={unenrolModal}
        size="md"
        popup={true}
        onClose={cancelUnenrol}
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
              {t('sessions.unenrol_confirmation', { title: sessionData.title })}
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleUnenrol}
              >
                {t('common.yes')}
              </Button>
              <Button
                color="gray"
                onClick={cancelUnenrol}
              >
                {t('common.no')}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SessionDetailsPage; 