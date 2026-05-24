import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  questionTitle: String,
  questionType:  String,
  answer:        String,
  skipped:       { type: Boolean, default: false },
  timeSpent:     { type: Number, default: 0 },
  score:         { type: Number, default: 0 },
  evaluation:    { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:          String,
  domain:        String,
  language:      String,
  difficulty:    String,
  questions:     { type: mongoose.Schema.Types.Mixed, default: [] },
  answers:       { type: [answerSchema], default: [] },
  totalScore:    { type: Number, default: 0 },
  maxScore:      { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  correct:       { type: Number, default: 0 },
  wrong:         { type: Number, default: 0 },
  skipped:       { type: Number, default: 0 },
  totalTime:     { type: Number, default: 0 },
  strengths:     [String],
  weaknesses:    [String],
  suggestions:   [String],
  completed:     { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('InterviewSession', interviewSessionSchema);
