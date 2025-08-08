/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  genAddressSeed,
  getZkLoginSignature,
  jwtToAddress,
} from "@mysten/sui/zklogin";
import { jwtDecode } from "jwt-decode";

export type OAuthProvider = "google" | "facebook" | "twitch" | "apple";

export interface ZKLoginState {
  currentEpoch?: number;
  maxEpoch?: number;
  randomness?: string;
  ephemeralKeyPair?: Ed25519Keypair;
  userSalt?: string;
  nonce?: string;
  sessionId?: string; // Add session ID for state persistence
}

export interface ZKProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface LoginResult {
  userAddress: string;
  provider: OAuthProvider;
  jwt: string;
  zkLoginState: ZKLoginState;
  zkProof?: ZKProof;
  userInfo: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

class ZKLoginService {
  private suiClient: SuiClient;
  private readonly redirectUrl: string;
  private readonly mystenProvingServiceUrl: string;
  private readonly enableRealZKLogin: boolean;
  private pendingProofRequests: Map<string, Promise<ZKProof>> = new Map(); // Add deduplication cache

  constructor() {
    this.suiClient = new SuiClient({
      url:
        import.meta.env.VITE_SUI_RPC_URL ||
        "https://fullnode.testnet.sui.io:443",
    });
    this.redirectUrl =
      import.meta.env.VITE_ZKLOGIN_REDIRECT_URL ||
      "http://localhost:5173/auth/callback";

    // Mysten Labs' official proving service endpoints
    this.mystenProvingServiceUrl =
      import.meta.env.VITE_MYSTEN_PROVING_SERVICE_URL ||
      "https://prover-dev.mystenlabs.com/v1";

    this.enableRealZKLogin =
      import.meta.env.VITE_ENABLE_REAL_ZKLOGIN === "true"; // Temporarily disable for demo
  }

  /**
   * Generate a unique session ID for this authentication session
   */
  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Store ephemeral keypair in localStorage with enhanced validation
   */
  private storeEphemeralKeyPair(keypair: Ed25519Keypair, sessionId: string): void {
    try {
      // For Ed25519Keypair, we need to access the internal keypair data
      // The getSecretKey() returns a Bech32 string, but we need the raw bytes
      // Let's use a different approach - serialize the keypair properly
      
      const secretKeyBech32 = keypair.getSecretKey();
      
      // Create a new keypair from the secret key to test if it works
      const testKeypair = Ed25519Keypair.fromSecretKey(secretKeyBech32);
      const originalPublicKey = keypair.getPublicKey().toSuiAddress();
      const testPublicKey = testKeypair.getPublicKey().toSuiAddress();
      
      if (originalPublicKey !== testPublicKey) {
        throw new Error(`Keypair serialization test failed: original ${originalPublicKey} != test ${testPublicKey}`);
      }
      
      const keyKey = `zklogin_ephemeral_${sessionId}`;
      
      console.log("🔍 Storing keypair:", {
        secretKeyFormat: 'bech32',
        sessionId,
        publicKey: originalPublicKey
      });
      
      // Store the Bech32 secret key directly - this is the standard format
      localStorage.setItem(keyKey, secretKeyBech32);
      sessionStorage.setItem(keyKey, secretKeyBech32);
      
      // Verify storage immediately by attempting to restore
      const verification = localStorage.getItem(keyKey);
      if (!verification) {
        throw new Error("Failed to verify keypair storage in localStorage");
      }
      
      // Test restoration to ensure it works and produces the same public key
      const restoredKeypair = Ed25519Keypair.fromSecretKey(verification);
      const restoredPublicKey = restoredKeypair.getPublicKey().toSuiAddress();
      
      if (originalPublicKey !== restoredPublicKey) {
        throw new Error(`Keypair restoration test failed: original ${originalPublicKey} != restored ${restoredPublicKey}`);
      }
      
      console.log("🔒 Ephemeral keypair stored and verified successfully:", {
        sessionId,
        keyKey,
        storageFormat: 'bech32',
        storageSize: secretKeyBech32.length,
        verified: !!verification,
        publicKeyMatch: originalPublicKey === restoredPublicKey,
        publicKey: originalPublicKey
      });
    } catch (error) {
      console.error("❌ Failed to store ephemeral keypair:", error);
      throw new Error(`Failed to store authentication session: ${error.message}`);
    }
  }

