import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BlockchainDashboard from './components/AdminDashboard'; // Your new blockchain dashboard
import Projects from './components/Projects';
import Departments from './components/Departments';
import Analytics from './components/Analytics';
import Admin from './components/Admin';
import Login from './components/Login';
import CitizenDashboard from './components/CitizenDashboard'; // Citizen-specific dashboard
import { ThemeProvider } from '@govtechmy/myds-react/hooks';
import { LoginResult } from './services/zklogin';
import { suiContractsService } from './services/suiContracts';

// Extended user type with blockchain information
type UserSession = LoginResult & { 
  role: 'citizen' | 'admin';
  loginTime: string;
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing login session on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking for existing login session...');
      
      const storedSession = localStorage.getItem('zklogin_session');
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession) as UserSession;
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) {
          console.log('✅ Valid session found:', {
            role: sessionData.role,
            email: sessionData.userInfo.email,
            address: sessionData.userAddress.slice(0, 8) + '...',
            hoursActive: Math.round(hoursSinceLogin * 10) / 10
          });
          
          setUser(sessionData);
          setIsLoggedIn(true);
          
          // Initialize blockchain data for existing session
          initializeBlockchainData();
        } else {
          console.log('⏰ Session expired, clearing stored data');
          localStorage.removeItem('zklogin_session');
        }
      } else {
        console.log('👤 No existing session found');
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      localStorage.removeItem('zklogin_session');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeBlockchainData = async () => {
    try {
      console.log('📊 Initializing blockchain data...');
      await suiContractsService.initializeDemoData();
      console.log('✅ Blockchain demo data initialized');
    } catch (error) {
      console.error('❌ Error initializing blockchain data:', error);
    }
  };

  const handleLogin = async (loginResult: UserSession) => {
    try {
      console.log('🎉 User logged in successfully:', {
        role: loginResult.role,
        email: loginResult.userInfo.email,
        provider: loginResult.provider,
        address: loginResult.userAddress.slice(0, 10) + '...'
      });
      
      setUser(loginResult);
      setIsLoggedIn(true);
      
      // Initialize blockchain service with demo data
      await initializeBlockchainData();
      
      // Set appropriate default tab based on role
      if (loginResult.role === 'citizen') {
        setActiveTab('dashboard');
      } else if (loginResult.role === 'admin') {
        setActiveTab('admin');
      }
      
    } catch (error) {
      console.error('❌ Error during login process:', error);
    }
  };

  const handleLogout = () => {
    console.log('👋 User logging out...');
    
    // Clear session data
    localStorage.removeItem('zklogin_session');
    
    // Clear any ZKLogin session data that might be stored
    const zkloginKeys = Object.keys(localStorage).filter(key => key.startsWith('zklogin_'));
    zkloginKeys.forEach(key => localStorage.removeItem(key));
    
    // Reset app state
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    
    console.log('✅ Logout completed');
  };

  const renderContent = () => {
    if (!user) return null;

    // For citizens, show appropriate content based on activeTab
    if (user.role === 'citizen') {
      switch (activeTab) {
        case 'dashboard':
        case 'projects':
          return <CitizenDashboard loginResult={user} onLogout={handleLogout} />;
        case 'analytics':
          return <Analytics />;
        default:
          return <CitizenDashboard loginResult={user} onLogout={handleLogout} />;
      }
    }

    // For admins, show full navigation including blockchain dashboard
    switch (activeTab) {
      case 'dashboard':
        return <BlockchainDashboard loginResult={user} userRole={user.role} />;
      case 'projects':
        return <Projects />;
      case 'departments':
        return <Departments />;
      case 'analytics':
        return <Analytics />;
        case 'admin':
          return <Admin loginResult={user} />;
      default:
        return <BlockchainDashboard loginResult={user} userRole={user.role} />;
    }
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg text-gray-600">Loading TransparensiMY...</span>
          </div>
          <div className="absolute bottom-4 left-4 text-xs text-gray-400">
            🔗 Checking blockchain connection...
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn || !user) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
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
        
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Blockchain Status Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-500">
              <span>🏛️ TransparensiMY</span>
              <span>•</span>
              <span>Malaysian Government Transparency Platform</span>
              <span>•</span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                Blockchain {import.meta.env.VITE_ENABLE_REAL_BLOCKCHAIN === 'true' ? 'Connected' : 'Demo Mode'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span>Role: {user.role}</span>
              <span>•</span>
              <span>Address: {user.userAddress.slice(0, 8)}...{user.userAddress.slice(-4)}</span>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;