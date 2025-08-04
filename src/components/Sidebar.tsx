import React from 'react';
import { BarChart3, FileText, Building2, TrendingUp, Settings, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard') },
    { id: 'projects', icon: FileText, label: t('nav.projects') },
    { id: 'departments', icon: Building2, label: t('nav.departments') },
    { id: 'analytics', icon: TrendingUp, label: t('nav.analytics') },
    { id: 'admin', icon: Settings, label: t('nav.admin') }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50
        md:relative md:top-0 md:h-full md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-end items-center p-4 border-b md:hidden">
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
