import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Youtube } from 'lucide-react';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Youtube className="h-8 w-8 text-red-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ThumbnailAI
          </h1>
        </div>
        
        <nav className="flex items-center space-x-6">
          <button 
            className="rounded-full p-2 hover:bg-gray-800 transition-all duration-200"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;