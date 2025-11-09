// Quick auth test script
const https = require('https');

const testEndpoints = [
  '/api/auth/providers',
  '/api/auth/csrf',
  '/api/auth/session',
];

const baseUrl = 'https://v0-sarge.vercel.app';

console.log('🔍 Testing Auth.js endpoints on production...\n');

testEndpoints.forEach(endpoint => {
  https.get(`${baseUrl}${endpoint}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`${endpoint}: ${res.statusCode}`);
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        console.log(data);
      }
      console.log('---\n');
    });
  }).on('error', err => {
    console.error(`${endpoint}: ERROR`, err.message);
    console.log('---\n');
  });
});