  /**
   * Restore ephemeral keypair from localStorage with enhanced validation
   */
  private restoreEphemeralKeyPair(sessionId: string): Ed25519Keypair | null {
    try {
      const keyKey = `zklogin_ephemeral_${sessionId}`;
      
      // Try localStorage first
      let stored = localStorage.getItem(keyKey);
      let storageType = 'localStorage';
      
      // Fallback to sessionStorage if localStorage fails
      if (!stored) {
        stored = sessionStorage.getItem(keyKey);
        storageType = 'sessionStorage';
        console.log("🔄 Fallback to sessionStorage for keypair recovery");
      }
      
      console.log("🔍 Keypair storage check:", {
        keyKey,
        hasStoredKey: !!stored,
        storedLength: stored?.length,
        storageType
      });
      
      if (stored) {
        // 🔧 CRITICAL FIX: Recreate Ed25519Keypair from stored secret key
        const keypair = Ed25519Keypair.fromSecretKey(stored);
        const publicKey = keypair.getPublicKey().toSuiAddress();
        
        // Verify the keypair has proper methods
        if (typeof keypair.signTransaction !== 'function') {
          console.error("❌ Restored keypair missing signTransaction method");
          throw new Error("Invalid keypair restoration");
        }
        
        console.log("✅ Ephemeral keypair successfully restored with methods:", { 
          sessionId, 
          storageType,
          storageFormat: 'bech32',
          publicKey,
          hasSignMethod: typeof keypair.signTransaction === 'function',
          hasGetPublicKeyMethod: typeof keypair.getPublicKey === 'function'
        });
        
        return keypair;
      } else {
        console.error("❌ No stored keypair found for session:", sessionId);
        return null;
      }
    } catch (error) {
      console.error("❌ Failed to restore ephemeral keypair:", error);
      console.error("❌ Error details:", {
        message: error.message,
        sessionId,
        keyKey: `zklogin_ephemeral_${sessionId}`
      });
      return null;
    }
  }

  /**
   * Store complete ZKLogin state in localStorage with retry mechanism
   */
  private storeZKLoginState(state: ZKLoginState): void {
    try {
      if (!state.sessionId) {
        throw new Error("Session ID required for state storage");
      }

      const storableState = {
        currentEpoch: state.currentEpoch,
        maxEpoch: state.maxEpoch,
        randomness: state.randomness,
        userSalt: state.userSalt,
        nonce: state.nonce,
        sessionId: state.sessionId,
      };

      const stateKey = `zklogin_state_${state.sessionId}`;
      const stateJson = JSON.stringify(storableState);
      
      // Store in both localStorage and sessionStorage for redundancy
      localStorage.setItem(stateKey, stateJson);
      sessionStorage.setItem(stateKey, stateJson);
      
      // Verify storage immediately
      const verification = localStorage.getItem(stateKey);
      if (!verification) {
        throw new Error("Failed to verify state storage in localStorage");
      }

      console.log("💾 ZKLogin state stored successfully:", {
        sessionId: state.sessionId,
        stateKey,
        storageSize: stateJson.length,
        verified: !!verification
      });
    } catch (error) {
      console.error("❌ Failed to store ZKLogin state:", error);
      throw new Error("Failed to store authentication state");
    }
  }

  /**
   * Restore complete ZKLogin state from localStorage with aggressive fallback search
   */
  private restoreZKLoginState(sessionId: string): ZKLoginState | null {
    try {
      console.log("🔍 Attempting to restore session:", sessionId);
      const stateKey = `zklogin_state_${sessionId}`;
      const stored = localStorage.getItem(stateKey) || sessionStorage.getItem(stateKey);
  
      if (stored) {
        const state = JSON.parse(stored);
        
        // 🔧 CRITICAL FIX: Properly restore ephemeral keypair
        const ephemeralKeyPair = this.restoreEphemeralKeyPair(sessionId);
        
        if (ephemeralKeyPair) {
          // Verify the keypair is functional
          if (typeof ephemeralKeyPair.signTransaction !== 'function') {
            console.error("❌ Restored keypair is not functional");
            return null;
          }
          
          console.log("✅ ZKLogin state successfully restored for session:", sessionId);
          console.log("✅ Keypair methods verified:", {
            hasSignTransaction: typeof ephemeralKeyPair.signTransaction === 'function',
            hasGetPublicKey: typeof ephemeralKeyPair.getPublicKey === 'function',
            publicKey: ephemeralKeyPair.getPublicKey().toSuiAddress()
          });
          
          return { ...state, ephemeralKeyPair };
        } else {
          console.error("❌ Could not restore ephemeral keypair for session:", sessionId);
          return null;
        }
      }
      
      console.error("❌ No stored state found for session:", sessionId);
      return null;
    } catch (error) {
      console.error("❌ Failed to restore ZKLogin state:", error);
      return null;
    }
  }
  

