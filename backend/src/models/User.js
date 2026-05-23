import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const activityLogSchema = new mongoose.Schema({
  action:    { type: String, required: true },
  detail:    { type: String, default: '' },
  ip:        { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

// Structured custom rule
const customRuleSchema = new mongoose.Schema({
  text:     { type: String, required: true, trim: true },
  category: { type: String, default: 'general' },
  enabled:  { type: Boolean, default: true },
}, { _id: false });

// User preferences
const preferencesSchema = new mongoose.Schema({
  defaultLanguage:      { type: String, default: 'javascript' },
  themePreference:      { type: String, default: 'dark' },
  notificationsEnabled: { type: Boolean, default: true },
  uiLanguage:           { type: String, default: 'en' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  currentMode: { type: String, enum: ['student', 'developer', 'interviewer'], default: 'developer' },
  customRules: { type: [customRuleSchema], default: [] },
  preferences: { type: preferencesSchema, default: () => ({}) },
  apiKey:      { type: String, default: '' },
  avatar:      { type: String, default: '' },
  githubUser:  { type: String, default: '' },
  githubToken: { type: String, default: '' },
  isGoogleUser:{ type: Boolean, default: false },
  isNewUser:   { type: Boolean, default: true },
  lastLogin:   { type: Date, default: null },
  activityLog: { type: [activityLogSchema], default: [] },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.$locals.skipPasswordHash) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.logActivity = async function (action, detail = '', ip = '') {
  await this.updateOne({
    $set:  { lastLogin: action === 'login' ? new Date() : this.lastLogin },
    $push: { activityLog: { $each: [{ action, detail, ip }], $slice: -50 } },
  });
};

export default mongoose.model('User', userSchema);