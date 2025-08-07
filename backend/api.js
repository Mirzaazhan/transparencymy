// file: api.js

import express from 'express';
import { SuiClient } from '@mysten/sui.js/client';

// Import your NEW Mongoose models, which match the smart contract
import GovernmentOfficial from './models/GovernmentOffical.js';
import SpendingRecord from './models/SpendingRecord.js';
import CitizenFeedback from './models/CitizenFeedback.js';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// --- CONFIGURATION ---
// The API only needs the RPC URL to talk to the Sui network.
const SUI_FULLNODE_URL = process.env.SUI_FULLNODE_URL;

// This check ensures the server doesn't start with an invalid configuration.
if (!SUI_FULLNODE_URL) {
  throw new Error("SUI_FULLNODE_URL is not defined in the .env file. The API cannot start.");
}

const suiClient = new SuiClient({ url: SUI_FULLNODE_URL });


// =================================================================
// WRITE Endpoint (Proxy for zkLogin Signed Transactions)
// =================================================================

/**
 * Receives a pre-built and signed transaction from a zkLogin user (admin or citizen)
 * and executes it on their behalf. The backend's role is to be a "gas station"
 * or proxy, it does not sign anything itself.
 */
router.post('/execute-transaction', async (req, res) => {
  try {
    // The frontend sends the raw transaction bytes and the complete zkLogin signature
    const { tx_bytes, zk_signature } = req.body;

    if (!tx_bytes || !zk_signature) {
      return res.status(400).json({
        success: false,
        message: "Request must include 'tx_bytes' and 'zk_signature'."
      });
    }

    console.log("Receiving and proxying a pre-signed zkLogin transaction...");

    // The backend's only job is to submit the transaction to the network.
    // The signature and the transaction logic were all created on the frontend.
    const result = await suiClient.executeTransactionBlock({
      transactionBlock: tx_bytes,
      signature: zk_signature,
      options: {
        showEffects: true,
      },
    });

    console.log("Transaction executed successfully on behalf of user. Digest:", result.digest);

    // Respond with 202 (Accepted) to indicate the transaction was submitted.
    // The frontend should not assume the data is saved until the indexer processes the event.
    res.status(202).json({ success: true, message: "Transaction accepted by the network.", digest: result.digest });

  } catch (error) {
    console.error('Failed to execute pre-signed transaction:', error);
    const errorMessage = error.message || "An unknown error occurred.";
    res.status(500).json({ success: false, message: errorMessage });
  }
});


// =================================================================
// READ Endpoints (Querying MongoDB for a Fast User Experience)
// =================================================================

/**
 * GET all spending records.
 * Populates the 'submitter' with official's details for easy display.
 */
router.get('/spending-records', async (req, res) => {
  try {
    const records = await SpendingRecord.find()
      .populate('submitter', 'official_address department') // Selectively populate fields
      .sort({ created_at: -1 }); // Show newest records first
    res.json(records);
  } catch (error) {
    console.error('Error fetching spending records:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET a single spending record by its MongoDB ID.
 */
router.get('/spending-records/:id', async (req, res) => {
    try {
      const record = await SpendingRecord.findById(req.params.id)
        .populate('submitter', 'official_address department');
      
      if (!record) {
        return res.status(404).json({ message: 'Spending record not found.' });
      }
      res.json(record);
    } catch (error) {
      console.error(`Error fetching spending record ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
});

/**
 * GET all citizen feedback for a specific spending record (identified by its MongoDB ID).
 */
router.get('/spending-records/:id/feedback', async (req, res) => {
    try {
        const recordExists = await SpendingRecord.countDocuments({ _id: req.params.id });
        if (recordExists === 0) {
            return res.status(404).json({ message: 'Spending record not found.' });
        }

        const feedback = await CitizenFeedback.find({ spending_record: req.params.id })
            .sort({ created_at: -1 });
            
        res.json(feedback);
    } catch (error) {
        console.error(`Error fetching feedback for record ${req.params.id}:`, error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET all registered government officials.
 */
router.get('/officials', async (req, res) => {
  try {
    const officials = await GovernmentOfficial.find().sort({ department: 1 });
    res.json(officials);
  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;