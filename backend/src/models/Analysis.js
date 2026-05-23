import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    inputText: { type: String, required: true },
    result: { type: Object, required: true },
    mode: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    isBookmarked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Analysis', analysisSchema);