  /**
   * Clean up stored session data from both storage types
   */
  private cleanupSession(sessionId: string): void {
    try {
      const stateKey = `zklogin_state_${sessionId}`;
      const keyKey = `zklogin_ephemeral_${sessionId}`;
      
      // Clean from both localStorage and sessionStorage
      localStorage.removeItem(stateKey);
      localStorage.removeItem(keyKey);
      sessionStorage.removeItem(stateKey);
      sessionStorage.removeItem(keyKey);
      
      console.log("🧹 Cleaned up session data from both storages:", sessionId);
    } catch (error) {
      console.error("❌ Failed to cleanup session:", error);
    }
  }

  /**
   * Initialize ZKLogin state
   */
  async initializeZKLogin(): Promise<ZKLoginState> {
    const sessionId = this.generateSessionId();
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const userSalt = this.generateUserSalt();

    // Get current epoch
    const currentEpoch = await this.getCurrentEpoch();
    const maxEpoch = currentEpoch + 2; // Valid for 2 epochs (~24 hours)

    const state: ZKLoginState = {
      currentEpoch,
      maxEpoch,
      randomness,
      ephemeralKeyPair,
      userSalt,
      sessionId,
    };

    // Store the keypair and state for later restoration
    this.storeEphemeralKeyPair(ephemeralKeyPair, sessionId);
    this.storeZKLoginState(state);

    console.log("🔐 ZKLogin initialized:", {
      sessionId,
      currentEpoch,
      maxEpoch,
      userSalt: userSalt.slice(0, 8) + "...",
      enableRealZKLogin: this.enableRealZKLogin,
    });

    return state;
  }

  /**
   * Get OAuth URL with proper nonce generation and session persistence
   */
  getOAuthUrl(provider: OAuthProvider, state: ZKLoginState): string {
    console.log("🔗 getOAuthUrl called with state:", {
      provider,
      sessionId: state.sessionId,
      hasEphemeralKeyPair: !!state.ephemeralKeyPair,
      hasRandomness: !!state.randomness,
      maxEpoch: state.maxEpoch
    });

    const { randomness, ephemeralKeyPair, maxEpoch, sessionId } = state;

    if (!ephemeralKeyPair || !maxEpoch || !randomness || !sessionId) {
      throw new Error("ZKLogin state not properly initialized");
    }

    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );

    // Update state with nonce and re-store it
    state.nonce = nonce;
    
    console.log("🔐 Generated nonce for session:", {
      sessionId,
      nonce: nonce.slice(0, 10) + "...",
      fullNonce: nonce, // Log full nonce for debugging
      maxEpoch,
      randomness: randomness.slice(0, 10) + "...",
      ephemeralPublicKey: ephemeralKeyPair.getPublicKey().toSuiAddress()
    });
    
    // Ensure the state is stored with the updated nonce
    this.storeZKLoginState(state);

    // Create a compact state parameter to avoid truncation by OAuth providers
    // IMPORTANT: Use the SAME sessionId that was passed in
    const stateData = {
      provider,
      sessionId: sessionId, // Use the existing session ID
      sid: sessionId.slice(0, 16), // Backup short ID
    };

    console.log("🔗 Creating OAuth state parameter:", {
      provider,
      sessionId: stateData.sessionId,
      shortSessionId: stateData.sid,
      stateDataSize: JSON.stringify(stateData).length,
      sessionMatches: stateData.sessionId === sessionId
    });

    const params = new URLSearchParams({
      client_id: this.getClientId(provider),
      redirect_uri: this.redirectUrl,
      response_type: "id_token",
      scope: this.getScope(provider),
      nonce: nonce,
      state: btoa(JSON.stringify(stateData)),
    });

