// file: models/CitizenFeedback.js
import mongoose from 'mongoose';

const CitizenFeedbackSchema = new mongoose.Schema({
  sui_object_id: { type: String, required: true, unique: true },
  // A direct link to the SpendingRecord this feedback is for
  spending_record: { type: mongoose.Schema.Types.ObjectId, ref: 'SpendingRecord', required: true },
  // The original Sui Object ID of the project, for reference
  project_id_string: { type: String, required: true },
  rating: { type: Number, required: true }, // 1-5
  message_hash: { type: String, required: true },
  is_anonymous: { type: Boolean, required: true },
  // The zkLogin address of the citizen who submitted
  submitter_address: { type: String, required: true },
  created_at: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('CitizenFeedback', CitizenFeedbackSchema);