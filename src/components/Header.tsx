import React from 'react';
import { Globe, Shield, Menu } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { currentLanguage, languages, switchLanguage } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-red-600 via-blue-600 to-yellow-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">TransparensiMY</h1>
                <p className="text-xs opacity-90">Blockchain Government Transparency</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <select
                value={currentLanguage.code}
                onChange={(e) => switchLanguage(e.target.value as 'en' | 'ms')}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
