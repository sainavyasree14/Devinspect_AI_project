// MUST be imported first — loads .env before any other module reads process.env
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from backend root (one level up from src/)
config({ path: resolve(__dirname, '../.env') });

// Validate critical vars and log status
const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] FATAL: ${key} is not set in .env`);
    process.exit(1);
  }
}

// Optional AI keys — warn but never crash
const optionalAI = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY'];
const availableAI = optionalAI.filter(k => process.env[k]);
if (availableAI.length === 0) {
  console.warn('[ENV] WARNING: No AI API keys set (GROQ_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY). Analysis will run in fallback mode.');
} else {
  console.log(`[ENV] AI engines available: ${availableAI.join(', ')}`);
}

console.log('[ENV] Loaded — JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'MISSING');
console.log('[ENV] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'OK' : 'MISSING');
console.log('[ENV] GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'OK' : 'MISSING');
console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