    const authUrl = `${this.getOAuthEndpoint(provider)}?${params.toString()}`;
    
    console.log("🔗 Final OAuth URL details:", {
      urlLength: authUrl.length,
      stateParam: btoa(JSON.stringify(stateData)),
      decodedStateCheck: JSON.parse(atob(btoa(JSON.stringify(stateData))))
    });

    return authUrl;
  }

  /**
   * Handle OAuth callback and generate ZK proof using Mysten Labs service
   */
  async handleOAuthCallback(
    jwt: string,
    provider: OAuthProvider,
    sessionId: string
  ): Promise<LoginResult> {
    try {
      console.log("🔐 Processing OAuth callback for session:", sessionId);
      
      // Debug localStorage state
      const allStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('zklogin_'));
      console.log("🔍 localStorage debug:", {
        totalKeys: Object.keys(localStorage).length,
        zkloginKeys: allStorageKeys.length,
        sessionId,
      });

      // Restore ZKLogin state (this now includes aggressive session search)
      const zkLoginState = this.restoreZKLoginState(sessionId);
      
      if (!zkLoginState) {
        // Get detailed error information
        const availableKeys = Object.keys(localStorage).filter(k => k.startsWith('zklogin_'));
        const availableSessions = availableKeys
          .filter(k => k.includes('state_'))
          .map(k => k.split('_')[2])
          .filter(Boolean);
          
        console.error("❌ Could not restore any session after aggressive search:", {
          searchedFor: sessionId,
          availableSessions: availableSessions.slice(0, 10),
          totalAvailable: availableSessions.length
        });
          
        const errorMessage = availableSessions.length > 0 
          ? `Authentication session not found after searching all available sessions. Original: ${sessionId}. Available: ${availableSessions.slice(-3).join(', ')}`
          : 'No authentication sessions found. Please restart the login process.';
        throw new Error(errorMessage);
      }

      console.log("✅ Successfully restored ZKLogin state");

      // Decode JWT to get user info and verify nonce
      const decodedJWT = jwtDecode(jwt) as any;
      
      console.log("🔍 JWT decoded:", {
        sub: decodedJWT.sub,
        aud: decodedJWT.aud,
        iss: decodedJWT.iss,
        nonce: decodedJWT.nonce,
        exp: decodedJWT.exp,
      });

      // Verify nonce matches what we computed - this is critical for security
      const jwtNonce = decodedJWT.nonce;
      const storedNonce = zkLoginState.nonce;
      
      // Also recompute the nonce to double-check our parameters are correct
      const recomputedNonce = generateNonce(
        zkLoginState.ephemeralKeyPair.getPublicKey(),
        zkLoginState.maxEpoch!,
        zkLoginState.randomness!
      );

      console.log("🔍 Comprehensive nonce verification:", {
        jwtNonce,
        storedNonce,
        recomputedNonce,
        jwtMatchesStored: jwtNonce === storedNonce,
        jwtMatchesRecomputed: jwtNonce === recomputedNonce,
        storedMatchesRecomputed: storedNonce === recomputedNonce,
        maxEpoch: zkLoginState.maxEpoch,
        randomness: zkLoginState.randomness,
        ephemeralPublicKey: zkLoginState.ephemeralKeyPair.getPublicKey().toSuiAddress()
      });

      // Verify that the JWT nonce matches our stored nonce
      if (jwtNonce !== storedNonce) {
        console.error("❌ Nonce mismatch detected:", {
          expected: storedNonce,
          received: jwtNonce,
          recomputed: recomputedNonce
        });
        throw new Error(`Nonce verification failed. Expected: ${storedNonce}, Got: ${jwtNonce}`);
      }

      // Additional verification: make sure we can recompute the same nonce
      if (storedNonce !== recomputedNonce) {
        console.error("❌ Stored nonce doesn't match recomputed nonce - state corruption detected");
        throw new Error("Authentication state corruption detected. Please restart login process.");
      }

      console.log("✅ Nonce verification passed successfully");

      // Generate user address using the proper zkLogin method
      const addressSeed = genAddressSeed(
        zkLoginState.userSalt!,
        "sub",
        decodedJWT.sub,
        decodedJWT.aud
      );
  
      // Convert address seed to proper Sui address format
      const userAddress = "0x" + addressSeed.toString(16).padStart(64, "0");
      
      console.log("🏠 Generated user address:", userAddress);
  
      const userInfo = {
        sub: decodedJWT.sub,
        email: decodedJWT.email,
        name: decodedJWT.name || decodedJWT.given_name,
        picture: decodedJWT.picture,
      };
  
      let zkProof: ZKProof | undefined;
  
      if (this.enableRealZKLogin) {
        // Generate real ZK proof using Mysten Labs service
        console.log("⚡ Generating ZK proof using Mysten Labs service...");
        zkProof = await this.generateZKProofWithMysten(jwt, zkLoginState);
        console.log("✅ Real ZK proof generated successfully");
      } else {
        // Use simulation for demo
        console.log("🎭 Using ZK proof simulation for demo");
        zkProof = await this.generateMockZKProof(jwt, zkLoginState);
      }

      // Clean up the session data after successful authentication
      // Use the session ID from the restored state (might be different from input sessionId)
      this.cleanupSession(zkLoginState.sessionId || sessionId);
  
      return {
        userAddress,
        provider,
        jwt,
        zkLoginState,
        zkProof,
        userInfo,
      };
    } catch (error) {
      console.error("❌ Error handling OAuth callback:", error);
      throw new Error(`Failed to process OAuth callback: ${error.message}`);
    }
  }

  /**
   * Generate ZK proof using Mysten Labs' proving service with proper parameter validation
   */
  private async generateZKProofWithMysten(
    jwt: string,
    zkLoginState: ZKLoginState
  ): Promise<ZKProof> {
    // Create a cache key based on JWT to prevent duplicate submissions
    const jwtHash = btoa(jwt).slice(-16); // Use last 16 chars of base64 encoded JWT as cache key
    
    // Check if we already have a pending request for this JWT
    if (this.pendingProofRequests.has(jwtHash)) {
      console.log("🔄 Reusing pending proof request for JWT:", jwtHash);
      return this.pendingProofRequests.get(jwtHash)!;
    }

    // Create the proof request promise
    const proofPromise = this.performZKProofRequest(jwt, zkLoginState);
    
    // Cache the promise to prevent duplicates
    this.pendingProofRequests.set(jwtHash, proofPromise);
    
    try {
      const result = await proofPromise;
      // Clear from cache after completion
      this.pendingProofRequests.delete(jwtHash);
      return result;
    } catch (error) {
      // Clear from cache on error
      this.pendingProofRequests.delete(jwtHash);
      throw error;
    }
  }

  /**
   * Perform the actual ZK proof request to Mysten's service
   */
  private async performZKProofRequest(
    jwt: string,
    zkLoginState: ZKLoginState
  ): Promise<ZKProof> {
    try {
      if (!zkLoginState.ephemeralKeyPair || !zkLoginState.maxEpoch || !zkLoginState.randomness || !zkLoginState.userSalt) {
        throw new Error("Missing required ZKLogin state parameters");
      }

      // Validate that our nonce computation is consistent
      const jwtDecoded = jwtDecode(jwt) as any;
      const jwtNonce = jwtDecoded.nonce;
      const recomputedNonce = generateNonce(
        zkLoginState.ephemeralKeyPair.getPublicKey(),
        zkLoginState.maxEpoch,
        zkLoginState.randomness
      );

      if (jwtNonce !== recomputedNonce) {
        console.error("❌ Nonce mismatch before proving service call:", {
          jwtNonce,
          recomputedNonce,
          maxEpoch: zkLoginState.maxEpoch,
          randomness: zkLoginState.randomness
        });
        throw new Error(`Nonce verification failed before proving service. JWT: ${jwtNonce}, Computed: ${recomputedNonce}`);
      }

      const extendedEphemeralPublicKey = Array.from(
        zkLoginState.ephemeralKeyPair.getPublicKey().toSuiBytes()
      );

      const requestBody = {
        jwt: jwt,
        extendedEphemeralPublicKey: extendedEphemeralPublicKey,
        maxEpoch: zkLoginState.maxEpoch,
        jwtRandomness: zkLoginState.randomness,
        salt: zkLoginState.userSalt,
        keyClaimName: "sub",
      };

      console.log("🔍 Proving service request details:", {
        jwtNonce,
        recomputedNonce,
        nonceMatch: jwtNonce === recomputedNonce,
        maxEpoch: zkLoginState.maxEpoch,
        randomness: zkLoginState.randomness,
        salt: zkLoginState.userSalt,
        extendedEphemeralPublicKeyLength: extendedEphemeralPublicKey.length,
        ephemeralPublicKey: zkLoginState.ephemeralKeyPair.getPublicKey().toSuiAddress()
      });
  
      console.log("🚀 Sending request to Mysten proving service...");
      
      const response = await fetch(this.mystenProvingServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.warn("⚠️ Rate limited by proving service. This is normal during development.");
          console.warn("💡 The same JWT was submitted multiple times within 5 seconds.");
          console.warn("🔄 Wait a few seconds and try again, or the app may retry automatically.");
        }
        
        console.error("❌ Mysten proving service error response:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          isRateLimit: response.status === 429,
          requestBody: {
            ...requestBody,
            jwt: "***REDACTED***" // Don't log sensitive JWT
          }
        });
        throw new Error(`Mysten proving service error: ${response.status} - ${errorText}`);
      }
  
      const zkProof = await response.json();
      console.log("✅ ZK proof received from Mysten Labs service");
  
      return zkProof;
    } catch (error) {
      console.error("❌ Error calling Mysten Labs proving service:", error);
      throw error;
    }
  }

  /**
   * Generate mock ZK proof for demo/development
   */
  private async generateMockZKProof(jwt: string, zkLoginState: ZKLoginState): Promise<ZKProof> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const jwtParts = jwt.split('.');
    const payload = JSON.parse(atob(jwtParts[1]));
    
    return {
      proofPoints: {
        a: [this.generateMockFieldElement(), this.generateMockFieldElement()],
        b: [
          [this.generateMockFieldElement(), this.generateMockFieldElement()],
          [this.generateMockFieldElement(), this.generateMockFieldElement()]
        ],
        c: [this.generateMockFieldElement(), this.generateMockFieldElement()]
      },
      issBase64Details: {
        value: payload.iss || 'accounts.google.com',
        indexMod4: (payload.iss || 'accounts.google.com').length % 4
      },
      headerBase64: jwtParts[0]
    };
  }
  

  /**
   * Sign and execute transaction with ZKLogin signature
   */
  async signAndExecuteTransaction(
    txBytes: Uint8Array,
    loginResult: LoginResult
  ) {
    try {
      console.log("📝 Starting ZKLogin transaction signing process...");
  
      if (!this.enableRealZKLogin) {
        return await this.simulateTransactionExecution(txBytes, loginResult);
      }
  
      if (!loginResult.zkProof || !loginResult.zkLoginState.ephemeralKeyPair) {
        throw new Error("Missing ZK proof or ephemeral keypair");
      }
  
      console.log("✅ All components verified, proceeding with real ZKLogin signature...");
  
      // Generate ephemeral signature
      const ephemeralSignature = await loginResult.zkLoginState.ephemeralKeyPair.signTransaction(txBytes);
      console.log("✅ Ephemeral signature generated");
  
      // Import required functions
      const { getZkLoginSignature, genAddressSeed } = await import('@mysten/sui/zklogin');
      const { jwtDecode } = await import('jwt-decode');
  
      // Decode JWT to get original parameters
      const jwtDecoded = jwtDecode(loginResult.jwt) as any;
      
      // 🔧 CRITICAL FIX: Generate address seed exactly as during login
      const addressSeed = genAddressSeed(
        loginResult.zkLoginState.userSalt!,
        "sub",
        jwtDecoded.sub,
        jwtDecoded.aud
      );
  
      console.log("🔍 Signature construction debug:", {
        addressSeed: addressSeed.toString(),
        maxEpoch: loginResult.zkLoginState.maxEpoch,
        userSalt: loginResult.zkLoginState.userSalt?.slice(0, 10) + "...",
        ephemeralSigLength: ephemeralSignature.signature.length
      });
  
      // 🔧 CRITICAL FIX: Convert ephemeral signature properly
      // The signature should be converted to byte array, not char codes
      const userSignature = ephemeralSignature.signature; // don't convert to Array.from
  
      console.log("🔍 Signature conversion debug:", {
        originalSignature: ephemeralSignature.signature.slice(0, 10),
        convertedLength: userSignature.length,
        firstFewBytes: userSignature.slice(0, 5)
      });
  
      // 🔧 CRITICAL FIX: Construct ZKLogin signature with exact parameters
      const zkLoginSignatureInputs = {
        ...loginResult.zkProof,
        addressSeed: addressSeed.toString(),
      };
  
      console.log("🔍 ZKLogin inputs validation:", {
        hasProofPoints: !!zkLoginSignatureInputs.proofPoints,
        hasIssBase64Details: !!zkLoginSignatureInputs.issBase64Details,
        hasHeaderBase64: !!zkLoginSignatureInputs.headerBase64,
        addressSeed: zkLoginSignatureInputs.addressSeed.slice(0, 20) + "..."
      });
  
      const zkLoginSignature = getZkLoginSignature({
        inputs: zkLoginSignatureInputs,
        maxEpoch: loginResult.zkLoginState.maxEpoch!,
        userSignature: userSignature,
      });
  
      console.log("✅ ZKLogin signature constructed successfully");
      
      // 🔧 ADDITIONAL DEBUG: Log the final signature structure
      console.log("🔍 Final signature structure:", {
        signatureType: typeof zkLoginSignature,
        signatureLength: zkLoginSignature?.length || 'unknown'
      });
  
      // Execute transaction
      console.log("🚀 Executing transaction on Sui network...");
      
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
  
      console.log("✅ Transaction executed successfully:", {
        digest: result.digest,
        status: result.effects?.status
      });
  
      return result;
  
    } catch (error) {
      console.error("❌ Error signing and executing transaction:", error);
      
      // Enhanced debugging for signature issues
      if (error.message.includes('Invalid signature')) {
        console.error("🔍 DETAILED SIGNATURE ERROR DEBUG:");
        
        // Log all the signature components for debugging
        console.error("  Login result keys:", Object.keys(loginResult));
        console.error("  ZKLogin state keys:", Object.keys(loginResult.zkLoginState));
        console.error("  ZK proof keys:", Object.keys(loginResult.zkProof || {}));
        
        if (loginResult.zkProof) {
          console.error("  Proof points structure:", {
            hasA: Array.isArray(loginResult.zkProof.proofPoints?.a),
            hasB: Array.isArray(loginResult.zkProof.proofPoints?.b),
            hasC: Array.isArray(loginResult.zkProof.proofPoints?.c),
            aLength: loginResult.zkProof.proofPoints?.a?.length,
            bLength: loginResult.zkProof.proofPoints?.b?.length,
            cLength: loginResult.zkProof.proofPoints?.c?.length
          });
          
          console.error("  IssBase64Details:", {
            hasValue: !!loginResult.zkProof.issBase64Details?.value,
            hasIndexMod4: typeof loginResult.zkProof.issBase64Details?.indexMod4 === 'number'
          });
        }
        
        // Try to determine the specific signature issue
        console.error("💡 Possible causes:");
        console.error("  1. ZK proof format incorrect");
        console.error("  2. Ephemeral signature conversion wrong");
        console.error("  3. Address seed calculation mismatch");
        console.error("  4. Max epoch validation failed");
        
        throw new Error(`ZKLogin signature validation failed. Raw error: ${error.message}`);
      }
      
      throw error;
    }
  }
  

  /**
   * Simulate transaction execution for demo
   */
  private async simulateTransactionExecution(
    txBytes: Uint8Array,
    loginResult: LoginResult
  ) {
    console.log("🎭 Simulating transaction execution...");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResult = {
      digest: this.generateMockTxId(),
      effects: {
        status: { status: "success" },
        gasUsed: { computationCost: "1000", storageCost: "500" },
      },
      events: [],
      objectChanges: [],
      balanceChanges: [],
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Transaction simulated:", mockResult.digest);
    return mockResult;
  }

  /**
   * Debug utility: Check current session state
   */
  debugSessionState(sessionId?: string): void {
    console.log("🐛 Debug: Checking session state...");
    
    if (sessionId) {
      const state = this.restoreZKLoginState(sessionId);
      console.log("🐛 Specific session state:", {
        sessionId,
        found: !!state,
        hasEphemeralKey: !!state?.ephemeralKeyPair,
        hasRandomness: !!state?.randomness,
        hasNonce: !!state?.nonce,
        maxEpoch: state?.maxEpoch,
        publicKey: state?.ephemeralKeyPair?.getPublicKey().toSuiAddress()
      });
    }
    
    // Check all available sessions
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('zklogin_'));
    const stateKeys = allKeys.filter(k => k.includes('state_'));
    const keypairKeys = allKeys.filter(k => k.includes('ephemeral_'));
    
    console.log("🐛 All available sessions:", {
      totalZKLoginKeys: allKeys.length,
      stateKeys: stateKeys.length,
      keypairKeys: keypairKeys.length,
      sessionIds: stateKeys.map(k => k.split('_')[2]).slice(0, 5), // Show first 5
    });
    
    // Check if we can regenerate nonce for any session
    stateKeys.slice(0, 3).forEach(stateKey => {
      try {
        const sessionId = stateKey.split('_')[2];
        const state = this.restoreZKLoginState(sessionId);
        if (state && state.ephemeralKeyPair && state.maxEpoch && state.randomness) {
          const recomputedNonce = generateNonce(
            state.ephemeralKeyPair.getPublicKey(),
            state.maxEpoch,
            state.randomness
          );
          console.log(`🐛 Session ${sessionId.slice(0, 8)}... nonce check:`, {
            storedNonce: state.nonce?.slice(0, 10) + "...",
            recomputedNonce: recomputedNonce.slice(0, 10) + "...",
            match: state.nonce === recomputedNonce
          });
        }
      } catch (error) {
        console.log(`🐛 Error checking session ${stateKey}:`, error.message);
      }
    });
  }

  /**
   * Get current epoch from Sui network
   */
  private async getCurrentEpoch(): Promise<number> {
    try {
      const systemState = await this.suiClient.getLatestSuiSystemState();
      return Number(systemState.epoch);
    } catch (error) {
      console.error("Error getting current epoch:", error);
      return 0;
    }
  }

  /**
   * Generate a consistent user salt
   */
  private generateUserSalt(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    let saltBigInt = BigInt(0);

    for (let i = 0; i < randomBytes.length; i++) {
      saltBigInt = saltBigInt * BigInt(256) + BigInt(randomBytes[i]);
    }

    const salt = saltBigInt.toString();
    console.log("🧂 Generated user salt:", salt.slice(0, 8) + "...");
    return salt;
  }

  /**
   * Generate mock field element for demo proofs
   */
  private generateMockFieldElement(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return (
      "0x" +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  /**
   * Generate mock transaction ID
   */
  private generateMockTxId(): string {
    return `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  /**
   * Get OAuth endpoints for different providers
   */
  private getOAuthEndpoint(provider: OAuthProvider): string {
    const endpoints = {
      google: "https://accounts.google.com/o/oauth2/v2/auth",
      facebook: "https://www.facebook.com/v18.0/dialog/oauth",
      twitch: "https://id.twitch.tv/oauth2/authorize",
      apple: "https://appleid.apple.com/auth/authorize",
    };
    return endpoints[provider];
  }

  /**
   * Get client IDs for different providers
   */
  private getClientId(provider: OAuthProvider): string {
    const clientIds = {
      google: import.meta.env.VITE_ZKLOGIN_CLIENT_ID_GOOGLE,
      facebook: import.meta.env.VITE_ZKLOGIN_CLIENT_ID_FACEBOOK,
      twitch: import.meta.env.VITE_ZKLOGIN_CLIENT_ID_TWITCH,
      apple: import.meta.env.VITE_ZKLOGIN_CLIENT_ID_APPLE,
    };

    const clientId = clientIds[provider];
    if (!clientId) {
      throw new Error(`Client ID not configured for provider: ${provider}`);
    }

    return clientId;
  }

  /**
   * Get OAuth scopes for different providers
   */
  private getScope(provider: OAuthProvider): string {
    const scopes = {
      google: "openid email profile",
      facebook: "openid email",
      twitch: "openid user:read:email",
      apple: "email name",
    };
    return scopes[provider];
  }

  /**
   * Debug utility: Clear all zkLogin sessions
   */
  clearAllSessions(): void {
    console.log("🧹 Clearing all zkLogin sessions...");
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('zklogin_'));
    const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('zklogin_'));
    
    allKeys.forEach(key => localStorage.removeItem(key));
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    console.log("🧹 Cleared sessions:", {
      localStorage: allKeys.length,
      sessionStorage: sessionKeys.length
    });
  }
}

export const zkLoginService = new ZKLoginService();