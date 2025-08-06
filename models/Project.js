import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  sui_object_id: { type: String, required: true, unique: true },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Tendering', 'In Progress', 'Completed', 'Flagged'], default: 'Tendering' },
  awarded_amount: { type: Number, required: true },
  awarded_to_vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  tender_documents_url: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Project', ProjectSchema);