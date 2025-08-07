// models/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  // The Sui transaction hash is the unique proof for this payment
  sui_transaction_hash: { type: String, required: true, unique: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  recipient_vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  milestone_description: { type: String, required: true },
  invoice_url: { type: String }, // URL to the invoice on IPFS
  // Reference to an auditor (can be another user/entity model)
  verifier_id: { type: String },
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);