import React, { useState } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

/**
 * ThemeSwitch component for toggling between light and dark themes
 * Currently only displays the switch UI without functionality
 * Includes an Easter egg when trying to switch to light theme that can be enabled/disabled via .env
 */
const ThemeSwitch: React.FC = () => {
  const { t } = useTranslation();
  // Default to dark theme (moon icon)
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);
  // State for showing the Easter egg dialog
  const [showDialog, setShowDialog] = useState(false);
  // State to track if buttons are swapped
  const [areButtonsSwapped, setAreButtonsSwapped] = useState(false);
  
  // Check if Easter egg is enabled from environment variable
  const isEasterEggEnabled = process.env.REACT_APP_ENABLE_EASTER_EGG === 'true';
  
  // This function will be implemented later to actually change the theme
  const toggleTheme = () => {
    // If currently in dark theme and trying to switch to light theme
    if (isDarkTheme) {
      if (isEasterEggEnabled) {
        // Show Easter egg dialog if enabled
        setShowDialog(true);
        setAreButtonsSwapped(false); // Reset button positions when dialog opens
      } else {
        // Normal behavior if Easter egg is disabled
        setIsDarkTheme(false);
      }
    } else {
      // If already in light theme, just switch back to dark
      setIsDarkTheme(true);
    }
  };

  // Function to handle "No" button click
  const handleNoClick = () => {
    setIsDarkTheme(true);
    setShowDialog(false);
    setAreButtonsSwapped(false); // Reset button positions
  };

  // Function to handle "Yes" button hover
  const handleYesHover = () => {
    // Toggle the button positions each time the cursor hovers over "Yes"
    setAreButtonsSwapped(prevState => !prevState);
  };

  // Function to handle "Yes" button click (in case they manage to click it)
  const handleYesClick = () => {
    setIsDarkTheme(false);
    setShowDialog(false);
    setAreButtonsSwapped(false); // Reset button positions
  };

  return (
    <>
      <button 
        onClick={toggleTheme}
        className="relative inline-flex items-center w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
        style={{ 
          backgroundColor: isDarkTheme ? '#374151' : '#dbeafe' 
        }}
      >
        <span className="sr-only">
          {isDarkTheme ? t('themeSwitch.switchToLight') : t('themeSwitch.switchToDark')}
        </span>
        
        {/* Círculo deslizante */}
        <span 
          className={`absolute h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            isDarkTheme ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isDarkTheme ? (
            <HiMoon className="h-3 w-3 text-gray-700" />
          ) : (
            <HiSun className="h-3 w-3 text-yellow-500" />
          )}
        </span>
        
        {/* Iconos estáticos en el fondo */}
        <div className="flex items-center justify-between w-full px-0.5">
          <HiSun className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-gray-400' : 'text-yellow-500'}`} />
          <HiMoon className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'}`} />
        </div>
      </button>

      {/* Easter Egg Dialog - Only shown if Easter egg is enabled */}
      {showDialog && isEasterEggEnabled && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div 
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-700 relative"
          >
            <h3 className="text-xl font-bold text-white mb-4">{t('themeSwitch.easterEgg.warning')}</h3>
            <p className="text-gray-300 mb-6">
              {t('themeSwitch.easterEgg.message')}
            </p>
            <div className="flex justify-between">
              {/* Botones que intercambian posiciones */}
              {areButtonsSwapped ? (
                <>
                  <button
                    onClick={handleNoClick}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    {t('themeSwitch.easterEgg.no')}
                  </button>
                  <button
                    onClick={handleYesClick}
                    onMouseEnter={handleYesHover}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200"
                  >
                    {t('themeSwitch.easterEgg.yes')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleYesClick}
                    onMouseEnter={handleYesHover}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200"
                  >
                    {t('themeSwitch.easterEgg.yes')}
                  </button>
                  <button
                    onClick={handleNoClick}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    {t('themeSwitch.easterEgg.no')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSwitch; 