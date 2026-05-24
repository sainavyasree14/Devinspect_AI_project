// dotenv is loaded inside app.js → env.js (must stay there, not here)
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('SIGINT',  async () => { await mongoose.connection.close(); process.exit(0); });

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 DevInspectAI API running on http://localhost:${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured'}`);
    console.log(`🔑 GitHub OAuth: ${process.env.GITHUB_CLIENT_ID ? 'configured' : 'NOT configured'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`❌ Port ${PORT} already in use`);
    else console.error('❌ Server error:', err);
    process.exit(1);
  });
};

startServer();
