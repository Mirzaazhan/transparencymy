// models/GovernmentBody.js
import mongoose from 'mongoose';

const GovernmentBodySchema = new mongoose.Schema({
  // This links to the immutable on-chain object
  sui_object_id: { type: String, required: true, unique: true },
  admin_address: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Federal', 'State', 'Local Council'], required: true },
  // This will be calculated by your indexer/backend logic
  total_budget_published: { type: Number, default: 0 },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

export default mongoose.model('GovernmentBody', GovernmentBodySchema);