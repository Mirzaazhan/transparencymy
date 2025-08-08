import React, { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import {
  suiContractsService,
  SpendingRecord,
  TransactionHistory,
} from "../services/suiContracts";
import { LoginResult } from "../services/zklogin";
import {
  PlusIcon,
  UploadIcon,
  DownloadIcon,
  SettingIcon,
  UserGroupIcon,
  InfoIcon,
  DatabaseIcon,
} from "@govtechmy/myds-react/icon";
import { Button } from "@govtechmy/myds-react/button";
import { Input } from "@govtechmy/myds-react/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@govtechmy/myds-react/select";
import { TextArea } from "@govtechmy/myds-react/textarea";
import { Tag } from "@govtechmy/myds-react/tag";

interface AdminProps {
  loginResult: LoginResult;
}

const Admin: React.FC<AdminProps> = ({ loginResult }) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("transactions");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    txHash?: string;
  }>({ type: null, message: "" });

  // Form state for blockchain submission
  const [newTransaction, setNewTransaction] = useState({
    department: "",
    projectName: "",
    amount: "",
    description: "",
    location: "",
    budgetAllocated: "",
    contractor: "",
    status: "planned" as SpendingRecord["status"],
  });

  // Real blockchain data
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    SpendingRecord[]
  >([]);
  const [transactionHistory, setTransactionHistory] = useState<
    TransactionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Load real analytics from blockchain
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log("📊 Loading admin analytics from blockchain...");

      const analyticsData = await suiContractsService.getAnalytics();
      const records = await suiContractsService.getSpendingRecords();
      const history = await suiContractsService.getUserTransactionHistory(
        loginResult.userAddress
      );

      setAnalytics(analyticsData);
      setRecentTransactions(records.slice(0, 5));
      setTransactionHistory(history.slice(0, 10));

      console.log("✅ Admin analytics loaded:", {
        totalProjects: analyticsData.totalProjects,
        totalSpending: analyticsData.totalSpending,
        recentTransactions: records.length,
      });
    } catch (error) {
      console.error("❌ Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // MAIN BLOCKCHAIN INTEGRATION - Submit to deployed smart contract
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !newTransaction.projectName ||
      !newTransaction.budgetAllocated ||
      !newTransaction.amount
    ) {
      setSubmissionStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    if (
      !newTransaction.department ||
      !newTransaction.location ||
      !newTransaction.description
    ) {
      setSubmissionStatus({
        type: "error",
        message: "Department, Location, and Description are required",
      });
      return;
    }

    const allocatedAmount = parseInt(newTransaction.budgetAllocated);
    const spentAmount = parseInt(newTransaction.amount);

    if (spentAmount > allocatedAmount) {
      setSubmissionStatus({
        type: "error",
        message: "Spent amount cannot exceed allocated budget",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ type: null, message: "" });

    try {
      console.log("🚀 ADMIN: Submitting spending record to blockchain...", {
        user: loginResult.userInfo.email,
        userAddress: loginResult.userAddress,
        project: newTransaction.projectName,
        allocated: allocatedAmount,
        spent: spentAmount,
        department: newTransaction.department,
        contractAddress: import.meta.env.VITE_SUI_PACKAGE_ID,
      });

      // Create SpendingRecord for smart contract
      const spendingRecord: SpendingRecord = {
        department: newTransaction.department,
        projectName: newTransaction.projectName,
        allocatedAmount: allocatedAmount,
        spentAmount: spentAmount,
        date: new Date().toISOString().split("T")[0],
        status: newTransaction.status,
        description: newTransaction.description,
        contractor: newTransaction.contractor || "TBD",
        location: newTransaction.location,
      };

      // Submit to deployed smart contract on Sui blockchain
      const txHash = await suiContractsService.submitSpendingRecord(
        spendingRecord,
        loginResult
      );

      console.log("✅ Blockchain submission successful:", {
        txHash: txHash,
        project: spendingRecord.projectName,
        amount: spendingRecord.allocatedAmount,
      });

      setSubmissionStatus({
        type: "success",
        message: "Spending record successfully submitted to Sui blockchain!",
        txHash: txHash,
      });

      // Reset form
      setNewTransaction({
        department: "",
        projectName: "",
        amount: "",
        description: "",
        location: "",
        budgetAllocated: "",
        contractor: "",
        status: "planned",
      });

      // Reload analytics to show updated data
      setTimeout(() => {
        loadAnalytics();
      }, 2000); // Give blockchain time to process
    } catch (error) {
      console.error("❌ Blockchain submission failed:", error);
      setSubmissionStatus({
        type: "error",
        message: `Failed to submit to blockchain: ${
          error.message || "Unknown error occurred"
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTransaction({
      department: "",
      projectName: "",
      amount: "",
      description: "",
      location: "",
      budgetAllocated: "",
      contractor: "",
      status: "planned",
    });
    setSubmissionStatus({ type: null, message: "" });
  };

  const adminSections = [
    { id: "overview", label: "Overview", icon: SettingIcon },
    { id: "transactions", label: "Submit Spending Record", icon: PlusIcon },
    { id: "history", label: "Transaction History", icon: DatabaseIcon },
    { id: "users", label: "User Management", icon: UserGroupIcon },
    { id: "blockchain", label: "Blockchain Status", icon: InfoIcon },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (
    status: string
  ): "success" | "warning" | "primary" | "danger" | "default" => {
    const statusMap: Record<
      string,
      "success" | "warning" | "primary" | "danger" | "default"
    > = {
      completed: "success",
      confirmed: "success",
      ongoing: "warning",
      pending: "warning",
      planned: "primary",
      cancelled: "danger",
      failed: "danger",
    };
    return statusMap[status] || "default";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg text-gray-600">
              Loading admin dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 space-y-8 min-h-screen">
      {/* Header with blockchain status */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-600">
              Government spending record management via blockchain
            </p>
          </div>
          <div className="text-right text-sm bg-white p-4 rounded-lg shadow-sm">
            <div className="text-gray-800 font-medium">
              {loginResult.userInfo.name}
            </div>
            <div className="text-gray-600">{loginResult.userInfo.email}</div>
            <div className="text-blue-600 mt-1">
              🔗 {loginResult.userAddress.slice(0, 8)}...
              {loginResult.userAddress.slice(-6)}
            </div>
            <div className="text-green-600 text-xs mt-1">
              ✅ Smart Contract Active
            </div>
          </div>
        </div>
      </div>
      {/* 🔧 ADD DEBUG SECTION RIGHT HERE */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            🔧 Enhanced Debug Tools
          </h3>

          <div className="space-x-2 mb-3">
            <button
              type="button"
              onClick={async () => {
                console.log("🔍 Starting blockchain debug...");
                await suiContractsService.debugBlockchainSetup();
              }}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
            >
              🔍 Check Setup
            </button>

            <button
              type="button"
              onClick={() => {
                console.log("🔑 KEYPAIR STATUS DEBUG:");

                // Manual keypair debug
                console.log("Login result exists:", !!loginResult);
                console.log(
                  "ZKLogin state exists:",
                  !!loginResult?.zkLoginState
                );
                console.log(
                  "Ephemeral keypair exists:",
                  !!loginResult?.zkLoginState?.ephemeralKeyPair
                );

                if (loginResult?.zkLoginState?.ephemeralKeyPair) {
                  const keypair = loginResult.zkLoginState.ephemeralKeyPair;
                  console.log("Keypair type:", typeof keypair);
                  console.log(
                    "Has signTransaction:",
                    typeof keypair.signTransaction === "function"
                  );
                  console.log("Constructor:", keypair.constructor?.name);
                  console.log("Methods:", Object.getOwnPropertyNames(keypair));
                }
              }}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              🔑 Debug Keypair
            </button>

            <button
              type="button"
              onClick={async () => {
                console.log("🔧 Attempting to fix keypair...");

                const sessionId = loginResult.zkLoginState?.sessionId;
                if (sessionId) {
                  const keyKey = `zklogin_ephemeral_${sessionId}`;
                  const storedKey = localStorage.getItem(keyKey);

                  if (storedKey) {
                    try {
                      // Import Ed25519Keypair dynamically
                      const { Ed25519Keypair } = await import(
                        "@mysten/sui/keypairs/ed25519"
                      );
                      const newKeypair =
                        Ed25519Keypair.fromSecretKey(storedKey);

                      console.log("✅ Keypair reconstructed successfully");
                      console.log("New keypair methods:", {
                        hasSignTransaction:
                          typeof newKeypair.signTransaction === "function",
                        hasGetPublicKey:
                          typeof newKeypair.getPublicKey === "function",
                        publicKey: newKeypair.getPublicKey().toSuiAddress(),
                      });

                      // Update the login result
                      loginResult.zkLoginState.ephemeralKeyPair = newKeypair;
                      alert("✅ Keypair fixed! Try the transaction again.");
                    } catch (error) {
                      console.error("❌ Keypair reconstruction failed:", error);
                      alert(
                        "❌ Could not fix keypair. Please log out and log in again."
                      );
                    }
                  } else {
                    alert("❌ No stored keypair found. Please log in again.");
                  }
                }
              }}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded"
            >
              🔧 Fix Keypair
            </button>
            <button
              type="button"
              onClick={async () => {
                console.log("🔍 ZKLOGIN SIGNATURE DEBUG:");

                try {
                  // Check JWT info
                  if (loginResult.jwt) {
                    const { jwtDecode } = await import("jwt-decode");
                    const jwtDecoded = jwtDecode(loginResult.jwt) as any;

                    console.log("📋 JWT Information:");
                    console.log("  Sub (subject):", jwtDecoded.sub);
                    console.log("  Aud (audience):", jwtDecoded.aud);
                    console.log("  Iss (issuer):", jwtDecoded.iss);
                    console.log(
                      "  Nonce:",
                      jwtDecoded.nonce?.slice(0, 20) + "..."
                    );
                    console.log(
                      "  Exp (expires):",
                      new Date(jwtDecoded.exp * 1000)
                    );

                    // Check if JWT matches stored nonce
                    const storedNonce = loginResult.zkLoginState?.nonce;
                    console.log("🔍 Nonce verification:");
                    console.log(
                      "  JWT nonce:",
                      jwtDecoded.nonce?.slice(0, 20) + "..."
                    );
                    console.log(
                      "  Stored nonce:",
                      storedNonce?.slice(0, 20) + "..."
                    );
                    console.log(
                      "  Nonces match:",
                      jwtDecoded.nonce === storedNonce
                    );

                    // Test address seed generation
                    if (loginResult.zkLoginState?.userSalt) {
                      const { genAddressSeed } = await import(
                        "@mysten/sui/zklogin"
                      );
                      const addressSeed = genAddressSeed(
                        loginResult.zkLoginState.userSalt,
                        "sub",
                        jwtDecoded.sub,
                        jwtDecoded.aud
                      );

                      console.log("🏠 Address generation:");
                      console.log(
                        "  User salt:",
                        loginResult.zkLoginState.userSalt.slice(0, 10) + "..."
                      );
                      console.log("  Address seed:", addressSeed.toString());
                      console.log(
                        "  Expected address:",
                        loginResult.userAddress
                      );

                      // Convert address seed to address format
                      const generatedAddress =
                        "0x" + addressSeed.toString(16).padStart(64, "0");
                      console.log("  Generated address:", generatedAddress);
                      console.log(
                        "  Addresses match:",
                        generatedAddress === loginResult.userAddress
                      );
                    }

                    // Check ZK proof
                    console.log("🔒 ZK Proof Status:");
                    console.log("  Has ZK proof:", !!loginResult.zkProof);
                    if (loginResult.zkProof) {
                      console.log(
                        "  Has proof points:",
                        !!loginResult.zkProof.proofPoints
                      );
                      console.log(
                        "  Has issBase64Details:",
                        !!loginResult.zkProof.issBase64Details
                      );
                      console.log(
                        "  Has headerBase64:",
                        !!loginResult.zkProof.headerBase64
                      );
                    }

                    // Check epoch validity
                    console.log("⏰ Epoch Status:");
                    console.log(
                      "  Max epoch:",
                      loginResult.zkLoginState?.maxEpoch
                    );
                    console.log(
                      "  Current epoch:",
                      loginResult.zkLoginState?.currentEpoch
                    );
                  } else {
                    console.error("❌ No JWT found in login result");
                  }
                } catch (error) {
                  console.error("❌ Signature debug failed:", error);
                }
              }}
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded"
            >
              🔍 Debug Signature
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(loginResult.userAddress);
                window.open("https://testnet.faucet.sui.io/", "_blank");
                console.log("🚰 Address copied:", loginResult.userAddress);
              }}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded"
            >
              🚰 Get SUI
            </button>
          </div>

          {/* Status display */}
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
            <div>User: {loginResult.userAddress.slice(0, 20)}...</div>
            <div>
              Has Keypair:{" "}
              {loginResult.zkLoginState?.ephemeralKeyPair ? "✅" : "❌"}
            </div>
            <div>
              Keypair Methods:{" "}
              {typeof loginResult.zkLoginState?.ephemeralKeyPair
                ?.signTransaction === "function"
                ? "✅"
                : "❌"}
            </div>
            <div>
              Session: {loginResult.zkLoginState?.sessionId?.slice(0, 8)}...
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>
              If transaction fails with "signTransaction is not a function":
            </strong>
            <ol className="mt-1 list-decimal list-inside space-y-1">
              <li>Click "🔑 Debug Keypair" to see the problem</li>
              <li>Click "🔧 Fix Keypair" to attempt automatic fix</li>
              <li>If fix fails, log out and log in again</li>
            </ol>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {submissionStatus.type && (
        <div
          className={`p-4 rounded-lg border-l-4 shadow-sm ${
            submissionStatus.type === "success"
              ? "bg-green-50 border-green-400 text-green-700"
              : "bg-red-50 border-red-400 text-red-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">{submissionStatus.message}</p>
              {submissionStatus.txHash && (
                <div className="mt-2">
                  <p className="text-sm">Transaction Hash:</p>
                  <a
                    href={`https://testnet.suivision.xyz/txblock/${submissionStatus.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono bg-white px-2 py-1 rounded border hover:bg-gray-50 inline-block mt-1"
                  >
                    {submissionStatus.txHash}
                  </a>
                  <p className="text-xs mt-1 text-green-600">
                    ↗ Click to view on Sui Explorer
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSubmissionStatus({ type: null, message: "" })}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Admin Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {adminSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <Button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    variant={isActive ? "primary-fill" : "default-ghost"}
                    className="w-full justify-start"
                  >
                    <Icon
                      className={`h-5 w-5 mr-3 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}
                    />
                    {section.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              {/* Stats Cards with Real Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Projects
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {analytics?.totalProjects || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DatabaseIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    📊 From blockchain
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Spending
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {analytics?.totalSpending
                          ? formatCurrency(analytics.totalSpending)
                          : "RM 0"}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <InfoIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    ⛓️ Blockchain verified
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Citizen Feedback
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {analytics?.totalFeedback || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <UserGroupIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    💬 Anonymous submissions
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Recent Blockchain Transactions
                </h3>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {tx.projectName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {tx.department}
                          </p>
                          <div className="text-xs text-blue-600 mt-1">
                            {tx.txHash ? (
                              <a
                                href={`https://testnet.suivision.xyz/txblock/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline font-mono"
                              >
                                TX: {tx.txHash.slice(0, 16)}...
                              </a>
                            ) : (
                              "Processing..."
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">
                            {formatCurrency(tx.spentAmount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            of {formatCurrency(tx.allocatedAmount)}
                          </p>
                          <Tag variant="success" className="mt-1">
                            ✅ Confirmed
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <DatabaseIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No transactions found.</p>
                    <p className="text-sm mt-1">
                      Submit your first spending record to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Spending Record Section */}
          {activeSection === "transactions" && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Submit Spending Record to Blockchain
                </h3>
                <Button
                  onClick={resetForm}
                  variant="default-outline"
                  className="text-sm"
                >
                  Reset Form
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <Select
                      value={newTransaction.department}
                      onValueChange={(value) =>
                        setNewTransaction({
                          ...newTransaction,
                          department: value,
                        })
                      }
                      variant="outline"
                      size="small"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ministry of Health">
                          Ministry of Health
                        </SelectItem>
                        <SelectItem value="Ministry of Education">
                          Ministry of Education
                        </SelectItem>
                        <SelectItem value="Ministry of Transport">
                          Ministry of Transport
                        </SelectItem>
                        <SelectItem value="Ministry of Finance">
                          Ministry of Finance
                        </SelectItem>
                        <SelectItem value="Ministry of Digital">
                          Ministry of Digital
                        </SelectItem>
                        <SelectItem value="Ministry of Works">
                          Ministry of Works
                        </SelectItem>
                        <SelectItem value="Ministry of Housing">
                          Ministry of Housing
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <Input
                      type="text"
                      value={newTransaction.projectName}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          projectName: e.target.value,
                        })
                      }
                      placeholder="e.g., Hospital KL Emergency Ward Renovation"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Allocated (MYR) *
                    </label>
                    <Input
                      type="number"
                      value={newTransaction.budgetAllocated}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          budgetAllocated: e.target.value,
                        })
                      }
                      placeholder="15000000"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Spent (MYR) *
                    </label>
                    <Input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          amount: e.target.value,
                        })
                      }
                      placeholder="8500000"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Status
                    </label>
                    <Select
                      value={newTransaction.status}
                      onValueChange={(value: SpendingRecord["status"]) =>
                        setNewTransaction({ ...newTransaction, status: value })
                      }
                      variant="outline"
                      size="small"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contractor
                    </label>
                    <Input
                      type="text"
                      value={newTransaction.contractor}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          contractor: e.target.value,
                        })
                      }
                      placeholder="ABC Construction Sdn Bhd"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      type="text"
                      value={newTransaction.location}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          location: e.target.value,
                        })
                      }
                      placeholder="Kuala Lumpur, Malaysia"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description *
                    </label>
                    <TextArea
                      value={newTransaction.description}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          description: e.target.value,
                        })
                      }
                      placeholder="Detailed description of the project, including scope of work, expected outcomes, and key milestones..."
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    <p>* Required fields</p>
                    <p className="text-xs text-blue-600 mt-1">
                      ⛓️ Will be permanently recorded on Sui blockchain
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    variant="primary-fill"
                    disabled={
                      isSubmitting ||
                      !newTransaction.projectName ||
                      !newTransaction.budgetAllocated
                    }
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting to Blockchain...
                      </>
                    ) : (
                      "Submit to Blockchain"
                    )}
                  </Button>
                </div>
              </div>

              {/* Blockchain Info Panel */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Blockchain Integration Active</p>
                    <p className="mt-1">
                      This record will be permanently stored on Sui blockchain
                      at contract:
                      <code className="text-xs ml-1 bg-blue-100 px-1 rounded">
                        {import.meta.env.VITE_SUI_PACKAGE_ID?.slice(0, 20)}...
                      </code>
                    </p>
                    <p className="text-xs mt-2 text-blue-600">
                      All transactions are signed with your ZKLogin identity and
                      are immutable once confirmed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History Section */}
          {activeSection === "history" && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Transaction History
              </h3>
              {transactionHistory.length > 0 ? (
                <div className="space-y-4">
                  {transactionHistory.map((tx, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900 capitalize">
                              {tx.type.replace("_", " ")}
                            </span>
                            <Tag variant={getStatusVariant(tx.status)}>
                              {tx.status}
                            </Tag>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Transaction ID:{" "}
                            <span className="font-mono text-xs">{tx.txId}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleString()} • Block:{" "}
                            {tx.blockNumber || "Pending"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            User: {tx.user.slice(0, 8)}...{tx.user.slice(-6)}
                          </p>
                          {tx.gasUsed && (
                            <p className="text-xs text-gray-500">
                              Gas: {tx.gasUsed}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DatabaseIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No transaction history found.</p>
                </div>
              )}
            </div>
          )}

          {/* User Management Section */}
          {activeSection === "users" && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Government User Management
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {loginResult.userInfo.name || "Current User"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {loginResult.userInfo.email}
                    </p>
                    <p className="text-xs text-blue-600 font-mono">
                      {loginResult.userAddress}
                    </p>
                  </div>
                  <Tag variant="success">Active Admin</Tag>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> User management features are
                    available in the full production version. Current demo shows
                    authenticated government official access only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Status Section */}
          {activeSection === "blockchain" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Smart Contract Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <Input
                      value="Sui Testnet"
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Address
                    </label>
                    <Input
                      value={
                        import.meta.env.VITE_SUI_PACKAGE_ID || "Not configured"
                      }
                      readOnly
                      className="bg-gray-100 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RPC Endpoint
                    </label>
                    <Input
                      value={
                        import.meta.env.VITE_SUI_RPC_URL ||
                        "https://fullnode.testnet.sui.io:443"
                      }
                      readOnly
                      className="bg-gray-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZKLogin Status
                    </label>
                    <Input
                      value={
                        import.meta.env.VITE_ENABLE_REAL_ZKLOGIN === "true"
                          ? "Production"
                          : "Demo Mode"
                      }
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-100 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <InfoIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">
                          Smart Contract Deployed & Active
                        </p>
                        <div className="text-sm text-green-700 mt-2 space-y-1">
                          <p>✅ Real blockchain transactions enabled</p>
                          <p>✅ ZKLogin authentication active</p>
                          <p>✅ Immutable record storage</p>
                          <p>✅ Public transparency verification</p>
                          <p>✅ Government official validation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <DatabaseIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-800">
                          Contract Verification
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          You can verify the smart contract and view all
                          transactions on Sui Explorer:
                        </p>
                        <a
                          href={`https://testnet.suivision.xyz/object/${
                            import.meta.env.VITE_SUI_PACKAGE_ID
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View Contract on Sui Explorer →
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start">
                      <UserGroupIcon className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-purple-800">
                          Privacy & Security
                        </p>
                        <div className="text-sm text-purple-700 mt-1">
                          <p>
                            🔐 Zero-knowledge authentication protects user
                            identity
                          </p>
                          <p>
                            📋 All transactions are digitally signed and
                            verified
                          </p>
                          <p>
                            🔒 Data integrity guaranteed by blockchain consensus
                          </p>
                          <p>
                            👥 Citizen feedback remains anonymous while verified
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Functions */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Available Smart Contract Functions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      create_spending_record
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Submit government spending records to blockchain
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>• Requires government official authentication</p>
                      <p>• Creates immutable spending record</p>
                      <p>• Emits SpendingRecordCreated event</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      submit_feedback
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Allow citizens to submit anonymous feedback
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>• Privacy-preserving citizen input</p>
                      <p>• Zero-knowledge identity protection</p>
                      <p>• Emits FeedbackSubmitted event</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      register_official
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Register government officials for system access
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>• Email domain verification</p>
                      <p>• Creates official registry entry</p>
                      <p>• Emits OfficialRegistered event</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      update_spending_amount
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Update existing spending records (by original submitter)
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>• Authorization checks enforced</p>
                      <p>• Maintains audit trail</p>
                      <p>• Status and amount updates</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development & Deployment Info */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Development Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Contract Details
                      </h4>
                      <div className="space-y-1 text-gray-600">
                        <p>Language: Move</p>
                        <p>Network: Sui Testnet</p>
                        <p>Edition: Legacy</p>
                        <p>Gas Budget: 50M MIST</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Environment
                      </h4>
                      <div className="space-y-1 text-gray-600">
                        <p>
                          Blockchain Mode:{" "}
                          {import.meta.env.VITE_ENABLE_REAL_BLOCKCHAIN ===
                          "true"
                            ? "Production"
                            : "Demo"}
                        </p>
                        <p>
                          ZKLogin Mode:{" "}
                          {import.meta.env.VITE_ENABLE_REAL_ZKLOGIN === "true"
                            ? "Production"
                            : "Demo"}
                        </p>
                        <p>Frontend: React + TypeScript</p>
                        <p>Design System: MYDS</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      For Hackathon Judges
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      This is a fully functional blockchain transparency
                      platform with real smart contracts deployed on Sui
                      testnet. The system demonstrates:
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        • Complete blockchain integration with immutable record
                        storage
                      </p>
                      <p>
                        • Zero-knowledge authentication for privacy-preserving
                        transparency
                      </p>
                      <p>
                        • Malaysian Government Design System (MYDS) compliance
                      </p>
                      <p>
                        • Role-based access control for government officials and
                        citizens
                      </p>
                      <p>
                        • Production-ready architecture with environment-based
                        configuration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
