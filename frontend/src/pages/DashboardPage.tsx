import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Dropdown } from 'flowbite-react';
import { HiMenuAlt1, HiOutlineLogout, HiOutlineUser, HiOutlineCog } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    navigate('/register', { state: { isNewUser: false } });
  };

  // Si el usuario es 'pending', no renderizar el dashboard
  if (user?.role === 'pending') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Menú izquierdo */}
            <button className="text-gray-500 hover:text-gray-700">
              <HiMenuAlt1 className="h-6 w-6" />
            </button>

            {/* Saludo central */}
            <div className="flex items-center gap-3">
              <Avatar 
                img={user?.photoUrl}
                rounded
                size="md"
              />
              <span className="text-lg font-semibold text-gray-900">
                {t('dashboard.greeting', { name: user?.name })}
              </span>
            </div>

            {/* Menú de usuario */}
            <Dropdown
              label={<HiOutlineUser className="h-6 w-6" />}
              arrowIcon={false}
              inline
            >
              <Dropdown.Header>
                <span className="block text-sm">{user?.name}</span>
                <span className="block truncate text-sm font-medium">{user?.email}</span>
              </Dropdown.Header>
              <Dropdown.Item icon={HiOutlineCog} onClick={handleEditProfile}>
                {t('common.edit_profile')}
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item icon={HiOutlineLogout} onClick={handleLogout}>
                {t('common.logout')}
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('dashboard.welcome_message')}
          </h2>
          {/* Aquí irá el contenido del dashboard */}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 