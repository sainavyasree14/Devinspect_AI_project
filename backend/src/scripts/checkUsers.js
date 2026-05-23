import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to:', mongoose.connection.host);

const users = await mongoose.connection.collection('users').find({}, { projection: { email: 1, _id: 1, createdAt: 1 } }).toArray();
console.log('Total users in DB:', users.length);
users.forEach(u => console.log(`  id=${u._id}  email="${u.email}"  created=${u.createdAt}`));

await mongoose.connection.close();
process.exit(0);