import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to:', mongoose.connection.host);

const collection = mongoose.connection.collection('users');

try {
  await collection.dropIndex('apiKey_1');
  console.log('✅ Dropped rogue unique index: apiKey_1');
} catch (err) {
  if (err.codeName === 'IndexNotFound') {
    console.log('ℹ️  Index apiKey_1 does not exist — nothing to drop');
  } else {
    console.error('❌ Error dropping index:', err.message);
  }
}

const indexes = await collection.indexes();
console.log('\nRemaining indexes:');
indexes.forEach(i => console.log(' ', i.name, JSON.stringify(i.key), i.unique ? '(unique)' : ''));

await mongoose.connection.close();
process.exit(0);