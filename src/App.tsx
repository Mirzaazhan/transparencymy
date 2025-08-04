import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Departments from './components/Departments';
import Analytics from './components/Analytics';
import Admin from './components/Admin';
import { ThemeProvider } from '@govtechmy/myds-react/hooks';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
