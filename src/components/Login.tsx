import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import logoTm from '../assets/logo-tm.svg';
import { 
  Button, 
  ButtonIcon 
} from '@govtechmy/myds-react/button';
import { 
  User, 
  Shield,
  ExternalLink,
  Loader
} from 'lucide-react';

interface LoginProps {
  onLogin: (credentials: { provider: string; role: 'citizen' | 'admin' }) => void;
}

type OAuthProvider = 'google' | 'facebook' | 'twitch' | 'apple';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [loginType, setLoginType] = useState<'citizen' | 'admin'>('citizen');
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setIsLoading(provider);
    
    try {
      // TODO: Implement actual ZKLogin OAuth flow
      // This will involve:
      // 1. Generate ephemeral key pair
      // 2. Generate nonce
      // 3. Redirect to OAuth provider
      // 4. Handle OAuth callback
      // 5. Generate ZK proof
      // 6. Derive Sui address
      
      // For now, simulate the flow
      setTimeout(() => {
        onLogin({ 
          provider, 
          role: loginType 
        });
        setIsLoading(null);
      }, 2000);
      
    } catch (error) {
      console.error('OAuth login failed:', error);
      setIsLoading(null);
    }
  };

  const oauthProviders: Array<{
    id: OAuthProvider;
    name: string;
    icon: React.ReactNode;
    description: string;
    available: boolean;
  }> = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      description: t('login.googleDescription'),
      available: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      description: t('login.facebookDescription'),
      available: true,
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
        </svg>
      ),
      description: t('login.twitchDescription'),
      available: true,
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
        </svg>
      ),
      description: t('login.appleDescription'),
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-support-50 via-support-100 to-support-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logoTm} 
              alt="TransparensiMY" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-support-950 mb-2">
            {t('login.title')}
          </h1>
          <p className="text-support-600 text-sm">
            {t('login.zkLoginSubtitle')}
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="flex mb-6 bg-support-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLoginType('citizen')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === 'citizen'
                ? 'bg-white text-support-950 shadow-sm'
                : 'text-support-600 hover:text-support-950'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              {t('login.citizen')}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === 'admin'
                ? 'bg-white text-support-950 shadow-sm'
                : 'text-support-600 hover:text-support-950'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {t('login.admin')}
            </div>
          </button>
        </div>

        {/* ZKLogin Card */}
        <div className="bg-white rounded-lg shadow-lg border border-support-200">
          <div className="p-6 pb-4 border-b border-support-200">
            <h2 className="text-lg font-medium text-support-950">
              {loginType === 'citizen' ? t('login.citizenAccess') : t('login.adminAccess')}
            </h2>
            <p className="text-sm text-support-600 mt-1">
              {t('login.zkLoginDescription')}
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* OAuth Provider Buttons */}
            {oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant={isLoading === provider.id ? "primary-fill" : "default-outline"}
                size="medium"
                onClick={() => handleOAuthLogin(provider.id)}
                disabled={!provider.available || isLoading !== null}
                className="w-full justify-start text-left"
              >
                <ButtonIcon>
                  {isLoading === provider.id ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <div>{provider.icon}</div>
                  )}
                </ButtonIcon>
                <div className="flex-1 text-left">
                  <div className="font-medium">
                    {isLoading === provider.id 
                      ? t('login.connecting') 
                      : `${t('login.continueWith')} ${provider.name}`
                    }
                  </div>
                  <div className="text-xs text-support-600 mt-0.5">
                    {provider.description}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-support-400" />
              </Button>
            ))}

            {/* How ZKLogin Works */}
            <div className="bg-support-50 border border-support-200 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-medium text-support-950 mb-2">
                {t('login.howItWorks')}
              </h3>
              <ul className="text-xs text-support-600 space-y-1">
                <li>• {t('login.step1')}</li>
                <li>• {t('login.step2')}</li>
                <li>• {t('login.step3')}</li>
                <li>• {t('login.step4')}</li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 text-center">
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {t('login.securityNotice')}
                </span>
              </p>
            </div>

            {/* Help Links */}
            <div className="text-center text-sm space-y-1 pt-2">
              <a 
                href="#zklogin-info" 
                className="text-primary-600 hover:text-primary-700 block"
              >
                {t('login.learnMoreZKLogin')}
              </a>
              <a 
                href="#help" 
                className="text-support-600 hover:text-support-700"
              >
                {t('login.needHelp')}
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-support-500">
          <p>{t('login.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
