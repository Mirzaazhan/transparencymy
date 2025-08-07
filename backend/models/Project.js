import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  comment_text: { type: String, required: true, trim: true },
  // The anonymous but verifiable Sui address from the user's zkLogin session
  zklogin_address: { type: String, required: true }, 
  // Simple sentiment analysis for aggregation
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
}, { timestamps: true }); // Each comment gets its own timestamp


const ProjectSchema = new mongoose.Schema({
  sui_object_id: { type: String, required: true, unique: true },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Tendering', 'In Progress', 'Completed', 'Flagged'], default: 'Tendering' },
  awarded_amount: { type: Number, required: true },
  awarded_to_vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  tender_documents_url: { type: String, required: true },
  feedbacks: [FeedbackSchema],
}, { timestamps: true });

export default mongoose.model('Project', ProjectSchema);