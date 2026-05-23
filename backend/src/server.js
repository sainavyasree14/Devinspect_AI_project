import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

console.log('🔍 Environment Check:');
console.log(`   PORT:         ${process.env.PORT || '5000'}`);
console.log(`   NODE_ENV:     ${process.env.NODE_ENV || 'not set'}`);
console.log(`   MONGO_URI:    ${process.env.MONGO_URI ? 'configured' : 'NOT CONFIGURED'}`);
console.log(`   JWT_SECRET:   ${process.env.JWT_SECRET ? 'configured' : 'NOT CONFIGURED'}`);
console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'configured' : 'not set — fallback mode'}`);

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 DevInspectAI API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI: ${process.env.GROQ_API_KEY ? 'Groq ready' : 'Fallback mode'}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} already in use`);
    } else {
      console.error(`❌ Server error:`, error);
    }
    process.exit(1);
  });
};

startServer();