import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput, Alert, Avatar, Label, ToggleSwitch } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { HiX, HiArrowLeft, HiCheck } from 'react-icons/hi';

const RegisterPage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isNewUser, message } = location.state || {};

  // Log temporal para debug
  console.log('User data:', {
    name: user?.name,
    email: user?.email,
    role: user?.role,
    skills: user?.skills,
    interests: user?.interests
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    photoUrl: user?.photoUrl || '',
    skills: user?.skills || '',
    interests: user?.interests || ''
  });

  const [isMentor, setIsMentor] = useState(user?.role === 'mentor');

  // Log temporal para debug del estado inicial
  console.log('Form data:', formData);
  console.log('Is mentor:', isMentor);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        photoUrl: user.photoUrl || '',
        skills: user.skills || '',
        interests: user.interests || ''
      });
      setIsMentor(user.role === 'mentor');
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          photoUrl: formData.photoUrl,
          skills: formData.skills,
          interests: formData.interests,
          role: isMentor ? 'mentor' : 'mentee'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      await updateUser(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Ocultar después de 3 segundos
    } catch (error) {
      console.error("Error updating profile:", error);
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
    <div className="min-h-screen bg-gray-900 py-8">
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

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-300">
                  {t('register.want_to_be_mentor')}
                </Label>
                <div className="inline-flex rounded-lg border border-gray-600">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-l-lg ${isMentor ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                    onClick={() => setIsMentor(true)}
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-r-lg ${!isMentor ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                    onClick={() => setIsMentor(false)}
                  >
                    {t('common.no')}
                  </button>
                </div>
              </div>
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
              <Button type="submit" color="blue">
                {t('register.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 