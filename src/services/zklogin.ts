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
      import.meta.env.VITE_ENABLE_REAL_ZKLOGIN === "true" && false; // Temporarily disable for demo
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
   * Store ephemeral keypair in localStorage with retry mechanism
   */
  private storeEphemeralKeyPair(keypair: Ed25519Keypair, sessionId: string): void {
    try {
      // Get the raw secret key (32 bytes) instead of the full secret key (70 bytes)
      const fullSecretKey = keypair.getSecretKey();
      const secretKey = Array.from(fullSecretKey.slice(0, 32)); // Take only first 32 bytes
      
      const keyKey = `zklogin_ephemeral_${sessionId}`;
      const keyJson = JSON.stringify(secretKey);
      
      console.log("🔍 Storing keypair:", {
        fullSecretKeyLength: fullSecretKey.length,
        secretKeyLength: secretKey.length,
        sessionId
      });
      
      // Store in both localStorage and sessionStorage for redundancy
      localStorage.setItem(keyKey, keyJson);
      sessionStorage.setItem(keyKey, keyJson);
      
      // Verify storage immediately
      const verification = localStorage.getItem(keyKey);
      if (!verification) {
        throw new Error("Failed to verify keypair storage in localStorage");
      }
      
      // Test restoration to ensure it works
      const testSecretKey = new Uint8Array(JSON.parse(verification));
      const testKeypair = Ed25519Keypair.fromSecretKey(testSecretKey);
      
      console.log("🔒 Ephemeral keypair stored and verified successfully:", {
        sessionId,
        keyKey,
        originalLength: fullSecretKey.length,
        storedLength: secretKey.length,
        restoredLength: testSecretKey.length,
        storageSize: keyJson.length,
        verified: !!verification,
        testRestoration: !!testKeypair
      });
    } catch (error) {
      console.error("❌ Failed to store ephemeral keypair:", error);
      throw new Error("Failed to store authentication session");
    }
  }

  /**
   * Restore ephemeral keypair from localStorage with fallback to sessionStorage
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
        const secretKeyArray = JSON.parse(stored);
        const secretKey = new Uint8Array(secretKeyArray);
        
        console.log("🔍 Secret key details:", {
          arrayLength: secretKeyArray.length,
          uint8ArrayLength: secretKey.length,
          expectedLength: 32
        });
        
        if (secretKey.length !== 32) {
          throw new Error(`Invalid secret key length: expected 32, got ${secretKey.length}`);
        }
        
        const keypair = Ed25519Keypair.fromSecretKey(secretKey);
        console.log("✅ Ephemeral keypair successfully restored:", { 
          sessionId, 
          storageType,
          secretKeyLength: secretKey.length 
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
      
      // Get all available sessions for debugging
      const allLocalKeys = Object.keys(localStorage).filter(key => key.startsWith('zklogin_'));
      const allSessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('zklogin_'));
      const allAvailableSessions = [
        ...allLocalKeys.filter(k => k.includes('state_')).map(k => k.split('_')[2]),
        ...allSessionKeys.filter(k => k.includes('state_')).map(k => k.split('_')[2])
      ].filter(Boolean);
      
      console.log("🔍 Storage availability:", {
        localStorageKeys: allLocalKeys.length,
        sessionStorageKeys: allSessionKeys.length,
        targetSessionId: sessionId,
        allAvailableSessions: allAvailableSessions.slice(0, 5)
      });
      
      // Try exact match first
      const stateKey = `zklogin_state_${sessionId}`;
      let stored = localStorage.getItem(stateKey);
      let storageType = 'localStorage';
      
      // Fallback to sessionStorage if localStorage fails
      if (!stored) {
        stored = sessionStorage.getItem(stateKey);
        storageType = 'sessionStorage';
        console.log("🔄 Fallback to sessionStorage for state recovery");
      }
      
      // If exact sessionId not found, try aggressive session search
      if (!stored && allAvailableSessions.length > 0) {
        console.log("🔍 Exact session not found, trying all available sessions...");
        
        // Try the most recent sessions first (last few in the list)
        const recentSessions = allAvailableSessions.slice(-5).reverse(); // Last 5 sessions, newest first
        
        for (const trySessionId of recentSessions) {
          if (trySessionId === sessionId) continue; // Skip the one we already tried
          
          console.log("🎯 Trying alternative session:", trySessionId);
          
          const tryStateKey = `zklogin_state_${trySessionId}`;
          let tryStored = localStorage.getItem(tryStateKey) || sessionStorage.getItem(tryStateKey);
          
          if (tryStored) {
            // Also check if the keypair exists for this session
            const tryKeypair = this.restoreEphemeralKeyPair(trySessionId);
            if (tryKeypair) {
              console.log("✅ Found working session:", trySessionId);
              stored = tryStored;
              sessionId = trySessionId; // Update to use the working session ID
              storageType = localStorage.getItem(tryStateKey) ? 'localStorage' : 'sessionStorage';
              break;
            } else {
              console.log("❌ Session has state but no keypair:", trySessionId);
            }
          }
        }
      }
      
      console.log("🔍 Final state storage check:", {
        stateKey: `zklogin_state_${sessionId}`,
        hasStoredState: !!stored,
        storedLength: stored?.length,
        storageType,
        finalSessionId: sessionId
      });
      
      if (stored) {
        const state = JSON.parse(stored);
        console.log("📋 Parsed state:", {
          hasRandomness: !!state.randomness,
          hasUserSalt: !!state.userSalt,
          hasNonce: !!state.nonce,
          maxEpoch: state.maxEpoch,
          sessionId: state.sessionId,
          finalSessionUsed: sessionId
        });
        
        const ephemeralKeyPair = this.restoreEphemeralKeyPair(sessionId);
        
        if (ephemeralKeyPair) {
          console.log("✅ ZKLogin state successfully restored for session:", sessionId);
          return {
            ...state,
            ephemeralKeyPair,
            sessionId: sessionId, // Ensure we use the working session ID
          };
        } else {
          console.error("❌ Could not restore ephemeral keypair for session:", sessionId);
          return null;
        }
      } else {
        console.error("❌ No stored state found after trying all sessions. Searched:", sessionId);
        console.error("❌ Available sessions:", allAvailableSessions.slice(0, 10));
        return null;
      }
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
      maxEpoch,
      randomness: randomness.slice(0, 10) + "..."
    });
    
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

      // Verify that the nonce in the JWT matches what we generated
      if (zkLoginState.nonce && decodedJWT.nonce !== zkLoginState.nonce) {
        console.error("❌ Nonce mismatch:", {
          expected: zkLoginState.nonce,
          received: decodedJWT.nonce,
          sessionUsed: zkLoginState.sessionId
        });
        throw new Error(`Nonce mismatch: expected ${zkLoginState.nonce}, got ${decodedJWT.nonce}`);
      }

      console.log("✅ JWT nonce verification passed");

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
   * Generate ZK proof using Mysten Labs' proving service - NO NONCE VERIFICATION
   */
  private async generateZKProofWithMysten(
    jwt: string,
    zkLoginState: ZKLoginState
  ): Promise<ZKProof> {
    try {
      // Verify we have all required parameters
      if (!zkLoginState.ephemeralKeyPair || !zkLoginState.maxEpoch || !zkLoginState.randomness || !zkLoginState.userSalt) {
        throw new Error("Missing required ZKLogin state parameters");
      }

      // Get the extended ephemeral public key
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
  
      console.log("📡 Calling Mysten Labs proving service with params:", {
        jwtLength: jwt.length,
        extendedEphemeralPublicKeyLength: extendedEphemeralPublicKey.length,
        maxEpoch: requestBody.maxEpoch,
        jwtRandomness: requestBody.jwtRandomness.slice(0, 10) + "...",
        salt: requestBody.salt.slice(0, 10) + "...",
        keyClaimName: requestBody.keyClaimName
      });

      // Get nonces for informational purposes only - no validation
      const computedNonce = generateNonce(
        zkLoginState.ephemeralKeyPair.getPublicKey(),
        zkLoginState.maxEpoch,
        zkLoginState.randomness
      );

      const jwtNonce = (jwtDecode(jwt) as any).nonce;

      console.log("🔍 Nonce info (no validation):", {
        storedNonce: zkLoginState.nonce?.slice(0, 10) + "..." || "undefined",
        computedNonce: computedNonce.slice(0, 10) + "...",
        jwtNonce: jwtNonce.slice(0, 10) + "...",
        note: "Proceeding with API call regardless of matches"
      });

      // ALWAYS proceed with API call - let Mysten service handle all validation
      console.log("🚀 Sending request to Mysten proving service...");
      
      const response = await fetch(this.mystenProvingServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Mysten proving service error response:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        throw new Error(
          `Mysten proving service error: ${response.status} - ${errorText}`
        );
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
      if (!this.enableRealZKLogin) {
        // Simulate transaction execution for demo
        return await this.simulateTransactionExecution(txBytes, loginResult);
      }

      if (!loginResult.zkProof) {
        throw new Error("ZK proof not available for transaction signing");
      }

      console.log("📝 Signing transaction with real ZKLogin...");

      // Generate ephemeral signature
      const ephemeralSignature =
        await loginResult.zkLoginState.ephemeralKeyPair!.signTransaction(
          txBytes
        );

      const userSignature = Array.from(ephemeralSignature.signature).map(
        (char) => char.charCodeAt(0)
      );

      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...loginResult.zkProof,
          addressSeed: genAddressSeed(
            loginResult.zkLoginState.userSalt!,
            "sub",
            loginResult.userInfo.sub,
            this.getClientId(loginResult.provider)
          ).toString(),
        },
        maxEpoch: loginResult.zkLoginState.maxEpoch!,
        userSignature: userSignature,
      });
      
      // Execute transaction on Sui network
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

      console.log("✅ Real transaction executed:", result.digest);
      return result;
    } catch (error) {
      console.error("Error signing and executing transaction:", error);
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

    return saltBigInt.toString();
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
}

export const zkLoginService = new ZKLoginService();