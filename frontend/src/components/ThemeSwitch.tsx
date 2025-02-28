import React from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';

/**
 * ThemeSwitch component for toggling between light and dark themes
 * Currently only displays the switch UI without functionality
 */
const ThemeSwitch: React.FC = () => {
  // Default to dark theme (moon icon)
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);
  
  // This function will be implemented later to actually change the theme
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // Theme change functionality will be added in a future step
  };

  return (
    <button 
      onClick={toggleTheme}
      className="relative inline-flex items-center w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
      style={{ 
        backgroundColor: isDarkTheme ? '#374151' : '#dbeafe' 
      }}
    >
      <span className="sr-only">{isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      
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
  );
};

export default ThemeSwitch; 