#!/usr/bin/env node
const http = require('http');

const port = Number(process.env.METRICS_PORT || 9464);
const host = process.env.METRICS_HOST || '127.0.0.1';

function check() {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: host, port, path: '/metrics', timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (body.includes('requests_total')) {
          return resolve();
        }
        return reject(new Error('Metric requests_total not found in response'));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

check()
  .then(() => {
    console.log(`OK: metrics available at http://${host}:${port}/metrics`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  });
