import { useState } from 'react';
import { Language } from '../types';

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ms', name: 'Bahasa Malaysia' }
];

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

  const switchLanguage = (languageCode: 'en' | 'ms') => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
    }
  };

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'nav.dashboard': 'Dashboard',
        'nav.projects': 'Projects',
        'nav.departments': 'Departments',
        'nav.analytics': 'Analytics',
        'nav.admin': 'Admin',
        'dashboard.title': 'Government Spending Dashboard',
        'dashboard.subtitle': 'Real-time transparency in government expenditure',
        'dashboard.totalSpent': 'Total Spent',
        'dashboard.totalBudget': 'Total Budget',
        'dashboard.activeProjects': 'Active Projects',
        'dashboard.completedProjects': 'Completed Projects',
        'projects.title': 'Government Projects',
        'projects.search': 'Search projects...',
        'projects.filter': 'Filter by department',
        'projects.all': 'All Departments',
        'status.planned': 'Planned',
        'status.inProgress': 'In Progress',
        'status.completed': 'Completed',
        'status.cancelled': 'Cancelled',
        'project.budgetAllocated': 'Budget Allocated',
        'project.amountSpent': 'Amount Spent',
        'project.remaining': 'Remaining',
        'project.viewDetails': 'View Details',
        'feedback.title': 'Citizen Feedback',
        'feedback.rating': 'Rating',
        'feedback.comment': 'Comment',
        'feedback.submit': 'Submit Feedback'
      },
      ms: {
        'nav.dashboard': 'Papan Pemuka',
        'nav.projects': 'Projek',
        'nav.departments': 'Jabatan',
        'nav.analytics': 'Analitik',
        'nav.admin': 'Admin',
        'dashboard.title': 'Papan Pemuka Perbelanjaan Kerajaan',
        'dashboard.subtitle': 'Ketelusan masa nyata dalam perbelanjaan kerajaan',
        'dashboard.totalSpent': 'Jumlah Dibelanjakan',
        'dashboard.totalBudget': 'Jumlah Bajet',
        'dashboard.activeProjects': 'Projek Aktif',
        'dashboard.completedProjects': 'Projek Selesai',
        'projects.title': 'Projek Kerajaan',
        'projects.search': 'Cari projek...',
        'projects.filter': 'Tapis mengikut jabatan',
        'projects.all': 'Semua Jabatan',
        'status.planned': 'Dirancang',
        'status.inProgress': 'Dalam Kemajuan',
        'status.completed': 'Selesai',
        'status.cancelled': 'Dibatalkan',
        'project.budgetAllocated': 'Bajet Diperuntukkan',
        'project.amountSpent': 'Jumlah Dibelanjakan',
        'project.remaining': 'Baki',
        'project.viewDetails': 'Lihat Butiran',
        'feedback.title': 'Maklum Balas Rakyat',
        'feedback.rating': 'Penilaian',
        'feedback.comment': 'Komen',
        'feedback.submit': 'Hantar Maklum Balas'
      }
    };

    return translations[currentLanguage.code][key] || key;
  };

  return {
    currentLanguage,
    languages,
    switchLanguage,
    t
  };
};
