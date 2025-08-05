import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Departments from './components/Departments';
import Analytics from './components/Analytics';
import Admin from './components/Admin';
import Login from './components/Login';
import { ThemeProvider } from '@govtechmy/myds-react/hooks';

interface User {
  provider: string;
  role: 'citizen' | 'admin';
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (credentials: { provider: string; role: 'citizen' | 'admin' }) => {
    // TODO: Implement actual ZKLogin authentication logic
    // For now, we'll just simulate login
    setUser({
      provider: credentials.provider,
      role: credentials.role
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'departments':
        return <Departments />;
      case 'analytics':
        return <Analytics />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <ThemeProvider>
        <Login 
          onLogin={handleLogin}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
