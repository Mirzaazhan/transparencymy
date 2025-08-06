// models/Vendor.js
import mongoose from 'mongoose';


const VendorSchema = new mongoose.Schema({
  // The vendor's wallet address is their unique identifier in the system
  wallet_address: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  registration_number: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls
}, { timestamps: true });

export default mongoose.model('Vendor', VendorSchema);
