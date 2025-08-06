/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { LoginResult } from './zklogin';

// Types for our application
export interface SpendingRecord {
  id?: string;
  department: string;
  projectName: string;
  allocatedAmount: number;
  spentAmount: number;
  date: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  description: string;
  contractor?: string;
  location: string;
  // Blockchain specific fields
  txHash?: string;
  submittedBy?: string;
  submittedAt?: string;
  verified?: boolean;
}

export interface CitizenFeedback {
  id?: string;
  projectId: string;
  message: string;
  rating: number;
  timestamp?: string;
  isAnonymous: boolean;
  // Blockchain specific fields
  txHash?: string;
  citizenAddress?: string;
  messageHash?: string;
  verified?: boolean;
}

export interface GovernmentDepartment {
  id: string;
  name: string;
  nameMs: string;
  ministry: string;
  totalBudget: number;
  spentAmount: number;
  activeProjects: number;
  contactEmail: string;
  website?: string;
}

export interface TransactionHistory {
  txId: string;
  type: 'spending_record' | 'citizen_feedback' | 'budget_allocation';
  timestamp: string;
  user: string;
  provider: string;
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed?: number;
  blockNumber?: number;
}

class SuiContractsService {
  private suiClient: SuiClient;
  private readonly packageId: string;
  private readonly enableRealBlockchain: boolean;
  
  constructor() {
    this.suiClient = new SuiClient({
      url: import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
    });
    this.packageId = import.meta.env.VITE_SUI_PACKAGE_ID || '';
    this.enableRealBlockchain = import.meta.env.VITE_ENABLE_REAL_BLOCKCHAIN === 'true';
  }

  /**
   * Submit spending record to blockchain (Government Admin only)
   */
  async submitSpendingRecord(
    record: SpendingRecord,
    loginResult: LoginResult
  ): Promise<string> {
    try {
      console.log('📝 Submitting spending record to blockchain...', {
        project: record.projectName,
        amount: record.allocatedAmount,
        user: loginResult.userAddress.slice(0, 8) + '...'
      });

      if (this.enableRealBlockchain) {
        return await this.submitRealSpendingRecord(record, loginResult);
      } else {
        return await this.simulateSpendingRecord(record, loginResult);
      }
    } catch (error) {
      console.error('Error submitting spending record:', error);
      throw new Error(`Failed to submit spending record: ${error.message}`);
    }
  }

  /**
   * Submit spending record to real Sui blockchain
   */
  private async submitRealSpendingRecord(
    record: SpendingRecord, 
    loginResult: LoginResult
  ): Promise<string> {
    const tx = new Transaction();
    
    // Create smart contract call
    tx.moveCall({
      target: `${this.packageId}::transparency::create_spending_record`,
      arguments: [
        tx.pure.string(record.department),
        tx.pure.string(record.projectName),
        tx.pure.u64(record.allocatedAmount),
        tx.pure.u64(record.spentAmount),
        tx.pure.string(record.date),
        tx.pure.u8(this.statusToNumber(record.status)),
        tx.pure.string(record.description),
        tx.pure.string(record.contractor || ''),
        tx.pure.string(record.location)
      ]
    });

    // Execute transaction using ZKLogin
    const result = await this.executeTransaction(tx, loginResult);
    
    // Store in local cache for UI performance
    await this.cacheSpendingRecord(record, result.digest, loginResult);
    
    return result.digest;
  }

