import React, { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import {
  zkLoginService,
  type OAuthProvider,
  type ZKLoginState,
  type LoginResult,
} from "../services/zklogin";
import { suiContractsService } from "../services/suiContracts";
import logoTm from "../assets/logo-tm.svg";
import { Button, ButtonIcon } from "@govtechmy/myds-react/button";
import {
  User,
  Shield,
  ExternalLink,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface LoginProps {
  onLogin: (loginResult: LoginResult & { role: "citizen" | "admin" }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [loginType, setLoginType] = useState<"citizen" | "admin">("citizen");
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [zkLoginState, setZkLoginState] = useState<ZKLoginState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize ZKLogin state on component mount
  useEffect(() => {
    initializeZKLogin();
    suiContractsService.initializeDemoData();
  }, []);

  // Handle OAuth callback from URL hash
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash.includes("id_token=")) {
        console.log("🔄 OAuth callback detected in URL hash");
        setIsLoading("google");

        try {
          const params = new URLSearchParams(hash.substring(1));
          const idToken = params.get("id_token");
          const state = params.get("state");

          if (idToken && state) {
            const stateData = JSON.parse(atob(state));

            // ⭐ ENHANCED SESSION RECOVERY
            const storedRole =
              localStorage.getItem("zklogin_pending_role") || "citizen";
            const storedSessionId = localStorage.getItem(
              "zklogin_pending_session"
            );

            console.log("🔍 Session recovery debug:", {
              storedRole,
              storedSessionId,
              oauthSessionId: stateData.sessionId,
              shortSessionId: stateData.sid,
            });

            // Get all available sessions for intelligent matching
            const allStorageKeys = Object.keys(localStorage);
            const availableStateSessions = allStorageKeys
              .filter((k) => k.startsWith("zklogin_state_"))
              .map((k) => k.replace("zklogin_state_", ""));

            const availableKeySessions = allStorageKeys
              .filter((k) => k.startsWith("zklogin_ephemeral_"))
              .map((k) => k.replace("zklogin_ephemeral_", ""));

            console.log("🔍 Available sessions:", {
              totalStorageKeys: allStorageKeys.length,
              stateKeys: availableStateSessions.length,
              keyKeys: availableKeySessions.length,
              stateSessionIds: availableStateSessions.slice(0, 3),
              keySessionIds: availableKeySessions.slice(0, 3),
            });

            // ⭐ INTELLIGENT SESSION ID MATCHING
            let sessionIdToUse = null;

            // Method 1: Try stored session ID first
            if (
              storedSessionId &&
              availableStateSessions.includes(storedSessionId)
            ) {
              sessionIdToUse = storedSessionId;
              console.log(
                "✅ Method 1: Using stored session ID:",
                sessionIdToUse
              );
            }

            // Method 2: Try OAuth session ID
            if (
              !sessionIdToUse &&
              stateData.sessionId &&
              availableStateSessions.includes(stateData.sessionId)
            ) {
              sessionIdToUse = stateData.sessionId;
              console.log(
                "✅ Method 2: Using OAuth session ID:",
                sessionIdToUse
              );
            }

            // Method 3: Try partial matching with short session ID
            if (!sessionIdToUse && stateData.sid) {
              const partialMatch = availableStateSessions.find(
                (id) =>
                  id.startsWith(stateData.sid) ||
                  stateData.sid.startsWith(id.slice(0, 16))
              );
              if (partialMatch) {
                sessionIdToUse = partialMatch;
                console.log(
                  "✅ Method 3: Using partial match:",
                  sessionIdToUse
                );
              }
            }

            // Method 4: Try most recent session (last resort)
            if (!sessionIdToUse && availableStateSessions.length > 0) {
              // Sort by localStorage timestamp or just use the first available
              sessionIdToUse =
                availableStateSessions[availableStateSessions.length - 1];
              console.log(
                "⚠️ Method 4: Using most recent session (fallback):",
                sessionIdToUse
              );
            }

            if (!sessionIdToUse) {
              console.error(
                "❌ No valid session found after all recovery methods"
              );
              console.error("❌ Available sessions:", availableStateSessions);
              console.error("❌ Searched for:", {
                stored: storedSessionId,
                oauth: stateData.sessionId,
                short: stateData.sid,
              });

              setError(
                "Authentication session expired. Please start login again."
              );
              localStorage.removeItem("zklogin_pending_role");
              localStorage.removeItem("zklogin_pending_session");
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );
              setIsLoading(null);
              return;
            }

            console.log("🎯 Final session ID to use:", sessionIdToUse);

            // Get login result with recovered session
            const loginResult = await zkLoginService.handleOAuthCallback(
              idToken,
              stateData.provider,
              sessionIdToUse
            );

            console.log("🎯 OAuth callback successful with recovered session");
            console.log("Stored role:", storedRole);
            console.log("User email:", loginResult.userInfo.email);

            // ⭐ Use stored role for verification
            if (storedRole === "admin") {
              console.log(
                "✅ Entered admin verification block (using stored role)"
              );

              const isGovOfficial = verifyGovernmentEmail(
                loginResult.userInfo.email
              );
              console.log("🔍 Government verification result:", isGovOfficial);

              if (!isGovOfficial) {
                console.log(
                  "❌ BLOCKING admin access - not a government email"
                );
                setError(
                  `Access denied: Government email required for admin access. You signed in with: ${loginResult.userInfo.email}`
                );
                setIsLoading(null);

                // Clean up stored role
                localStorage.removeItem("zklogin_pending_role");
                localStorage.removeItem("zklogin_pending_session");

                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
                return;
              }

              console.log("✅ Admin verification passed");
            } else {
              console.log("ℹ️ Citizen login - no verification needed");
            }

            // Clean up stored role after successful verification
            localStorage.removeItem("zklogin_pending_role");
            localStorage.removeItem("zklogin_pending_session");

            // Use stored role as final role
            const finalRole = storedRole as "citizen" | "admin";

            console.log("🎉 Proceeding with login for role:", finalRole);

            const sessionData = {
              ...loginResult,
              role: finalRole,
              loginTime: new Date().toISOString(),
            };

            localStorage.setItem(
              "zklogin_session",
              JSON.stringify(sessionData)
            );
            onLogin({ ...loginResult, role: finalRole });
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (error) {
          console.error("OAuth callback error:", error);

          // Clean up stored role on error
          localStorage.removeItem("zklogin_pending_role");
          localStorage.removeItem("zklogin_pending_session");

          if (
            error.message.includes("429") ||
            error.message.includes("TooManyRequestsError")
          ) {
            setError(
              `Rate limited by proving service. Please wait a few seconds and try again.`
            );
            setTimeout(() => {
              console.log("🔄 Auto-retrying after rate limit...");
              window.location.reload();
            }, 6000);
          } else if (
            error.message.includes("Authentication session not found")
          ) {
            setError(
              "Session expired during login. Please clear browser data and try again."
            );

            // Add a button to clear everything
            setTimeout(() => {
              if (confirm("Clear all stored data and reload page?")) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }
            }, 2000);
          } else {
            setError(`Authentication failed: ${error.message}`);
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } finally {
          setIsLoading(null);
        }
      }
    };

    handleOAuthCallback();
  }, [zkLoginState, onLogin]);
  /**
   * Verify if email belongs to Malaysian government domain
   */
  const verifyGovernmentEmail = (email?: string): boolean => {
    console.log("🔍 verifyGovernmentEmail called with:", email);

    if (!email) {
      console.error("❌ No email provided for government verification");
      return false;
    }

    // **TEMPORARY FOR TESTING** - Add your specific Gmail here
    const testAdminEmails = [
      "mirzaazhan@gmail.com", // <-- Replace with your actual Gmail // <-- Add any test emails you want to use
      // Add more test emails as needed
      ,
    ];

    const allowedGovDomains = [
      "gov.my",
      "digital.gov.my",
      "mosti.gov.my",
      "treasury.gov.my",
      "mof.gov.my",
      "pmo.gov.my",
      "parlimen.gov.my",
      "finance.gov.my",
      "health.gov.my",
      "education.gov.my",
      "works.gov.my",
      "transport.gov.my",
      "kpkt.gov.my",
      "moh.gov.my",
      "moe.gov.my",
      "kementerian.gov.my",

      // For hackathon demo
      "example.gov.my",
      "demo.gov.my",
      "test.gov.my",
    ];

    const emailDomain = email.toLowerCase().split("@")[1];

    // Check if it's a government domain OR a test admin email
    const isGovEmail = allowedGovDomains.includes(emailDomain);
    const isTestAdmin = testAdminEmails.includes(email.toLowerCase());
    const isAuthorized = isGovEmail || isTestAdmin;

    console.log("🔍 Government email verification result:", {
      email: email,
      domain: emailDomain,
      isGovernment: isGovEmail,
      isTestAdmin: isTestAdmin,
      isAuthorized: isAuthorized,
      testEmails: testAdminEmails,
    });

    return isAuthorized;
  };

  const initializeZKLogin = async () => {
    try {
      setError(null);
      const state = await zkLoginService.initializeZKLogin();
      setZkLoginState(state);
      console.log("✅ ZKLogin state initialized successfully");
    } catch (error) {
      console.error("Failed to initialize ZKLogin:", error);
      setError(
        "Failed to initialize authentication system. Please refresh and try again."
      );
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (!zkLoginState) {
      setError(
        "Authentication system not ready. Please refresh and try again."
      );
      return;
    }

    setIsLoading(provider);
    setError(null);

    try {
      console.log("🚀 Starting OAuth login:", {
        provider,
        sessionId: zkLoginState.sessionId,
        requestedRole: loginType, // ⭐ This is what we need to preserve
      });

      // ⭐ CRITICAL FIX: Store loginType in localStorage before redirect
      localStorage.setItem("zklogin_pending_role", loginType);
      localStorage.setItem(
        "zklogin_pending_session",
        zkLoginState.sessionId || ""
      );

      console.log("💾 Stored pending role in localStorage:", {
        role: loginType,
        sessionId: zkLoginState.sessionId,
      });

      // Get OAuth URL (this will redirect, so we need to store state first)
      const authUrl = zkLoginService.getOAuthUrl(provider, zkLoginState);

      console.log("🔗 OAuth URL generated, redirecting to:", provider);

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth login failed:", error);
      setError(`Failed to start authentication: ${error.message}`);
      setIsLoading(null);
    }
  };
  useEffect(() => {
    // Check if there's a pending role from OAuth flow
    const pendingRole = localStorage.getItem("zklogin_pending_role");
    if (pendingRole && (pendingRole === "citizen" || pendingRole === "admin")) {
      console.log("🔄 Restoring pending role from localStorage:", pendingRole);
      setLoginType(pendingRole);
    }

    initializeZKLogin();
    suiContractsService.initializeDemoData();
  }, []);

  const oauthProviders: Array<{
    id: OAuthProvider;
    name: string;
    icon: React.ReactNode;
    description: string;
    available: boolean;
  }> = [
    {
      id: "google",
      name: "Google",
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
      description:
        loginType === "admin"
          ? "Must use government Google account (@gov.my)"
          : "Secure and private authentication",
      available: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      description:
        loginType === "admin"
          ? "Alternative government authentication (@gov.my required)"
          : "Connect with your Facebook account",
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-support-50 via-support-100 to-support-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logoTm} alt="TransparensiMY" className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold text-support-950 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-support-600 text-sm">
            {t("login.zkLoginSubtitle")}
          </p>
        </div>

        {/* Error Message */}
        {error && error.includes("Access denied") && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">
                  Admin Access Denied
                </h4>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  Please use a @gov.my email address or switch to Citizen login.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoginType("citizen");
                    }}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded"
                  >
                    Switch to Citizen
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      initializeZKLogin();
                    }}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Error Message - For other errors */}
        {error && !error.includes("Access denied") && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    initializeZKLogin();
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ZKLogin Status Indicator */}
        {zkLoginState && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              ZKLogin system ready (Epoch: {zkLoginState.currentEpoch})
              {zkLoginState.sessionId && (
                <span className="text-xs text-green-600">
                  • Session: {zkLoginState.sessionId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Login Type Selector */}
        <div className="flex mb-6 bg-support-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLoginType("citizen")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "citizen"
                ? "bg-white text-support-950 shadow-sm"
                : "text-support-600 hover:text-support-950"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              {t("login.citizen")}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "admin"
                ? "bg-white text-support-950 shadow-sm"
                : "text-support-600 hover:text-support-950"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {t("login.admin")}
            </div>
          </button>
        </div>

        {/* ZKLogin Card */}
        <div className="bg-white rounded-lg shadow-lg border border-support-200">
          <div className="p-6 pb-4 border-b border-support-200">
            <h2 className="text-lg font-medium text-support-950">
              {loginType === "citizen"
                ? t("login.citizenAccess")
                : t("login.adminAccess")}
            </h2>
            <p className="text-sm text-support-600 mt-1">
              {loginType === "admin"
                ? "Government officials only - requires @gov.my email domain"
                : "Anonymous and secure authentication for Malaysian citizens"}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* OAuth Provider Buttons */}
            {oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant={
                  isLoading === provider.id ? "primary-fill" : "default-outline"
                }
                size="medium"
                onClick={() => handleOAuthLogin(provider.id)}
                disabled={
                  !provider.available || isLoading !== null || !zkLoginState
                }
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
                      ? t("login.connecting")
                      : `${t("login.continueWith")} ${provider.name}`}
                  </div>
                  <div className="text-xs text-support-600 mt-0.5">
                    {provider.description}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-support-400" />
              </Button>
            ))}

            {/* Admin Access Requirements */}
            {loginType === "admin" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-900 mb-2">
                  Government Official Requirements
                </h3>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>
                    • Valid @gov.my, @digital.gov.my, or ministry email address
                  </li>
                  <li>• Email domain verification will be performed</li>
                  <li>• Department verification through blockchain</li>
                  <li>• All actions will be logged and auditable</li>
                </ul>
              </div>
            )}

            {/* How ZKLogin Works */}
            <div className="bg-support-50 border border-support-200 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-medium text-support-950 mb-2">
                {t("login.howItWorks")}
              </h3>
              <ul className="text-xs text-support-600 space-y-1">
                <li>• Your identity remains private and anonymous</li>
                <li>• Zero-knowledge proof verifies your authenticity</li>
                <li>• No personal data stored on blockchain</li>
                <li>• Cryptographic signatures ensure security</li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 text-center">
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {loginType === "citizen"
                    ? "Your identity is protected by zero-knowledge cryptography"
                    : "Government access is verified by email domain and blockchain"}
                </span>
              </p>
            </div>

            {/* Demo Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700 text-center">
                🚀 <strong>Hackathon Demo:</strong> Using testnet. For demo: use
                @demo.gov.my email
              </p>
            </div>

            {/* Help Links */}
            <div className="text-center text-sm space-y-1 pt-2">
              <a
                href="https://docs.sui.io/concepts/cryptography/zklogin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 block"
              >
                Learn more about ZKLogin →
              </a>
              <a
                href="#help"
                className="text-support-600 hover:text-support-700"
              >
                Need help? Contact support
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-support-500">
          <p>
            Built with Sui ZKLogin • Malaysian Government Design System •
            Blockchain for Good
          </p>
          <p className="mt-1">© 2025 TransparensiMY - Hackathon Demo</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
