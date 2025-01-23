import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput, Textarea, Alert } from 'flowbite-react';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isNewUser, message } = location.state || {};

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    biography: '',
    expertise: '',
    photoUrl: user?.photoUrl || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        ...formData,
        role: isNewUser ? 'mentee' : user?.role // Por defecto, nuevos usuarios son mentees
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {isNewUser && message && (
          <Alert color="info" className="mb-6">
            {message}
          </Alert>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isNewUser ? t('register.complete_profile') : t('register.edit_profile')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('register.name')}
              </label>
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isNewUser} // No permitir cambiar el nombre si viene de Google
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('register.email')}
              </label>
              <TextInput
                value={formData.email}
                type="email"
                disabled={true} // Email siempre deshabilitado ya que viene de Google
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('register.biography')}
              </label>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                required
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('register.expertise')}
              </label>
              <TextInput
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" gradientDuoTone="purpleToBlue">
                {isNewUser ? t('register.complete') : t('register.save_changes')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 