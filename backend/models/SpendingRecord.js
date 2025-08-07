// file: models/SpendingRecord.js
import mongoose from 'mongoose';

const SpendingRecordSchema = new mongoose.Schema({
  // This is the object ID of the SpendingRecord on the Sui network
  sui_object_id: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  project_name: { type: String, required: true },
  allocated_amount: { type: Number, required: true },
  spent_amount: { type: Number, required: true },
  date: { type: String, required: true }, // Keeping as string to match contract
  // 0=planned, 1=ongoing, 2=completed, 3=cancelled
  status: { type: Number, required: true }, 
  description: { type: String, required: true },
  contractor: { type: String, required: true },
  location: { type: String, required: true },
  // Link to the official who submitted this record
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentOfficial', required: true },
  created_at: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('SpendingRecord', SpendingRecordSchema);