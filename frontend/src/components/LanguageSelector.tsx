import { useTranslation } from 'react-i18next';
import { Dropdown } from 'flowbite-react';
import { HiLanguage } from 'react-icons/hi2';
import { GB, ES, FR } from 'country-flag-icons/react/3x2';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const changeLanguage = async (lng: string) => {
    // Cambiar el idioma en i18n (interfaz)
    i18n.changeLanguage(lng);
    
    // Si el usuario está autenticado, actualizar su preferencia en la base de datos
    if (user && user.id) {
      try {
        setIsUpdating(true);
        const token = localStorage.getItem('token');
        
        // Llamada a la API para actualizar el idioma del usuario
        const response = await fetch('http://localhost:5001/api/users/language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: lng })
        });
        
        if (response.ok) {
          // Actualizar el usuario en el contexto
          await updateUser({ ...user, language: lng });
          console.log(`Idioma actualizado a ${lng} en la base de datos`);
        } else {
          console.error('Error al actualizar el idioma en la base de datos');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={<HiLanguage className={`h-5 w-5 ${isUpdating ? 'text-blue-300 animate-pulse' : 'text-gray-300'} hover:text-white`} />}
    >
      <Dropdown.Item onClick={() => changeLanguage('en')}>
        <div className="flex items-center">
          <GB className="h-4 w-4 mr-2" />
          English
          {user?.language === 'en' && <span className="ml-2 text-green-500">✓</span>}
        </div>
      </Dropdown.Item>
      <Dropdown.Item onClick={() => changeLanguage('es')}>
        <div className="flex items-center">
          <ES className="h-4 w-4 mr-2" />
          Español
          {user?.language === 'es' && <span className="ml-2 text-green-500">✓</span>}
        </div>
      </Dropdown.Item>
      <Dropdown.Item onClick={() => changeLanguage('fr')}>
        <div className="flex items-center">
          <FR className="h-4 w-4 mr-2" />
          Français
          {user?.language === 'fr' && <span className="ml-2 text-green-500">✓</span>}
        </div>
      </Dropdown.Item>
    </Dropdown>
  );
};

export default LanguageSelector; 