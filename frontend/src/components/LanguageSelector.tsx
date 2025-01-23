import { useTranslation } from 'react-i18next';
import { Dropdown } from 'flowbite-react';
import { HiLanguage } from 'react-icons/hi2';
import { GB, ES, FR } from 'country-flag-icons/react/3x2';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={<HiLanguage className="h-5 w-5 text-gray-300 hover:text-white" />}
    >
      <Dropdown.Item onClick={() => changeLanguage('en')}>
        <div className="flex items-center">
          <GB className="h-4 w-4 mr-2" />
          English
        </div>
      </Dropdown.Item>
      <Dropdown.Item onClick={() => changeLanguage('es')}>
        <div className="flex items-center">
          <ES className="h-4 w-4 mr-2" />
          Español
        </div>
      </Dropdown.Item>
      <Dropdown.Item onClick={() => changeLanguage('fr')}>
        <div className="flex items-center">
          <FR className="h-4 w-4 mr-2" />
          Français
        </div>
      </Dropdown.Item>
    </Dropdown>
  );
};

export default LanguageSelector; 