import React from 'react';
import { Globe, Menu } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
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

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
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
        <NavbarLogo src="" alt="TransparensiMY">TransparensiMY</NavbarLogo>
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
            className={activeTab === item.id ? 'bg-blue-600 text-white' : ''}
          >
            {item.label}
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <NavbarAction>
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
      </NavbarAction>
    </Navbar>
  );
};

export default Header;
