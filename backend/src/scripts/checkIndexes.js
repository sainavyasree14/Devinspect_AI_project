import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const indexes = await mongoose.connection.collection('users').indexes();
console.log('Indexes on users collection:');
console.log(JSON.stringify(indexes, null, 2));
await mongoose.connection.close();
process.exit(0);