import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput, Alert, Avatar, Label } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { HiX, HiArrowLeft, HiCheck } from 'react-icons/hi';
import ThemeSwitch from '../components/ThemeSwitch';
import NotificationSwitch from '../components/NotificationSwitch';
import MentorSwitch from '../components/MentorSwitch';
import { apiPut } from '../services/api';

const RegisterPage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isNewUser, message } = location.state || {};
  
  // Flag para evitar actualizaciones duplicadas
  const isUpdatingRef = useRef(false);

  // Mantener una referencia a los valores originales del usuario
  const originalUserRef = useRef({
    role: user?.role,
    email_notifications: user?.email_notifications
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    photoUrl: user?.photoUrl || '',
    skills: user?.skills || '',
    interests: user?.interests || ''
  });

  const [isMentor, setIsMentor] = useState(user?.role === 'mentor');
  const [emailNotifications, setEmailNotifications] = useState(Boolean(user?.email_notifications));

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Este efecto se ejecuta cuando el componente se monta o cuando user cambia
  useEffect(() => {
    if (user && !isUpdatingRef.current) {
      console.log('Efecto: Actualizando formulario con usuario:', {
        id: user.id,
        email_notifications: user.email_notifications
      });
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        photoUrl: user.photoUrl || '',
        skills: user.skills || '',
        interests: user.interests || ''
      });
      
      // Actualizar los valores de los interruptores basados en los datos de usuario
      const mentorValue = user.role === 'mentor';
      const notificationsValue = Boolean(user.email_notifications);
      
      console.log('Valores iniciales del usuario:', {
        role: user.role,
        isMentor: mentorValue,
        email_notifications: user.email_notifications,
        notificationsValue
      });
      
      setIsMentor(mentorValue);
      setEmailNotifications(notificationsValue);
      
      // Guardar los valores originales para referencia
      originalUserRef.current = {
        role: user.role,
        email_notifications: user.email_notifications
      };
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('Enviando formulario con valores:', {
      isMentor,
      emailNotifications
    });
    
    setIsSubmitting(true);
    isUpdatingRef.current = true; // Marcar que estamos actualizando para evitar loops
    
    try {
      // Preparar datos para enviar
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        photoUrl: formData.photoUrl,
        skills: formData.skills,
        interests: formData.interests,
        role: isMentor ? 'mentor' : 'mentee',
        email_notifications: emailNotifications
      };
      
      console.log('Datos a enviar:', dataToSend);
      
      // Usar apiPut para enviar los datos al servidor
      const data = await apiPut('/api/users/profile', dataToSend);
      
      console.log('Respuesta del servidor:', data);
      
      // Actualizar los valores originales con los nuevos valores
      originalUserRef.current = {
        role: isMentor ? 'mentor' : 'mentee',
        email_notifications: emailNotifications
      };
      
      // Actualizar el usuario en el contexto
      await updateUser({
        ...data,
        email_notifications: emailNotifications // Asegurar que se mantiene el valor correcto
      });
      
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
    } finally {
      setIsSubmitting(false);
      // Esperar un poco antes de permitir nuevas actualizaciones
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    }
  };

  // Handlers para las keywords
  const handleKeyPress = (e: React.KeyboardEvent, field: 'skills' | 'interests') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();
      
      if (value) {
        const currentValues = formData[field] ? formData[field].split(',').map(v => v.trim()) : [];
        if (!currentValues.includes(value)) {
          setFormData({
            ...formData,
            [field]: [...currentValues, value].join(', ')
          });
        }
        input.value = '';
      }
    }
  };

  const removeKeyword = (field: 'skills' | 'interests', keyword: string) => {
    const values = formData[field].split(',').map(v => v.trim());
    const filtered = values.filter(v => v !== keyword);
    setFormData({
      ...formData,
      [field]: filtered.join(', ')
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                {isNewUser ? t('register.title') : t('register.edit_title')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* Mensaje de éxito */}
        {showSuccess && (
          <Alert 
            color="success" 
            icon={HiCheck}
            className="mb-4"
          >
            {t('profile.changes_saved')}
          </Alert>
        )}

        {isNewUser && message && (
          <Alert color="info" className="mb-6 bg-blue-900 text-blue-100">
            {message}
          </Alert>
        )}

        <div className="bg-gray-800 shadow-xl rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col items-center mb-8">
            <img
              src={user?.photoUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full mb-4"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm text-gray-400">
              {t('register.photo')}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            {isNewUser ? t('register.title') : t('register.edit_title')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('register.name')}
              </label>
              <TextInput
                value={formData.name}
                disabled={true}
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('register.email')}
              </label>
              <TextInput
                value={formData.email}
                type="email"
                disabled={true}
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('register.skills')}
              </label>
              <TextInput
                placeholder={t('register.skills_placeholder')}
                onKeyDown={(e) => handleKeyPress(e, 'skills')}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.skills.split(',').filter(Boolean).map((skill) => (
                  <span 
                    key={skill.trim()} 
                    className="bg-blue-900 text-blue-100 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill.trim()}
                    <HiX 
                      className="cursor-pointer hover:text-blue-300" 
                      onClick={() => removeKeyword('skills', skill.trim())}
                    />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('register.interests')}
              </label>
              <TextInput
                placeholder={t('register.interests_placeholder')}
                onKeyDown={(e) => handleKeyPress(e, 'interests')}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.interests.split(',').filter(Boolean).map((interest) => (
                  <span 
                    key={interest.trim()} 
                    className="bg-green-900 text-green-100 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {interest.trim()}
                    <HiX 
                      className="cursor-pointer hover:text-green-300" 
                      onClick={() => removeKeyword('interests', interest.trim())}
                    />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-300">
                  {t('register.want_to_be_mentor')}
                </span>
                <span className="text-xs text-green-400 mt-1">
                  {isMentor ? t('register.mentor_role') : t('register.mentee_role')}
                </span>
              </div>
              <MentorSwitch
                isMentor={isMentor}
                onChange={(newValue) => {
                  console.log('Cambiando rol a:', newValue ? 'mentor' : 'mentee');
                  setIsMentor(newValue);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-300">
                  {t('register.email_notifications')}
                </span>
                <span className="text-xs text-blue-400 mt-1">
                  {emailNotifications 
                    ? t('notifications.enabled') 
                    : t('notifications.disabled')}
                </span>
              </div>
              <NotificationSwitch 
                isEnabled={emailNotifications}
                onChange={(newValue) => {
                  console.log('Cambiando notificaciones a:', newValue);
                  setEmailNotifications(newValue);
                }}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center">
              <Button
                color="blue"
                onClick={() => navigate('/dashboard')}
              >
                <HiArrowLeft className="mr-2 h-5 w-5" />
                {t('common.back_to_dashboard')}
              </Button>
              <Button 
                type="submit" 
                color="blue"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.saving') : t('register.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 