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
        'nav.logout': 'Logout',
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
        'feedback.submit': 'Submit Feedback',
        'login.title': 'TransparensiMY Login',
        'login.subtitle': 'Access government transparency dashboard',
        'login.zkLoginSubtitle': 'Secure login using zero-knowledge proofs with OAuth providers',
        'login.zkLoginDescription': 'Zero-knowledge login preserves your privacy while ensuring secure authentication.',
        'login.citizen': 'Citizen',
        'login.admin': 'Administrator',
        'login.citizenAccess': 'Citizen Access',
        'login.adminAccess': 'Administrator Access',
        'login.email': 'Email Address',
        'login.emailPlaceholder': 'Enter your email address',
        'login.password': 'Password',
        'login.passwordPlaceholder': 'Enter your password',
        'login.signIn': 'Sign In',
        'login.loggingIn': 'Signing In...',
        'login.orContinueWith': 'or continue with',
        'login.continueWith': 'Continue with',
        'login.connecting': 'Connecting...',
        'login.continueWithGoogle': 'Continue with Google',
        'login.continueWithFacebook': 'Continue with Facebook',
        'login.googleDescription': 'Sign in with your Google account',
        'login.facebookDescription': 'Use your Facebook credentials',
        'login.twitchDescription': 'Connect with your Twitch account',
        'login.appleDescription': 'Sign in with Apple ID',
        'login.howItWorks': 'How ZKLogin Works',
        'login.step1': 'Choose your OAuth provider',
        'login.step2': 'Authenticate with your provider',
        'login.step3': 'Generate zero-knowledge proof',
        'login.step4': 'Access granted securely',
        'login.securityNotice': 'Your privacy is protected with zero-knowledge authentication',
        'login.learnMoreZKLogin': 'Learn more about ZKLogin technology',
        'login.zkLoginNotice': 'Enhanced security with SUI ZKLogin coming soon',
        'login.forgotPassword': 'Forgot your password?',
        'login.needHelp': 'Need help signing in?',
        'login.footer': 'Powered by SUI ZKLogin & Malaysian Government Design System'
      },
      ms: {
        'nav.dashboard': 'Papan Pemuka',
        'nav.projects': 'Projek',
        'nav.departments': 'Jabatan',
        'nav.analytics': 'Analitik',
        'nav.admin': 'Admin',
        'nav.logout': 'Log Keluar',
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
        'feedback.submit': 'Hantar Maklum Balas',
        'login.title': 'Log Masuk TransparensiMY',
        'login.subtitle': 'Akses papan pemuka ketelusan kerajaan',
        'login.zkLoginSubtitle': 'Log masuk selamat menggunakan bukti sifar-pengetahuan dengan penyedia OAuth',
        'login.zkLoginDescription': 'Log masuk sifar-pengetahuan memelihara privasi anda sambil memastikan pengesahan yang selamat.',
        'login.citizen': 'Rakyat',
        'login.admin': 'Pentadbir',
        'login.citizenAccess': 'Akses Rakyat',
        'login.adminAccess': 'Akses Pentadbir',
        'login.email': 'Alamat E-mel',
        'login.emailPlaceholder': 'Masukkan alamat e-mel anda',
        'login.password': 'Kata Laluan',
        'login.passwordPlaceholder': 'Masukkan kata laluan anda',
        'login.signIn': 'Log Masuk',
        'login.loggingIn': 'Sedang Log Masuk...',
        'login.orContinueWith': 'atau teruskan dengan',
        'login.continueWith': 'Teruskan dengan',
        'login.connecting': 'Sedang menyambung...',
        'login.continueWithGoogle': 'Teruskan dengan Google',
        'login.continueWithFacebook': 'Teruskan dengan Facebook',
        'login.googleDescription': 'Log masuk dengan akaun Google anda',
        'login.facebookDescription': 'Gunakan kelayakan Facebook anda',
        'login.twitchDescription': 'Sambung dengan akaun Twitch anda',
        'login.appleDescription': 'Log masuk dengan Apple ID',
        'login.howItWorks': 'Bagaimana ZKLogin Berfungsi',
        'login.step1': 'Pilih penyedia OAuth anda',
        'login.step2': 'Sahkan dengan penyedia anda',
        'login.step3': 'Jana bukti sifar-pengetahuan',
        'login.step4': 'Akses diberikan dengan selamat',
        'login.securityNotice': 'Privasi anda dilindungi dengan pengesahan sifar-pengetahuan',
        'login.learnMoreZKLogin': 'Ketahui lebih lanjut tentang teknologi ZKLogin',
        'login.zkLoginNotice': 'Keselamatan dipertingkat dengan SUI ZKLogin akan datang',
        'login.forgotPassword': 'Terlupa kata laluan anda?',
        'login.needHelp': 'Perlukan bantuan untuk log masuk?',
        'login.footer': 'Dikuasakan oleh SUI ZKLogin & Sistem Reka Bentuk Kerajaan Malaysia'
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
