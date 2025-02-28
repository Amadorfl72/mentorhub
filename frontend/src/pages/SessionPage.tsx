import React, { useState, useEffect } from 'react';
import { Button, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSession, getSession, updateSession, Session } from '../services/sessionService';
import { HiX } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

interface SessionFormData {
  title: string;
  description: string;
  scheduled_time: string;
  max_attendees: number;
  keywords: string;
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
  });

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
            });
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

  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return false;
    }
    
    try {
      // Hacer una solicitud al endpoint de depuración
      const response = await fetch('http://localhost:5001/auth/debug-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Token verification failed');
        return false;
      }
      
      const data = await response.json();
      console.log('Token verification result:', data);
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Verificar el token primero
      const isTokenValid = await verifyToken();
      if (!isTokenValid) {
        throw new Error('Token inválido o expirado');
      }
      
      // Obtener el ID del usuario actual del localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id) {
        throw new Error('No se pudo obtener el ID del usuario');
      }
      
      // Formatear los datos según lo que espera el backend
      const formattedData = {
        title: sessionData.title,
        description: sessionData.description,
        mentor_id: parseInt(user.id),
        scheduled_time: sessionData.scheduled_time,
        max_attendees: parseInt(sessionData.max_attendees.toString()),
        keywords: sessionData.keywords
      };
      
      // Imprimir los datos para depuración
      console.log('Datos a enviar:', formattedData);
      
      if (isEditMode && id) {
        await updateSession(parseInt(id), formattedData);
      } else {
        await createSession(formattedData as any);
      }
      
      // Redirigir al dashboard después de guardar
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error al guardar la sesión:', error);
      // Aquí podrías mostrar un mensaje de error
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
          <Button color="gray" onClick={() => navigate('/dashboard')}>
            {t('common.back_to_dashboard')}
          </Button>
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
              
              <div className="flex justify-end gap-4 mt-8">
                <Button color="gray" onClick={() => navigate('/dashboard')}>
                  {t('common.cancel')}
                </Button>
                <Button color="blue" type="submit" disabled={loading}>
                  {loading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default SessionPage; 