// file: indexer.js

import { SuiClient } from '@mysten/sui.js/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import your Mongoose schemas
import GovernmentBody from './models/GovernmentBody.js';
import Budget from './models/Budget.js';
import Project from './models/Project.js';
import Transaction from './models/Transaction.js';
// We might need the Vendor model if we have a VendorRegistered event
import Vendor from './models/Vendor.js';

dotenv.config();

// --- CONFIGURATION ---
const SUI_FULLNODE_URL = process.env.SUI_FULLNODE_URL;
const MONGO_URI = process.env.MONGO_URI;
const PACKAGE_ID = process.env.SUI_PACKAGE_ID;

// --- EVENT HANDLERS ---
// Each function handles a specific event type from your smart contract

async function handleBudgetPublished(payload) {
  console.log('Handling BudgetPublished event:', payload);
  try {
    // Find the GovernmentBody document using its Sui object ID
    const issuingBody = await GovernmentBody.findOne({ sui_object_id: payload.government_body_id });
    if (!issuingBody) {
      console.error(`ERROR: Government body with Sui ID ${payload.government_body_id} not found in DB.`);
      return;
    }

    await Budget.create({
      sui_object_id: payload.budget_id, // This is the new Budget object created on-chain
      issuing_body: issuingBody._id,
      title: payload.title,
      total_allocation: Number(payload.total_allocation),
      year: Number(payload.year),
      sdg_focus: Number(payload.sdg_focus),
      source_document_url: payload.source_document_url,
    });
    console.log(`✅ Successfully indexed new Budget: ${payload.title}`);
  } catch (err) {
    console.error('Error processing BudgetPublished:', err);
  }
}

async function handleProjectAwarded(payload) {
  console.log('Handling ProjectAwarded event:', payload);
  try {
    const budget = await Budget.findOne({ sui_object_id: payload.budget_id });
    const vendor = await Vendor.findOne({ wallet_address: payload.vendor_wallet });

    if (!budget || !vendor) {
      console.error('ERROR: Could not find prerequisite Budget or Vendor in DB for project award.');
      return;
    }

    await Project.create({
      sui_object_id: payload.project_id, // The new Project object ID
      budget: budget._id,
      title: payload.title,
      description: payload.description,
      status: 'In Progress',
      awarded_amount: Number(payload.awarded_amount),
      awarded_to_vendor: vendor._id,
      tender_documents_url: payload.tender_documents_url,
    });
    console.log(`✅ Successfully indexed new Project: ${payload.title}`);
  } catch (err) {
    console.error('Error processing ProjectAwarded:', err);
  }
}

async function handlePaymentMade(event) {
    const payload = event.parsedJson;
    console.log('Handling PaymentMade event:', payload);
    try {
        const project = await Project.findOne({ sui_object_id: payload.project_id });
        // The recipient is implicit in the project, but we can find them for the record
        const vendor = await Vendor.findById(project.awarded_to_vendor);

        if (!project || !vendor) {
            console.error('ERROR: Could not find prerequisite Project or Vendor in DB for payment.');
            return;
        }

        await Transaction.create({
            sui_transaction_hash: event.id.txDigest, // This is the unique hash of the transaction
            project: project._id,
            recipient_vendor: vendor._id,
            amount: Number(payload.amount),
            timestamp: new Date(parseInt(event.timestampMs)),
            milestone_description: payload.milestone_description,
            invoice_url: payload.invoice_url,
        });
        console.log(`✅ Successfully indexed payment of ${payload.amount} for project ${project.title}`);
    } catch (err) {
        console.error('Error processing PaymentMade:', err);
    }
}


// --- MAIN INDEXER LOGIC ---
async function startIndexer() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected.');

  const suiClient = new SuiClient({ url: SUI_FULLNODE_URL });
  console.log(`Connecting to Sui Full Node at ${SUI_FULLNODE_URL}...`);

  // Subscribe to all events from our specific package
  const unsubscribe = await suiClient.subscribeEvent({
    filter: { Package: PACKAGE_ID },
    onData: (event) => {
      console.log(`--- New Sui Event Received --- Type: ${event.type} ---`);
      
      // The event type is formatted as: `PACKAGE_ID::MODULE_NAME::EVENT_NAME`
      // We check for the event name at the end.
      if (event.type.endsWith('::BudgetPublished')) {
        handleBudgetPublished(event.parsedJson);
      } else if (event.type.endsWith('::ProjectAwarded')) {
        handleProjectAwarded(event.parsedJson);
      } else if (event.type.endsWith('::PaymentMade')) {
        handlePaymentMade(event); // Pass the whole event to get the digest and timestamp
      }
      // Add more `else if` blocks for other events like `VendorRegistered`, etc.
    },
    onError: (err) => {
      console.error('Sui subscription error:', err);
    },
  });

  console.log('🚀 Indexer is now listening for Sui events...');

  process.on('SIGINT', async () => {
    console.log('Shutting down indexer...');
    await unsubscribe();
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  });
}

startIndexer().catch(console.error);