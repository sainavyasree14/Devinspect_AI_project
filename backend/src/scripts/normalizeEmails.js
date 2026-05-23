/**
 * One-time DB cleanup script
 * Normalizes all existing user emails: lowercase + trim
 *
 * Run ONCE with:
 *   node src/scripts/normalizeEmails.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB:', mongoose.connection.host);

const collection = mongoose.connection.collection('users');

const users = await collection.find({}).toArray();
console.log(`Found ${users.length} users to check.`);

let fixed = 0;
let skipped = 0;
let conflicts = 0;

for (const user of users) {
  const normalized = user.email?.toLowerCase().trim();

  if (!normalized) {
    console.warn(`  ⚠️  User ${user._id} has no email — skipping`);
    skipped++;
    continue;
  }

  if (normalized === user.email) {
    skipped++;
    continue;
  }

  // Check if the normalized email already belongs to a different document
  const conflict = await collection.findOne({
    email: normalized,
    _id:   { $ne: user._id },
  });

  if (conflict) {
    console.warn(`  ⚠️  Conflict: "${user.email}" → "${normalized}" already taken by ${conflict._id} — skipping`);
    conflicts++;
    continue;
  }

  await collection.updateOne(
    { _id: user._id },
    { $set: { email: normalized } }
  );

  console.log(`  ✔  Fixed: "${user.email}" → "${normalized}"`);
  fixed++;
}

console.log(`\nDone. Fixed: ${fixed} | Skipped (already clean): ${skipped} | Conflicts: ${conflicts}`);

await mongoose.connection.close();
process.exit(0);