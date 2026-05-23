import 'dotenv/config';

const BASE = 'http://localhost:5000/api';
const testEmail = `testuser_${Date.now()}@example.com`;

console.log('Testing register with:', testEmail);

try {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'Test1234!' }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Fetch error (is backend running?):', err.message);
}