import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
  sui_object_id: { type: String, required: true, unique: true },
  // This creates a reference to a document in the 'GovernmentBody' collection
  issuing_body: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentBody', required: true },
  title: { type: String, required: true },
  total_allocation: { type: Number, required: true },
  year: { type: Number, required: true },
  sdg_focus: { type: Number, required: true }, // Storing the number 1-17
  // We store the full IPFS URL for easy access from the frontend
  source_document_url: { type: String, required: true },
}, { timestamps: true });
export default mongoose.model('Budget', BudgetSchema);