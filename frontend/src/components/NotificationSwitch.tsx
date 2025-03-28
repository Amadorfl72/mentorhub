import React from 'react';
import { HiMail, HiMailOpen } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'flowbite-react';

interface NotificationSwitchProps {
  isEnabled: boolean;
  onChange: (isEnabled: boolean) => void;
}

/**
 * NotificationSwitch component for toggling email notifications
 * Similar in style to the ThemeSwitch but specifically for notifications
 */
const NotificationSwitch: React.FC<NotificationSwitchProps> = ({ isEnabled, onChange }) => {
  const { t } = useTranslation();

  return (
    <Tooltip 
      content={isEnabled 
        ? t('notifications.tooltip_enabled') 
        : t('notifications.tooltip_disabled')
      }
      placement="top"
      style="light"
      animation="duration-300"
    >
      <button 
        onClick={() => onChange(!isEnabled)}
        className="relative inline-flex items-center w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
        style={{ 
          backgroundColor: isEnabled ? '#1e40af' : '#374151' // blue-800 when enabled, gray-700 when disabled
        }}
        aria-label={isEnabled ? t('notifications.disable') : t('notifications.enable')}
        type="button" // Ensure it doesn't submit the form when clicked
      >
        <span className="sr-only">
          {isEnabled ? t('notifications.disable') : t('notifications.enable')}
        </span>
        
        {/* Sliding circle */}
        <span 
          className={`absolute h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            isEnabled ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isEnabled ? (
            <HiMail className="h-3 w-3 text-blue-700" />
          ) : (
            <HiMailOpen className="h-3 w-3 text-gray-500" />
          )}
        </span>
        
        {/* Static background icons */}
        <div className="flex items-center justify-between w-full px-0.5">
          <HiMailOpen className={`h-3.5 w-3.5 ${isEnabled ? 'text-blue-200' : 'text-gray-400'}`} />
          <HiMail className={`h-3.5 w-3.5 ${isEnabled ? 'text-white' : 'text-gray-500'}`} />
        </div>
      </button>
    </Tooltip>
  );
};

export default NotificationSwitch; 