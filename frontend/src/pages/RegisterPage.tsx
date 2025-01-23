import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput, Alert, Avatar, ToggleSwitch } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { HiX } from 'react-icons/hi';

const RegisterPage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isNewUser, message } = location.state || {};

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    photoUrl: user?.photoUrl || '',
    skills: '',
    interests: '',
  });

  const [isMentor, setIsMentor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        ...formData,
        role: isMentor ? 'mentor' : 'mentee'
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
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
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {isNewUser && message && (
          <Alert color="info" className="mb-6 bg-blue-900 text-blue-100">
            {message}
          </Alert>
        )}

        <div className="bg-gray-800 shadow-xl rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <Avatar 
              img={formData.photoUrl}
              size="xl"
              rounded
              className="mb-2 ring-2 ring-gray-700"
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

            <div className="flex items-center justify-between py-2">
              <span className="flex-grow font-medium text-gray-300">
                {t('register.want_to_be_mentor')}
              </span>
              <ToggleSwitch
                checked={isMentor}
                onChange={setIsMentor}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                gradientDuoTone="purpleToBlue"
                className="hover:bg-blue-700"
              >
                {isNewUser ? t('register.complete') : t('register.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 