  /**
   * Simulate spending record submission for demo
   */
  private async simulateSpendingRecord(
    record: SpendingRecord, 
    loginResult: LoginResult
  ): Promise<string> {
    // Simulate network delay
    await this.sleep(1500);
    
    const txId = this.generateMockTxId();
    const blockchainRecord: SpendingRecord = {
      ...record,
      id: txId,
      txHash: txId,
      submittedBy: loginResult.userAddress,
      submittedAt: new Date().toISOString(),
      verified: true
    };

    // Store in localStorage as "blockchain simulation"
    const existingRecords = this.getStoredRecords('spending_records');
    existingRecords.push(blockchainRecord);
    localStorage.setItem('spending_records', JSON.stringify(existingRecords));

    // Log transaction
    await this.logTransaction({
      txId,
      type: 'spending_record',
      timestamp: blockchainRecord.submittedAt!,
      user: loginResult.userAddress,
      provider: loginResult.provider,
      status: 'confirmed'
    });

    console.log('✅ Spending record submitted successfully:', {
      txId: txId.slice(0, 10) + '...',
      project: record.projectName,
      amount: `RM ${record.allocatedAmount.toLocaleString()}`
    });

    return txId;
  }

  /**
   * Submit citizen feedback (Anonymous via ZKLogin)
   */
  async submitCitizenFeedback(
    feedback: CitizenFeedback,
    loginResult: LoginResult
  ): Promise<string> {
    try {
      console.log('💬 Submitting citizen feedback...', {
        project: feedback.projectId,
        rating: feedback.rating,
        anonymous: feedback.isAnonymous,
        user: loginResult.userAddress.slice(0, 8) + '...'
      });

      if (this.enableRealBlockchain) {
        return await this.submitRealFeedback(feedback, loginResult);
      } else {
        return await this.simulateFeedback(feedback, loginResult);
      }
    } catch (error) {
      console.error('Error submitting citizen feedback:', error);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }

  /**
   * Submit feedback to real Sui blockchain
   */
  private async submitRealFeedback(
    feedback: CitizenFeedback, 
    loginResult: LoginResult
  ): Promise<string> {
    const tx = new Transaction();
    
    // Create anonymous feedback hash for privacy
    const feedbackHash = await this.createFeedbackHash(feedback.message);
    
    tx.moveCall({
      target: `${this.packageId}::transparency::submit_feedback`,
      arguments: [
        tx.pure.string(feedback.projectId),
        tx.pure.string(feedbackHash),
        tx.pure.u8(feedback.rating),
        tx.pure.bool(feedback.isAnonymous)
      ]
    });

    const result = await this.executeTransaction(tx, loginResult);
    
    // Cache feedback locally
    await this.cacheFeedback(feedback, result.digest, loginResult);
    
    return result.digest;
  }

  /**
   * Simulate feedback submission for demo
   */
  private async simulateFeedback(
    feedback: CitizenFeedback, 
    loginResult: LoginResult
  ): Promise<string> {
    await this.sleep(1000);
    
    const txId = this.generateMockTxId();
    const messageHash = await this.createFeedbackHash(feedback.message);
    
    const blockchainFeedback: CitizenFeedback = {
      ...feedback,
      id: txId,
      txHash: txId,
      citizenAddress: feedback.isAnonymous ? 'anonymous' : loginResult.userAddress,
      messageHash,
      timestamp: new Date().toISOString(),
      verified: true
    };

    const existingFeedback = this.getStoredRecords('citizen_feedback');
    existingFeedback.push(blockchainFeedback);
    localStorage.setItem('citizen_feedback', JSON.stringify(existingFeedback));

    await this.logTransaction({
      txId,
      type: 'citizen_feedback',
      timestamp: blockchainFeedback.timestamp!,
      user: feedback.isAnonymous ? 'anonymous' : loginResult.userAddress,
      provider: loginResult.provider,
      status: 'confirmed'
    });

    console.log('✅ Citizen feedback submitted successfully:', {
      txId: txId.slice(0, 10) + '...',
      anonymous: feedback.isAnonymous,
      rating: `${feedback.rating}/5 stars`
    });

    return txId;
  }

  /**
   * Get all spending records
   */
  async getSpendingRecords(): Promise<SpendingRecord[]> {
    try {
      if (this.enableRealBlockchain) {
        // Query blockchain for real records
        return await this.queryBlockchainRecords();
      } else {
        // Get from localStorage
        return this.getStoredRecords('spending_records');
      }
    } catch (error) {
      console.error('Error fetching spending records:', error);
      return [];
    }
  }

  /**
   * Get feedback for a specific project
   */
  async getProjectFeedback(projectId: string): Promise<CitizenFeedback[]> {
    try {
      const allFeedback = this.getStoredRecords('citizen_feedback');
      return allFeedback.filter((f: CitizenFeedback) => f.projectId === projectId);
    } catch (error) {
      console.error('Error fetching project feedback:', error);
      return [];
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactionHistory(userAddress: string): Promise<TransactionHistory[]> {
    try {
      const allTransactions = this.getStoredRecords('transaction_history');
      return allTransactions
        .filter((tx: TransactionHistory) => 
          tx.user === userAddress || tx.user === 'anonymous'
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get analytics data for dashboard
   */
  async getAnalytics(): Promise<{
    totalSpending: number;
    totalProjects: number;
    totalFeedback: number;
    spendingByDepartment: Array<{ department: string; amount: number; percentage: number }>;
    recentTransactions: TransactionHistory[];
  }> {
    try {
      const spendingRecords = await this.getSpendingRecords();
      const feedback = this.getStoredRecords('citizen_feedback');
      const transactions = this.getStoredRecords('transaction_history');

      const totalSpending = spendingRecords.reduce((sum, record) => sum + record.spentAmount, 0);
      const totalAllocated = spendingRecords.reduce((sum, record) => sum + record.allocatedAmount, 0);

      // Group spending by department
      const deptSpending = spendingRecords.reduce((acc, record) => {
        acc[record.department] = (acc[record.department] || 0) + record.spentAmount;
        return acc;
      }, {} as Record<string, number>);

      const spendingByDepartment = Object.entries(deptSpending).map(([dept, amount]) => ({
        department: dept,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
      }));

      return {
        totalSpending,
        totalProjects: spendingRecords.length,
        totalFeedback: feedback.length,
        spendingByDepartment,
        recentTransactions: transactions.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalSpending: 0,
        totalProjects: 0,
        totalFeedback: 0,
        spendingByDepartment: [],
        recentTransactions: []
      };
    }
  }

  /**
   * Verify user's government role (for admin access)
   */
  async verifyGovernmentRole(loginResult: LoginResult): Promise<boolean> {
    try {
      const email = loginResult.userInfo.email;
      
      if (!email) {
        console.error("❌ No email available for government role verification");
        return false;
      }
  
      console.log("🔍 Verifying government role for:", {
        email: email,
        userAddress: loginResult.userAddress,
        provider: loginResult.provider
      });
  
      // First: Email domain verification
      const allowedGovDomains = [
        'gov.my',
        'digital.gov.my',
        'mosti.gov.my',
        'treasury.gov.my',
        'mof.gov.my',
        'pmo.gov.my',
        'parlimen.gov.my',
        'finance.gov.my',
        'health.gov.my',
        'education.gov.my',
        'works.gov.my',
        'transport.gov.my',
        'foreign.gov.my',
        'defence.gov.my',
        'agriculture.gov.my',
        'rural.gov.my',
        'housing.gov.my',
        'youth.gov.my',
        'women.gov.my',
        'communications.gov.my',
        
        // State government domains (examples)
        'selangor.gov.my',
        'johor.gov.my',
        'penang.gov.my',
        'perak.gov.my',
        'kedah.gov.my',
        'kelantan.gov.my',
        'terengganu.gov.my',
        'pahang.gov.my',
        'negeri.gov.my',
        'melaka.gov.my',
        'sabah.gov.my',
        'sarawak.gov.my',
        'kl.gov.my',
        'putrajaya.gov.my',
        'labuan.gov.my',
        
        // For hackathon demo - test domains
        'demo.gov.my',
        'example.gov.my',
        'test.gov.my'
      ];
  
      const emailDomain = email.toLowerCase().split('@')[1];
      const hasValidDomain = allowedGovDomains.includes(emailDomain);
  
      console.log("📧 Email domain verification:", {
        email: email,
        domain: emailDomain,
        isValidGovDomain: hasValidDomain
      });
  
      if (!hasValidDomain) {
        console.error("❌ Invalid government email domain:", emailDomain);
        return false;
      }
  
      // Second: Check if this user is already registered as government official on blockchain
      // In a real implementation, you'd check a registry smart contract
      try {
        const isRegisteredOfficial = await this.checkGovernmentRegistration(loginResult.userAddress, emailDomain);
        
        if (isRegisteredOfficial) {
          console.log("✅ User verified as registered government official");
          return true;
        } else {
          // Auto-register new government users for demo purposes
          console.log("📝 Auto-registering new government user...");
          await this.registerGovernmentOfficial(loginResult.userAddress, emailDomain, email);
          return true;
        }
      } catch (blockchainError) {
        console.warn("⚠️ Blockchain verification failed, relying on email domain verification:", blockchainError);
        // Fallback to email domain verification only
        return hasValidDomain;
      }
  
    } catch (error) {
      console.error("❌ Error in government role verification:", error);
      return false;
    }
  }
  private async registerGovernmentOfficial(userAddress: string, domain: string, email: string): Promise<void> {
    try {
      if (!this.enableRealBlockchain) {
        console.log("🎭 Simulating government official registration...");
        
        // Simulate registration delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("✅ Government official registered (simulated):", {
          userAddress: userAddress,
          domain: domain,
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for privacy
        });
        
        return;
      }
  
      console.log("📝 Registering government official on blockchain...");
  
      // In a real implementation, this would create a transaction to register the official
      // Example transaction:
      /*
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.contractAddress}::government_registry::register_official`,
        arguments: [
          tx.pure(domain),
          tx.pure(email),
          // Additional verification data
        ]
      });
  
      const result = await this.signAndExecuteTransaction(tx, userAddress);
      console.log("✅ Government official registered on blockchain:", result.digest);
      */
      
      console.log("✅ Government official registration completed (demo mode)");
      
    } catch (error) {
      console.error("❌ Error registering government official:", error);
      throw new Error("Failed to register government official");
    }
  }
  private async checkGovernmentRegistration(userAddress: string, domain: string): Promise<boolean> {
    try {
      if (!this.enableRealBlockchain) {
        // Demo mode - simulate blockchain check
        console.log("🎭 Simulating government registration check...");
        
        // Simulate some users being pre-registered
        const preRegisteredAddresses = new Set([
          // Add some mock addresses for demo
        ]);
        
        const isPreRegistered = preRegisteredAddresses.has(userAddress);
        
        // For demo, consider all .gov.my domains as "registered"
        return domain.endsWith('.gov.my') || isPreRegistered;
      }
  
      // Real blockchain implementation
      console.log("🔗 Checking government registration on blockchain...");
      
      // This would query a smart contract that maintains a registry of government officials
      // Example contract call:
      /*
      const registryResponse = await this.suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.contractAddress}::government_registry::OfficialCertificate`
        }
      });
      
      return registryResponse.data.length > 0;
      */
      
      // For now, return true for demo
      return true;
      
    } catch (error) {
      console.error("❌ Error checking government registration:", error);
      return false;
    }
  }
  

  /**
   * Initialize demo data
   */
  initializeDemoData(): void {
    if (!localStorage.getItem('spending_records')) {
      const demoRecords: SpendingRecord[] = [
        {
          id: this.generateMockTxId(),
          department: 'Ministry of Health',
          projectName: 'Hospital Kuala Lumpur Renovation',
          allocatedAmount: 15000000,
          spentAmount: 8500000,
          date: '2024-01-15',
          status: 'ongoing',
          description: 'Renovation of emergency ward and equipment upgrade including new MRI machines and surgical equipment',
          contractor: 'ABC Construction Sdn Bhd',
          location: 'Kuala Lumpur',
          txHash: this.generateMockTxId(),
          submittedBy: '0x1234567890abcdef',
          submittedAt: '2024-01-15T08:00:00Z',
          verified: true
        },
        {
          id: this.generateMockTxId(),
          department: 'Ministry of Transport',
          projectName: 'MRT3 Circle Line Construction',
          allocatedAmount: 50000000,
          spentAmount: 12000000,
          date: '2024-02-01',
          status: 'ongoing',
          description: 'Construction of MRT3 Circle Line connecting major townships in Klang Valley',
          contractor: 'XYZ Infrastructure Sdn Bhd',
          location: 'Selangor & Kuala Lumpur',
          txHash: this.generateMockTxId(),
          submittedBy: '0x5678901234567890',
          submittedAt: '2024-02-01T09:30:00Z',
          verified: true
        },
        {
          id: this.generateMockTxId(),
          department: 'Ministry of Education',
          projectName: 'Rural School Digital Infrastructure',
          allocatedAmount: 8000000,
          spentAmount: 3200000,
          date: '2024-03-01',
          status: 'ongoing',
          description: 'Installing high-speed internet and computer labs in rural schools across Malaysia',
          contractor: 'Digital Education Solutions Sdn Bhd',
          location: 'Nationwide (Rural Areas)',
          txHash: this.generateMockTxId(),
          submittedBy: '0x9876543210fedcba',
          submittedAt: '2024-03-01T10:15:00Z',
          verified: true
        }
      ];
      
      localStorage.setItem('spending_records', JSON.stringify(demoRecords));
    }

    // Initialize empty arrays for other data types
    if (!localStorage.getItem('citizen_feedback')) {
      localStorage.setItem('citizen_feedback', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('transaction_history')) {
      localStorage.setItem('transaction_history', JSON.stringify([]));
    }

    console.log('📊 Demo data initialized');
  }

  // Helper methods
  private async executeTransaction(tx: Transaction, loginResult: LoginResult) {
    // This would use your ZKLogin service to sign and execute
    // For now, return a mock result
    return {
      digest: this.generateMockTxId(),
      effects: { status: 'success' }
    };
  }

  private async queryBlockchainRecords(): Promise<SpendingRecord[]> {
    // Query real blockchain records
    // Implementation would depend on your smart contract structure
    return [];
  }

  private async cacheSpendingRecord(record: SpendingRecord, txHash: string, loginResult: LoginResult) {
    const cachedRecord = {
      ...record,
      txHash,
      submittedBy: loginResult.userAddress,
      submittedAt: new Date().toISOString(),
      verified: true
    };
    
    const existing = this.getStoredRecords('spending_records');
    existing.push(cachedRecord);
    localStorage.setItem('spending_records', JSON.stringify(existing));
  }

  private async cacheFeedback(feedback: CitizenFeedback, txHash: string, loginResult: LoginResult) {
    const cachedFeedback = {
      ...feedback,
      txHash,
      citizenAddress: feedback.isAnonymous ? 'anonymous' : loginResult.userAddress,
      timestamp: new Date().toISOString(),
      verified: true
    };
    
    const existing = this.getStoredRecords('citizen_feedback');
    existing.push(cachedFeedback);
    localStorage.setItem('citizen_feedback', JSON.stringify(existing));
  }

  private async logTransaction(transaction: TransactionHistory) {
    const existing = this.getStoredRecords('transaction_history');
    existing.unshift(transaction); // Add to beginning
    localStorage.setItem('transaction_history', JSON.stringify(existing));
  }

  private getStoredRecords(key: string): any[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  private async createFeedbackHash(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private statusToNumber(status: SpendingRecord['status']): number {
    const statusMap = { planned: 0, ongoing: 1, completed: 2, cancelled: 3 };
    return statusMap[status] || 0;
  }

  private generateMockTxId(): string {
    return `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const suiContractsService = new SuiContractsService();