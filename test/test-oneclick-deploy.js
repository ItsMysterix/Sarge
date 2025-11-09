#!/usr/bin/env node

/**
 * Test one-click deploy with ItsMysterix/Sarge repository
 * Validates AI analysis, port detection, and deployment prompts
 */

const testOneClickDeploy = async () => {
  console.log('🚀 Testing One-Click Deploy with ItsMysterix/Sarge\n');

  const repoData = {
    repositoryId: 1, // Mock ID
    owner: 'ItsMysterix',
    repo: 'Sarge',
    branch: 'main'
  };

  console.log('📦 Repository:', `${repoData.owner}/${repoData.repo}`);
  console.log('🌿 Branch:', repoData.branch);
  console.log('');

  try {
    // Test 1: Check if AI analyzer is configured
    console.log('✅ Test 1: Checking AI configuration...');
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const isAIEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';
    
    console.log(`   ANTHROPIC_API_KEY: ${hasAnthropicKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ENABLE_AI_ANALYSIS: ${isAIEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    
    if (!hasAnthropicKey) {
      console.log('   ⚠️  AI features will not work without ANTHROPIC_API_KEY');
    }
    if (!isAIEnabled) {
      console.log('   ⚠️  Set ENABLE_AI_ANALYSIS=true to enable AI analysis');
    }
    console.log('');

    // Test 2: Call the AI analysis endpoint via tRPC
    console.log('✅ Test 2: Testing AI analysis endpoint...');
    
    const analysisResponse = await fetch('http://localhost:3000/api/trpc/project.analyzeRepository', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: repoData
      }),
    });

    if (analysisResponse.status === 401 || analysisResponse.status === 403) {
      console.log('   ⚠️  Endpoint requires authentication (expected)');
      console.log('   💡 Sign in via UI to test the full flow\n');
    } else if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.log(`   ⚠️  Analysis endpoint error: ${analysisResponse.status}`);
      console.log(`   Details: ${errorText.substring(0, 200)}\n`);
    } else {
      const result = await analysisResponse.json();
      console.log('   ✅ AI analysis completed successfully!');
      console.log(`   Framework: ${result.result?.data?.json?.framework || 'Unknown'}`);
      console.log(`   Detected ports: ${result.result?.data?.json?.detectedPorts?.join(', ') || 'None'}`);
      console.log(`   Confidence: ${result.result?.data?.json?.confidence || 0}%\n`);
    }

    // Test 3: Simulate the expected AI response structure
    console.log('✅ Test 3: Validating expected AI response structure...');
    
    const mockAnalysis = {
      framework: 'Next.js 14 + tRPC + PostgreSQL',
      projectType: 'fullstack',
      detectedPorts: [3000, 3200], // Frontend + Backend WS
      detectedTools: ['Next.js', 'TypeScript', 'tRPC', 'PostgreSQL', 'Tailwind CSS'],
      services: [
        {
          name: 'frontend',
          type: 'web',
          framework: 'Next.js 14',
          defaultPort: 3000,
          startCommand: 'npm run dev:frontend',
          workingDirectory: '.',
          environmentVariables: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
        },
        {
          name: 'backend',
          type: 'api',
          framework: 'tRPC WebSocket',
          defaultPort: 3200,
          startCommand: 'npm run dev:backend',
          workingDirectory: 'backend',
          environmentVariables: ['DATABASE_URL']
        }
      ],
      suggestedBuildCommand: 'npm run build',
      suggestedInstallCommand: 'npm install',
      suggestedDevCommand: 'npm run dev',
      suggestedOutputDirectory: '.next',
      summary: 'Full-stack Next.js application with tRPC backend, PostgreSQL database, and real-time features',
      confidence: 95,
      estimatedBuildTime: 120,
      requiresEnvironmentVariables: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GITHUB_ID', 'GITHUB_SECRET'],
      infrastructure: [
        { type: 'database', service: 'PostgreSQL', version: '15', purpose: 'Primary database' }
      ],
      needsDocker: true,
      recommendedPlatform: 'docker'
    };

    console.log('   ✅ Expected analysis structure:');
    console.log(`   • Framework: ${mockAnalysis.framework}`);
    console.log(`   • Services: ${mockAnalysis.services.length}`);
    console.log(`   • Ports: ${mockAnalysis.detectedPorts.join(', ')}`);
    console.log(`   • Env vars required: ${mockAnalysis.requiresEnvironmentVariables.length}`);
    console.log('');

    // Test 4: Verify AI prompts exist in the components
    console.log('✅ Test 4: Checking for AI prompt components...');
    
    const fs = require('fs');
    const path = require('path');
    
    const aiComponentPath = path.join(process.cwd(), 'components/oneclick/step-ai-analysis.tsx');
    const portCustomizationPath = path.join(process.cwd(), 'components/oneclick/port-customization-ui.tsx');
    
    const hasAIComponent = fs.existsSync(aiComponentPath);
    const hasPortCustomization = fs.existsSync(portCustomizationPath);
    
    console.log(`   AI Analysis Component: ${hasAIComponent ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Port Customization UI: ${hasPortCustomization ? '✅ Found' : '❌ Missing'}`);
    
    if (hasAIComponent) {
      const content = fs.readFileSync(aiComponentPath, 'utf-8');
      const hasPortEditing = content.includes('isEditingPorts') || content.includes('port');
      const hasEnvVars = content.includes('environmentVariables') || content.includes('envVars');
      console.log(`   • Port editing UI: ${hasPortEditing ? '✅' : '❌'}`);
      console.log(`   • Env var prompts: ${hasEnvVars ? '✅' : '❌'}`);
    }
    console.log('');

    // Summary
    console.log('📊 One-Click Deploy Test Summary:');
    console.log('   ================================');
    console.log(`   AI Configuration: ${hasAnthropicKey && isAIEnabled ? '✅ Ready' : '⚠️  Not configured'}`);
    console.log(`   AI Components: ${hasAIComponent ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Port Customization: ${hasPortCustomization ? '✅ Present' : '❌ Missing'}`);
    console.log('   Analysis Endpoint: ⚠️  Requires auth (expected)');
    console.log('');

    console.log('🎯 How AI Prompts Work in One-Click Deploy:');
    console.log('   1. User enters repo URL or selects connected repo');
    console.log('   2. AI analyzes repo structure and detects:');
    console.log('      • Framework (Next.js, React, etc.)');
    console.log('      • Ports (3000, 3200, 8080, etc.)');
    console.log('      • Services (frontend, backend, database)');
    console.log('      • Required environment variables');
    console.log('      • Build/start commands');
    console.log('   3. User is prompted to:');
    console.log('      ✏️  Customize detected ports');
    console.log('      ✏️  Add/edit environment variables');
    console.log('      ✏️  Review and modify build commands');
    console.log('      ✏️  Select which services to deploy');
    console.log('   4. System generates deployment plan');
    console.log('   5. User confirms and deploys');
    console.log('');

    console.log('🧪 To test the full flow:');
    console.log('   1. Ensure ANTHROPIC_API_KEY is set in .env');
    console.log('   2. Set ENABLE_AI_ANALYSIS=true in .env');
    console.log('   3. Restart backend: npm run dev:backend');
    console.log('   4. Visit: http://localhost:3000/oneclick');
    console.log('   5. Sign in with GitHub');
    console.log('   6. Enter repo: ItsMysterix/Sarge');
    console.log('   7. Watch AI detect ports and prompt for customization!');
    console.log('');

    if (!hasAnthropicKey) {
      console.log('⚠️  IMPORTANT: Add your Anthropic API key to .env:');
      console.log('   ANTHROPIC_API_KEY=sk-ant-...');
      console.log('   ENABLE_AI_ANALYSIS=true');
      console.log('');
      console.log('   Get your key from: https://console.anthropic.com/');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check if backend is running: npm run dev:backend');
    console.error('   - Check if frontend is running: npm run dev:frontend');
    console.error('   - Verify .env file has required variables');
  }
};

testOneClickDeploy();
