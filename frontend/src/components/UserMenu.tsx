import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'flowbite-react';
import { HiUser, HiLogout } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import CachedImage from './CachedImage';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={
        <CachedImage
          src={user?.photoUrl || ''}
          alt="User profile"
          className="w-8 h-8 rounded-full cursor-pointer"
          fallbackSrc="https://via.placeholder.com/40"
        />
      }
    >
      <Dropdown.Header>
        <span className="block text-sm">{user?.name}</span>
        <span className="block truncate text-sm font-medium">{user?.email}</span>
      </Dropdown.Header>
      <Dropdown.Item 
        icon={HiUser} 
        onClick={() => navigate('/profile')}
      >
        {t('profile.view_edit')}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item icon={HiLogout} onClick={logout}>
        {t('common.logout')}
      </Dropdown.Item>
    </Dropdown>
  );
};

export default UserMenu; 