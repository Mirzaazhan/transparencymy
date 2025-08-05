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

interface User {
  provider: string;
  role: 'citizen' | 'admin';
}

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, user, onLogout }) => {
  const { t, currentLanguage, languages, switchLanguage } = useLanguage();

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard') },
    { id: 'projects', icon: FileText, label: t('nav.projects') },
    { id: 'departments', icon: Building2, label: t('nav.departments') },
    { id: 'analytics', icon: TrendingUp, label: t('nav.analytics') },
    { id: 'admin', icon: Settings, label: t('nav.admin') }
  ];

  return (
    <Navbar>
      <div className="flex items-center">
        <NavbarLogo src={logoTm} alt="TransparensiMY">TransparensiMY</NavbarLogo>
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
              <div className="hidden md:flex items-center gap-2 text-sm text-support-700">
                <User className="h-4 w-4" />
                <span className="capitalize">
                  {user.role === 'admin' ? t('login.admin') : t('login.citizen')}
                </span>
              </div>
              {onLogout && (
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
              )}
            </div>
          )}
        </div>
      </NavbarAction>
    </Navbar>
  );
};

export default Header;
