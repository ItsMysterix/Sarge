#!/usr/bin/env node
/**
 * Test One-Click Detection
 * Tests the one-click detection with ItsMysterix/Sarge repo
 */

const { neon } = require('@neondatabase/serverless');
const path = require('path');

const TEST_EMAIL = 'test@sarge.dev';
const REPO_OWNER = 'ItsMysterix';
const REPO_NAME = 'Sarge';

async function testOneClickDetection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🧪 Testing One-Click Detection Flow\n');

  const sql = neon(databaseUrl);

  try {
    // Step 1: Get repository from database
    console.log('📋 Step 1: Fetching repository from database...');
    const user = await sql`SELECT id FROM users WHERE email = ${TEST_EMAIL}`;
    if (user.length === 0) {
      console.log('❌ No test user found. Run: node test/test-database-direct.js');
      process.exit(1);
    }
    const userId = user[0].id;

    const repo = await sql`
      SELECT r.* 
      FROM repositories r
      WHERE r.user_id = ${userId} 
        AND r.owner = ${REPO_OWNER} 
        AND r.repo = ${REPO_NAME}
      LIMIT 1
    `;

    if (repo.length === 0) {
      console.log('❌ Repository not connected. Run: node test/test-database-direct.js');
      process.exit(1);
    }

    console.log(`✅ Repository found: ${repo[0].full_name}`);
    console.log('');

    // Step 2: Simulate detection (what the UI would show)
    console.log('📋 Step 2: Simulating repository detection...');
    console.log('   Repository: ' + repo[0].full_name);
    console.log('   Owner: ' + repo[0].owner);
    console.log('   Repo: ' + repo[0].repo);
    console.log('');

    // Step 3: Fetch repository structure from GitHub
    console.log('📋 Step 3: Analyzing repository structure...');
    
    // Check for key files
    const files = [
      'package.json',
      'Dockerfile',
      'docker-compose.yml',
      '.env.example',
      'backend/package.json',
    ];

    const fileChecks = await Promise.all(
      files.map(async (file) => {
        try {
          const url = `https://api.github.com/repos/${repo[0].owner}/${repo[0].repo}/contents/${file}`;
          const response = await fetch(url);
          return { file, exists: response.ok };
        } catch {
          return { file, exists: false };
        }
      })
    );

    console.log('   File detection:');
    fileChecks.forEach(({ file, exists }) => {
      console.log(`     ${exists ? '✅' : '❌'} ${file}`);
    });
    console.log('');

    // Step 4: Fetch package.json to detect services
    console.log('📋 Step 4: Detecting services and dependencies...');
    
    const pkgResponse = await fetch(
      `https://api.github.com/repos/${repo[0].owner}/${repo[0].repo}/contents/package.json`
    );

    if (pkgResponse.ok) {
      const pkgData = await pkgResponse.json();
      const pkgContent = JSON.parse(Buffer.from(pkgData.content, 'base64').toString('utf-8'));
      
      console.log(`   Package name: ${pkgContent.name}`);
      console.log(`   Version: ${pkgContent.version}`);
      console.log('');

      // Detect frameworks
      console.log('   Detected frameworks:');
      const deps = { ...pkgContent.dependencies, ...pkgContent.devDependencies };
      const frameworks = {
        'Next.js': deps.next,
        'React': deps.react,
        'Express': deps.express,
        'TypeScript': deps.typescript,
      };
      Object.entries(frameworks).forEach(([name, version]) => {
        if (version) {
          console.log(`     ✅ ${name} (${version})`);
        }
      });
      console.log('');

      // Detect AWS SDKs
      console.log('   Detected AWS services:');
      const awsPackages = Object.keys(deps).filter(k => k.startsWith('@aws-sdk/'));
      awsPackages.forEach(pkg => {
        const serviceName = pkg.replace('@aws-sdk/client-', '');
        console.log(`     ✅ ${serviceName} (${deps[pkg]})`);
      });
      console.log('');

      // Detect ports from scripts
      console.log('   Analyzing ports from scripts:');
      const scripts = pkgContent.scripts || {};
      const portMatches = JSON.stringify(scripts).match(/(?:-p|--port)\s+(\d{2,5})|PORT[=:]\s*(\d{2,5})/g) || [];
      if (portMatches.length > 0) {
        portMatches.forEach(match => {
          const port = match.match(/(\d{2,5})/)?.[1];
          if (port) {
            console.log(`     🔌 Port ${port} detected`);
          }
        });
      } else {
        console.log('     ℹ️  No explicit ports found, will use defaults');
      }
      console.log('');

      // Suggested services
      console.log('   Suggested deployment configuration:');
      const services = [];
      
      if (deps.next) {
        services.push({
          name: 'frontend',
          type: 'web',
          ports: [3000],
          command: scripts.dev || 'next dev'
        });
      }
      
      // Check for backend
      try {
        const backendPkgResponse = await fetch(
          `https://api.github.com/repos/${repo[0].owner}/${repo[0].repo}/contents/backend/package.json`
        );
        if (backendPkgResponse.ok) {
          const backendPkgData = await backendPkgResponse.json();
          const backendPkgContent = JSON.parse(Buffer.from(backendPkgData.content, 'base64').toString('utf-8'));
          const backendScripts = backendPkgContent.scripts || {};
          
          services.push({
            name: 'backend',
            type: 'api',
            ports: [3200],
            command: backendScripts.dev || backendScripts.start || 'npm start'
          });
        }
      } catch {}

      services.forEach((svc, idx) => {
        console.log(`     ${idx + 1}. ${svc.name} (${svc.type})`);
        console.log(`        Command: ${svc.command}`);
        console.log(`        Default ports: ${svc.ports.join(', ')}`);
      });
      console.log('');
    }

    // Step 5: What happens next in UI
    console.log('='.repeat(60));
    console.log('✅ One-Click Detection Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 What the UI should show:');
    console.log('   1. Detected services list with types');
    console.log('   2. Port configuration editor (allow user to change)');
    console.log('   3. Environment variables needed');
    console.log('   4. AWS resources that will be emulated');
    console.log('   5. "Customize Ports" button');
    console.log('   6. "Deploy" button (only enabled after ports confirmed)');
    console.log('');
    console.log('🎯 Next Step: User should be able to:');
    console.log('   - Review detected services');
    console.log('   - Customize port assignments');
    console.log('   - Provide environment variables');
    console.log('   - Click deploy to start local services');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOneClickDetection();
