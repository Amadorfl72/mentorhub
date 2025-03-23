import React, { useState, useEffect } from 'react';
import { Button, Label, TextInput, Textarea, Select, Modal, Avatar } from 'flowbite-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSession, getSession, updateSession, deleteSession, enrollMentee, unenrollMentee, Session } from '../services/sessionService';
import { HiX, HiArrowLeft, HiExclamation } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { fetchData } from '../services/apiService';
import ThemeSwitch from '../components/ThemeSwitch';
import { verifyToken } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import CachedImage from '../components/CachedImage';

interface SessionFormData {
  title: string;
  description: string;
  scheduled_time: string;
  max_attendees: number;
  keywords: string;
  mentees: { id: number }[];
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
  mentees?: { id: number }[];
}

const SessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionFormData>({
    title: '',
    description: '',
    scheduled_time: '',
    max_attendees: 10,
    keywords: '',
    mentees: [],
  });
  
  // Estado para el modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Estado para la información del mentor
  const [mentorInfo, setMentorInfo] = useState<MentorInfo | null>(null);
  const [loadingMentor, setLoadingMentor] = useState<boolean>(false);

  const { user } = useAuth();

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

  useEffect(() => {
    if (isEditMode && id) {
      const fetchSession = async () => {
        setLoading(true);
        try {
          const session = await getSession(parseInt(id));
          if (session) {
            setSessionData({
              title: session.title,
              description: session.description,
              scheduled_time: session.scheduled_time,
              max_attendees: session.max_attendees,
              keywords: session.keywords || '',
              mentees: session.mentees?.map(mentee => ({ id: mentee.id || 0 })) || [],
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
      
      fetchSession();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    
    if (!user) {
      alert('Debes iniciar sesión para crear o editar una sesión');
      return;
    }
    
    try {
      setLoading(true);
      
      // Formatear los datos del formulario
      interface FormData {
        title: string;
        description: string;
        mentor_id: number;
        scheduled_time: string;
        max_attendees: number;
        keywords: string;
      }
      
      const formattedData: FormData = {
        title: sessionData.title,
        description: sessionData.description,
        mentor_id: user?.id || 0, // Usar 0 o algún valor por defecto si id es undefined
        scheduled_time: sessionData.scheduled_time,
        max_attendees: parseInt(sessionData.max_attendees.toString()),
        keywords: sessionData.keywords,
      };
      
      if (isEditMode && id) {
        // Usar el tipo correcto para updateSession
        await updateSession(parseInt(id), formattedData as Partial<Session>);
      } else {
        await createSession(formattedData as any);
      }
      
      // Redirigir al dashboard después de crear/editar
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al guardar la sesión:', error);
      alert('Error al guardar la sesión');
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
      
      // Llamar al servicio para inscribir al usuario
      await enrollMentee(parseInt(id), user.id);
      
      // Actualizar el estado local para reflejar la inscripción
      setSessionData(prevData => ({
        ...prevData,
        mentees: [...(prevData.mentees || []), { id: user.id as number }]
      }));
      
      // Mostrar mensaje de éxito
      alert(t('sessions.enrol_success'));
    } catch (error) {
      console.error('Error al inscribirse en la sesión:', error);
      alert(t('sessions.enrol_error'));
    } finally {
      setLoading(false);
    }
  };

  // Añadir una función para verificar si el usuario está inscrito en la sesión
  const isUserEnrolled = (): boolean => {
    if (!user || !sessionData?.mentees) return false;
    
    return sessionData.mentees.some(mentee => mentee.id === user.id);
  };

  // Añadir la función handleUnenrol
  const handleUnenrol = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Obtener el ID del usuario actual
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      
      // Llamar al servicio para desuscribir al usuario
      await unenrollMentee(parseInt(id), user.id);
      
      // Actualizar el estado local para reflejar la cancelación de inscripción
      setSessionData(prevData => ({
        ...prevData,
        mentees: prevData.mentees?.filter(mentee => mentee.id !== user.id as number) || []
      }));
      
      // Mostrar mensaje de éxito
      alert(t('sessions.unenrol_success'));
    } catch (error) {
      console.error('Error al desuscribirse de la sesión:', error);
      alert(t('sessions.unenrol_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isEditMode ? t('sessions.edit_session') : t('sessions.create_session')}
          </h1>
          
          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            
            {/* Información del mentor (solo en modo edición) */}
            {isEditMode && mentorInfo && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('sessions.mentor')}</p>
                  <p className="font-medium">{mentorInfo.name}</p>
                </div>
                <CachedImage 
                  src={mentorInfo.photoUrl || "https://via.placeholder.com/40"}
                  alt={mentorInfo.name}
                  className="h-10 w-10 rounded-full"
                  userId={sessionData.mentor_id}
                />
              </div>
            )}
            
            {isEditMode && loadingMentor && (
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
                />
              </div>
              
              <div>
                <Label htmlFor="description" value={t('sessions.description_label')} className="text-white mb-2" />
                <Textarea
                  id="description"
                  name="description"
                  value={sessionData.description}
                  onChange={handleChange}
                  rows={4}
                  className="bg-gray-700 text-white border-gray-600"
                />
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
                />
              </div>
              
              <div>
                <Label htmlFor="keywords" value={t('sessions.keywords')} className="text-white mb-2" />
                <TextInput
                  id="keywords"
                  name="keywords_input"
                  placeholder={t('sessions.keywords_placeholder')}
                  onKeyDown={handleKeywordKeyPress}
                  className="bg-gray-700 text-white border-gray-600"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {sessionData.keywords.split(',').filter(Boolean).map((keyword) => (
                    <span 
                      key={keyword.trim()} 
                      className="bg-purple-900 text-purple-100 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {keyword.trim()}
                      <HiX 
                        className="cursor-pointer hover:text-purple-300" 
                        onClick={() => removeKeyword(keyword.trim())}
                      />
                    </span>
                  ))}
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
                  {/* Si es el creador de la sesión o es admin, mostrar botones de editar/eliminar */}
                  {isEditMode && (mentorInfo?.id === user?.id || user?.role === 'admin') ? (
                    <>
                      {/* Botón de eliminar */}
                      <Button
                        color="failure"
                        onClick={confirmDelete}
                      >
                        {t('common.delete')}
                      </Button>
                      
                      {/* Botón de guardar */}
                      <Button
                        color="success"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? t('common.saving') : t('common.save')}
                      </Button>
                    </>
                  ) : isEditMode ? (
                    /* Si no es el creador pero está en modo edición, mostrar botón según inscripción */
                    isUserEnrolled() ? (
                      <Button
                        color="warning"
                        onClick={handleUnenrol}
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
    </div>
  );
};

export default SessionPage; 