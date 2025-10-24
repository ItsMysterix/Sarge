#!/usr/bin/env node
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');
const { execFileSync } = require('child_process');

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v;
}

function warnEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) return undefined;
  return v;
}

function checkCompose(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    let inServices = false;
    const serviceKeys = new Set();
    for (const line of lines) {
      if (/^services:\s*$/.test(line)) { inServices = true; continue; }
      if (inServices) {
        if (/^\S/.test(line)) break;
        const m = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*$/);
        if (m) serviceKeys.add(m[1]);
      }
    }
    const required = ['nginx', 'backend', 'app'];
    const missing = required.filter(k => !serviceKeys.has(k));
    if (missing.length) {
      return { name: 'compose services present', ok: false, message: `missing services: ${missing.join(', ')}` };
    }
    return { name: 'compose services present', ok: true };
  } catch (e) {
    return { name: 'compose parse', ok: false, message: e?.message || String(e) };
  }
}

function checkNginxConf(filePath) {
  try {
    const conf = readFileSync(filePath, 'utf8');
    const hasUpgrade = /proxy_set_header\s+Upgrade\s+\$http_upgrade;/.test(conf);
    const hasConn = /Connection\s+"?Upgrade"?/.test(conf) || /proxy_set_header\s+Connection\s+\"upgrade\";/.test(conf);
    const hasCert = /ssl_certificate\s+\S+;/.test(conf);
    const hasKey = /ssl_certificate_key\s+\S+;/.test(conf);
    const missing = [];
    if (!hasUpgrade) missing.push('websocket Upgrade header');
    if (!hasConn) missing.push('Connection upgrade header');
    if (!hasCert) missing.push('ssl_certificate');
    if (!hasKey) missing.push('ssl_certificate_key');
    if (missing.length) return { name: 'nginx.conf checks', ok: false, message: `missing: ${missing.join(', ')}` };
    return { name: 'nginx.conf checks', ok: true };
  } catch (e) {
    return { name: 'nginx.conf read', ok: false, message: e?.message || String(e) };
  }
}

function checkMigrateScript() {
  try {
    const primary = resolve(process.cwd(), 'backend/dist/scripts/migrate.js');
    const alt = resolve(process.cwd(), 'backend/scripts/migrate.js');
    const src = resolve(process.cwd(), 'backend/scripts/migrate.ts');
    if (existsSync(primary)) {
      execFileSync('node', [primary, '--dry-run'], { stdio: ['ignore', 'pipe', 'pipe'] });
      return { name: 'migrate dry-run', ok: true };
    }
    if (existsSync(alt)) {
      execFileSync('node', [alt, '--dry-run'], { stdio: ['ignore', 'pipe', 'pipe'] });
      return { name: 'migrate dry-run', ok: true };
    }
    if (existsSync(src)) {
      return { name: 'migrate presence', ok: true, message: 'ts source present; js not built (dry-run skipped)' };
    }
    return { name: 'migrate presence', ok: false, message: 'no migrate script found (dist/scripts/migrate.js or scripts/migrate.ts)' };
  } catch (e) {
    return { name: 'migrate dry-run', ok: false, message: e?.message || String(e) };
  }
}

function main() {
  const results = [];
  let hadError = false;

  const missing = [];
  try { requireEnv('REPO'); } catch { missing.push('REPO'); }
  try { requireEnv('AWS_REGION'); } catch { missing.push('AWS_REGION'); }
  if (missing.length) {
    hadError = true;
    console.error(`❌ Missing required env: ${missing.join(', ')}`);
  }
  const optWarns = [];
  if (!warnEnv('EC2_SSM_TARGET')) optWarns.push('EC2_SSM_TARGET');
  if (!warnEnv('GHCR_PAT_PARAM')) optWarns.push('GHCR_PAT_PARAM');
  if (optWarns.length) {
    console.warn(`⚠️ Optional env not set: ${optWarns.join(', ')}`);
  }

  results.push(checkCompose(resolve(process.cwd(), 'compose.prod.yaml')));
  results.push(checkNginxConf(resolve(process.cwd(), 'ops/nginx/nginx.conf')));
  results.push(checkMigrateScript());

  for (const r of results) {
    if (r.ok) {
      if (r.message) console.log(`✅ ${r.name} — ${r.message}`);
      else console.log(`✅ ${r.name}`);
    } else {
      hadError = true;
      console.error(`❌ ${r.name}: ${r.message || 'failed'}`);
    }
  }

  if (hadError) {
    console.error('\nPreflight validation failed. Fix the above items and re-run.');
    process.exit(1);
  } else {
    console.log('\nPreflight validation passed. Release is safe to run.');
  }
}

main();
