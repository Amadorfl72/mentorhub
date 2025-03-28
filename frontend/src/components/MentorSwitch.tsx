import React from 'react';
import { HiAcademicCap, HiUserGroup } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'flowbite-react';

interface MentorSwitchProps {
  isMentor: boolean;
  onChange: (isMentor: boolean) => void;
}

/**
 * MentorSwitch component for toggling mentor/mentee role
 * Similar in style to the NotificationSwitch
 */
const MentorSwitch: React.FC<MentorSwitchProps> = ({ isMentor, onChange }) => {
  const { t } = useTranslation();

  return (
    <Tooltip 
      content={isMentor 
        ? t('register.tooltip_mentor') 
        : t('register.tooltip_mentee')
      }
      placement="top"
      style="light" 
      animation="duration-300"
    >
      <button 
        onClick={() => onChange(!isMentor)}
        className="relative inline-flex items-center w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
        style={{ 
          backgroundColor: isMentor ? '#047857' : '#374151' // green-700 when mentor, gray-700 when mentee
        }}
        aria-label={isMentor ? t('register.switch_to_mentee') : t('register.switch_to_mentor')}
        type="button" // Ensure it doesn't submit the form when clicked
      >
        <span className="sr-only">
          {isMentor ? t('register.switch_to_mentee') : t('register.switch_to_mentor')}
        </span>
        
        {/* Sliding circle */}
        <span 
          className={`absolute h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            isMentor ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isMentor ? (
            <HiAcademicCap className="h-3 w-3 text-green-700" />
          ) : (
            <HiUserGroup className="h-3 w-3 text-gray-500" />
          )}
        </span>
        
        {/* Static background icons */}
        <div className="flex items-center justify-between w-full px-0.5">
          <HiUserGroup className={`h-3.5 w-3.5 ${isMentor ? 'text-green-200' : 'text-gray-400'}`} />
          <HiAcademicCap className={`h-3.5 w-3.5 ${isMentor ? 'text-white' : 'text-gray-500'}`} />
        </div>
      </button>
    </Tooltip>
  );
};

export default MentorSwitch; 