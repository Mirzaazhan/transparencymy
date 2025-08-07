import React from 'react';
import { Globe, LogOut, User } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import logoTm from '../assets/logo-tm.svg';
import {
  Navbar,
  NavbarLogo,
  NavbarAction,
  NavbarMenu,
  NavbarMenuItem,
} from "@govtechmy/myds-react/navbar";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@govtechmy/myds-react/select';
import { Button, ButtonIcon } from '@govtechmy/myds-react/button';
import { BarChart3, FileText, Building2, TrendingUp, Settings } from 'lucide-react';
import { LoginResult } from '../services/zklogin';

// Extended user type
type UserSession = LoginResult & { 
  role: 'citizen' | 'admin';
  loginTime: string;
};

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserSession | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, user, onLogout }) => {
  const { t, currentLanguage, languages, switchLanguage } = useLanguage();

  // Define menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: 'dashboard', icon: BarChart3, label: user.role === 'citizen' ? 'Projects' : t('nav.dashboard') },
      { id: 'analytics', icon: TrendingUp, label: t('nav.analytics') },
    ];

    if (user.role === 'admin') {
      return [
        { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard') },
        { id: 'projects', icon: FileText, label: t('nav.projects') },
        { id: 'departments', icon: Building2, label: t('nav.departments') },
        { id: 'analytics', icon: TrendingUp, label: t('nav.analytics') },
        { id: 'admin', icon: Settings, label: t('nav.admin') }
      ];
    }

    // For citizens, show simplified menu
    return [
      { id: 'dashboard', icon: FileText, label: 'Government Projects' },
      { id: 'analytics', icon: TrendingUp, label: 'Analytics' }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <Navbar>
      <div className="flex items-center">
        <NavbarLogo src={logoTm} alt="TransparensiMY">
          TransparensiMY
          {user?.role === 'citizen' && (
            <span className="text-sm text-gray-500 ml-2">Citizen Portal</span>
          )}
        </NavbarLogo>
      </div>
      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange(item.id);
            }}
            className={activeTab === item.id ? 'bg-blue-100 text-blue-600' : ''}
          >
            {item.label}
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <NavbarAction>
        <div className="flex items-center gap-3">
          {/* Blockchain Status */}
          {user && (
            <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                import.meta.env.VITE_ENABLE_REAL_BLOCKCHAIN === 'true' ? 'bg-green-400' : 'bg-blue-400'
              }`}></div>
              <span>
                {import.meta.env.VITE_ENABLE_REAL_BLOCKCHAIN === 'true' ? 'Live Blockchain' : 'Demo Mode'}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <div className="hidden sm:block">
            <Select
              value={currentLanguage.code}
              onValueChange={(value) => switchLanguage(value as 'en' | 'ms')}
              variant="outline"
              size="small"
            >
              <SelectTrigger aria-label="language-selection">
                <Globe className="h-4 w-4"></Globe>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="font-body rounded-[4px] py-1"
              >
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end text-sm">
                <div className="text-gray-900 font-medium">
                  {user.userInfo.name || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.role === 'admin' ? '👑 Admin' : '👤 Citizen'} • {user.userAddress.slice(0, 6)}...{user.userAddress.slice(-4)}
                </div>
              </div>
              <Button
                variant="default-outline"
                size="small"
                onClick={onLogout}
                aria-label="Logout"
              >
                <ButtonIcon>
                  <LogOut className="h-4 w-4" />
                </ButtonIcon>
                <span className="hidden sm:inline">
                  {t('nav.logout')}
                </span>
              </Button>
            </div>
          )}
        </div>
      </NavbarAction>
    </Navbar>
  );
};

export default Header;