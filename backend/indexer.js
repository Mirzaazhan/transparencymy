// file: indexer.js

import { SuiClient } from '@mysten/sui.js/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import your NEW Mongoose schemas
import GovernmentOfficial from './models/GovernmentOffical.js';
import SpendingRecord from './models/SpendingRecord.js';
import CitizenFeedback from './models/CitizenFeedback.js';

dotenv.config();

// --- CONFIGURATION ---
const SUI_FULLNODE_URL = process.env.SUI_FULLNODE_URL;
const MONGO_URI = process.env.MONGO_URI;
const PACKAGE_ID = process.env.SUI_PACKAGE_ID;

// --- EVENT HANDLERS (Matched to transparency.move) ---

async function handleOfficialRegistered(payload) {
  console.log('Handling OfficialRegistered event:', payload);
  try {
    await GovernmentOfficial.findOneAndUpdate(
      { official_address: payload.official_address },
      {
        department: payload.department,
        email_domain: payload.email_domain,
        registered_at: new Date(Number(payload.timestamp) * 1000) // Convert epoch seconds to Date
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Successfully indexed Government Official: ${payload.official_address}`);
  } catch (err) {
    console.error('Error processing OfficialRegistered:', err);
  }
}

async function handleSpendingRecordCreated(payload) {
  console.log('Handling SpendingRecordCreated event:', payload);
  try {
    const official = await GovernmentOfficial.findOne({ official_address: payload.submitter });
    if (!official) {
      console.error(`ERROR: Submitting official ${payload.submitter} not found. Record for "${payload.project_name}" will not be created.`);
      return;
    }

    // The event payload is simpler than the full struct, so we only save what we get.
    // The other fields (description, etc.) would need to be fetched separately if needed.
    await SpendingRecord.create({
      sui_object_id: payload.record_id,
      department: payload.department,
      project_name: payload.project_name,
      allocated_amount: Number(payload.allocated_amount),
      spent_amount: Number(payload.spent_amount),
      // Fields not in the event are omitted or defaulted
      date: new Date(Number(payload.timestamp) * 1000).toISOString().split('T')[0],
      status: 0, // Default to 'planned' as it's not in the event
      submitter: official._id, // Link to our official's MongoDB ID
      created_at: new Date(Number(payload.timestamp) * 1000),
    });
    console.log(`✅ Successfully indexed new Spending Record: ${payload.project_name}`);
  } catch (err) {
    console.error('Error processing SpendingRecordCreated:', err);
  }
}

async function handleFeedbackSubmitted(payload) {
  console.log('Handling FeedbackSubmitted event:', payload);
  try {
    const spendingRecord = await SpendingRecord.findOne({ sui_object_id: payload.project_id });
    if (!spendingRecord) {
        console.error(`ERROR: SpendingRecord with ID ${payload.project_id} not found. Feedback will not be saved.`);
        return;
    }
    
    await CitizenFeedback.create({
        sui_object_id: payload.feedback_id,
        spending_record: spendingRecord._id, // Link to the MongoDB SpendingRecord
        project_id_string: payload.project_id,
        rating: Number(payload.rating),
        message_hash: "omitted", // The message hash is not in the FeedbackSubmitted event struct.
        is_anonymous: payload.is_anonymous,
        submitter_address: payload.submitter,
        created_at: new Date(Number(payload.timestamp) * 1000),
    });
    console.log(`✅ Successfully indexed new Feedback for project: ${spendingRecord.project_name}`);
  } catch (err) {
    console.error('Error processing FeedbackSubmitted:', err);
  }
}

// --- MAIN INDEXER LOGIC ---
async function startIndexer() {
  // ... (Your existing startIndexer connection logic is perfect) ...
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected.');

  const suiClient = new SuiClient({ url: SUI_FULLNODE_URL });
  console.log(`Connecting to Sui Full Node at ${SUI_FULLNODE_URL}...`);

  const unsubscribe = await suiClient.subscribeEvent({
    filter: { Package: PACKAGE_ID },
    onData: (event) => {
      console.log(`--- New Sui Event Received --- Type: ${event.type} ---`);
      
      const moduleName = '::transparency::'; // From your contract: module transparency::transparency
      
      if (event.type.endsWith(moduleName + 'OfficialRegistered')) {
        handleOfficialRegistered(event.parsedJson);
      } else if (event.type.endsWith(moduleName + 'SpendingRecordCreated')) {
        handleSpendingRecordCreated(event.parsedJson);
      } else if (event.type.endsWith(moduleName + 'FeedbackSubmitted')) {
        handleFeedbackSubmitted(event.parsedJson);
      }
    },
    onError: (err) => {
      console.error('Sui subscription error:', err);
    },
  });

  console.log('🚀 Indexer is now listening for Sui events...');
  process.on('SIGINT', async () => { /* ...graceful shutdown... */ });
}

startIndexer().catch(console.error);