import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected');

const testEmail = `debugtest_${Date.now()}@example.com`;
const normalizedEmail = testEmail.toLowerCase().trim();

console.log('Testing email:', normalizedEmail);

const existing = await User.findOne({ email: normalizedEmail });
console.log('findOne result:', existing);

if (existing) {
  console.log('FOUND — would return 409. Document:', JSON.stringify({ _id: existing._id, email: existing.email }));
} else {
  console.log('NOT FOUND — would proceed to create user');
  try {
    const user = await User.create({ name: 'Debug User', email: normalizedEmail, password: 'Test1234!' });
    console.log('Created successfully:', user._id, user.email);
    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log('Cleaned up test user');
  } catch (err) {
    console.error('Create error:', err.message, err.code);
  }
}

await mongoose.connection.close();
process.exit(0);