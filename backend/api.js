import express from 'express';
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Mongoose models for reading data
import Project from './models/Project.js';
import Budget from './models/Budget.js';
import Transaction from './models/Transaction.js';

const router = express.Router();

// --- CONFIGURATION ---
const SUI_FULLNODE_URL = process.env.SUI_FULLNODE_URL;
const SUI_PACKAGE_ID = process.env.SUI_PACKAGE_ID;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

const suiClient = new SuiClient({ url: SUI_FULLNODE_URL });

// Create a keypair from the admin's secret key
// const adminKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(ADMIN_SECRET_KEY, 'base64'));

// --- MODIFIED: Conditionally create the admin keypair ---
let adminKeypair; // Declare the variable

if (ADMIN_SECRET_KEY) {
  try {
    // This code will only run if the key exists in your .env file
    adminKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(ADMIN_SECRET_KEY, 'base64'));
    console.log("✅ Admin keypair loaded successfully. API write operations enabled.");
  } catch (error) {
    console.error("❌ ERROR: ADMIN_SECRET_KEY is invalid. Check your .env file. Write operations disabled.", error);
  }
} else {
  // This is the message you will see
  console.warn("⚠️ WARNING: ADMIN_SECRET_KEY not found in .env. API write operations will be disabled.");
}
// --- END OF MODIFICATION ---

// =================================================================
// WRITE Endpoints (Interacting with Sui Blockchain)
// =================================================================

// Endpoint to publish a new budget
router.post('/budgets', async (req, res) => {
  try {
    const { governmentBodySuiId, title, totalAllocation, year, sdgFocus, sourceDocumentUrl } = req.body;

    // TODO: A real app would get the governmentBodySuiId from an authenticated session
    
    // Step 1: Create a new Transaction Block
    const tx = new TransactionBlock();

    // Step 2: Add the smart contract call to the transaction block
    tx.moveCall({
      target: `${SUI_PACKAGE_ID}::transparensi::publish_budget`, // Replace 'transparensi' with your module name
      arguments: [
        tx.object(governmentBodySuiId),
        tx.pure(title),
        tx.pure(totalAllocation),
        tx.pure(year),
        tx.pure(sdgFocus),
        tx.pure(sourceDocumentUrl),
      ],
    });

    // Step 3: Sign and execute the transaction
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: tx,
      options: { showEvents: true }, // Important for debugging
    });

    res.json({ success: true, digest: result.digest });

  } catch (error) {
    console.error('Failed to publish budget:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to award a project
router.post('/projects/award', async (req, res) => {
    try {
        const { budgetSuiId, title, description, awardedAmount, vendorWallet, tenderDocumentsUrl } = req.body;

        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${SUI_PACKAGE_ID}::transparensi::award_project`,
            arguments: [
                tx.object(budgetSuiId),
                tx.pure(title),
                tx.pure(description),
                tx.pure(awardedAmount),
                tx.pure(vendorWallet),
                tx.pure(tenderDocumentsUrl),
            ]
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: adminKeypair,
            transactionBlock: tx,
            options: { showEvents: true },
        });

        res.json({ success: true, digest: result.digest });
    } catch (error) {
        console.error('Failed to award project:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to make a payment to a vendor
router.post('/transactions/pay', async (req, res) => {
    try {
        const { projectSuiId, amount, milestoneDescription, invoiceUrl } = req.body;

        const tx = new TransactionBlock();
        
        // This assumes your smart contract handles pulling coins from the project object
        // and sending them. The 'coins' argument might need to be constructed differently
        // based on your smart contract's logic.
        // For simplicity, we assume the contract manages a treasury.
        tx.moveCall({
            target: `${SUI_PACKAGE_ID}::transparensi::make_payment`,
            arguments: [
                tx.object(projectSuiId),
                tx.pure(amount),
                tx.pure(milestoneDescription),
                tx.pure(invoiceUrl),
            ]
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: adminKeypair,
            transactionBlock: tx,
            options: { showEvents: true },
        });

        res.json({ success: true, digest: result.digest });
    } catch (error) {
        console.error('Failed to make payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// // --- ADD A MOCK RESPONSE ---
// console.log("SUI LOGIC SKIPPED: Would have published budget:", { title, totalAllocation });
// res.json({ success: true, message: "Mock Success: Transaction not sent." });

// =================================================================
// READ Endpoints (Querying MongoDB)
// =================================================================

// Get all projects with populated details
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('budget')
      .populate('awarded_to_vendor');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single project and its transactions
router.get('/projects/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('budget')
      .populate('awarded_to_vendor');
    
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const transactions = await Transaction.find({ project: project._id });
    
    res.json({ project, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// This new route handles adding feedback to a specific project
router.post('/projects/:projectId/feedback', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { comment_text, sentiment } = req.body;
        
        // In a real app, an auth middleware would provide this.
        // For the hackathon, you can mock it or pass it in the body.
        const zklogin_address = req.body.zklogin_address || "mock_zklogin_address_" + Math.random();

        if (!comment_text || !sentiment) {
            return res.status(400).json({ success: false, message: "Comment text and sentiment are required." });
        }

        const newFeedback = {
            comment_text,
            sentiment,
            zklogin_address,
        };

        // Find the project and push the new feedback in one atomic operation
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $push: { feedbacks: newFeedback } },
            { new: true } // This option returns the document after the update
        );

        if (!updatedProject) {
            return res.status(404).json({ success: false, message: "Project not found." });
        }
        
        // --- Execute the "Auto-Flagging" Business Logic ---
        if (sentiment === 'negative') {
            const negativeCommenters = new Set(
                updatedProject.feedbacks
                    .filter(fb => fb.sentiment === 'negative')
                    .map(fb => fb.zklogin_address)
            );

            // Threshold is 5 unique negative commenters
            if (negativeCommenters.size > 5) {
                // Check if status is already flagged to avoid unnecessary DB writes
                if (updatedProject.status !== 'Flagged') {
                    updatedProject.status = 'Flagged';
                    await updatedProject.save();
                    console.log(`Project ${updatedProject.title} automatically moved to 'Flagged' status.`);
                }
            }
        }

        res.status(201).json({ success: true, data: updatedProject });

    } catch (error) {
        console.error('Failed to add feedback:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;