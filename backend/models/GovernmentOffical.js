// file: models/GovernmentOfficial.js
import mongoose from 'mongoose';

const GovernmentOfficialSchema = new mongoose.Schema({
  // The official's Sui wallet address is their unique ID
  official_address: { type: String, required: true, unique: true },
  department: { type: String, required: true, trim: true },
  email_domain: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: true }, // Based on contract logic
  registered_at: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('GovernmentOfficial', GovernmentOfficialSchema);