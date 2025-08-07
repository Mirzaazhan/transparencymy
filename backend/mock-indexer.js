import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import ONLY the handler functions from your real indexer
import { handleBudgetPublished, handleProjectAwarded, handlePaymentMade } from './indexer.js'

// Import the models needed for creating prerequisite data
import GovernmentBody from './models/GovernmentBody.js';
import Vendor from './models/Vendor.js';
import Budget from './models/Budget.js';

dotenv.config();

// --- MOCK TEST RUNNER ---
async function runMockTests() {
  console.log('Connecting to MongoDB for mock test...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  // --- PREREQUISITE DATA ---
  // You must have at least one GovernmentBody and one Vendor in your DB for these tests to work.
  // We will find them here. If they don't exist, the script will stop.
  const testGovBody = await GovernmentBody.findOne(); // Finds the first one
  const testVendor = await Vendor.findOne(); // Finds the first one
  
  if (!testGovBody || !testVendor) {
    console.error("FATAL: Please create at least one GovernmentBody and one Vendor in your database manually before running this test.");
    await mongoose.disconnect();
    return;
  }
  console.log(`Using Test Gov Body: ${testGovBody.name} (${testGovBody.sui_object_id})`);
  console.log(`Using Test Vendor: ${testVendor.name} (${testVendor.wallet_address})`);


  // --- MOCK EVENT 1: BudgetPublished ---
  console.log("\n--- Testing handleBudgetPublished ---");
  const mockBudgetPayload = {
    government_body_id: testGovBody.sui_object_id, // Use the real sui_object_id from your DB
    budget_id: "0xMOCK_BUDGET_ID_" + Date.now(), // A fake but unique ID
    title: "Mock Annual Education Fund",
    total_allocation: "1000000", // On-chain values are often strings
    year: "2025",
    sdg_focus: "4",
    source_document_url: "https://ipfs.io/mock-budget-doc"
  };
  await handleBudgetPublished(mockBudgetPayload);
  
  // Find the budget we just created to use in the next test
  const newBudget = await Budget.findOne({ sui_object_id: mockBudgetPayload.budget_id });


  // --- MOCK EVENT 2: ProjectAwarded ---
  console.log("\n--- Testing handleProjectAwarded ---");
  const mockProjectPayload = {
    budget_id: newBudget.sui_object_id, // Use the ID from the budget we just created
    project_id: "0xMOCK_PROJECT_ID_" + Date.now(),
    vendor_wallet: testVendor.wallet_address, // Use the real wallet address from your DB
    title: "Mock School Building Project",
    description: "Constructing a new secondary school.",
    awarded_amount: "250000",
    tender_documents_url: "https://ipfs.io/mock-tender-doc"
  };
  await handleProjectAwarded(mockProjectPayload);


  // --- MOCK EVENT 3: PaymentMade ---
  console.log("\n--- Testing handlePaymentMade ---");
  // Remember, handlePaymentMade expects the WHOLE event object
  const mockPaymentEvent = {
    id: {
        txDigest: 'mockTxDigest' + Date.now(), // Fake transaction hash
        eventSeq: '1'
    },
    timestampMs: Date.now().toString(),
    parsedJson: {
        project_id: mockProjectPayload.project_id, // Use the project ID from the previous step
        amount: '50000',
        milestone_description: "Payment for foundation work",
        invoice_url: "https://ipfs.io/mock-invoice-doc"
    }
  };
  await handlePaymentMade(mockPaymentEvent);


  console.log('\n✅ Mock script finished successfully!');
  await mongoose.disconnect();
}

runMockTests().catch(console.error);