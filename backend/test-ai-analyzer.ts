#!/usr/bin/env ts-node
/**
 * Test script for AI Repository Analyzer
 * 
 * Usage:
 *   ANTHROPIC_API_KEY=your-key ts-node backend/test-ai-analyzer.ts
 */

import { getAIAnalyzer } from './src/api/lib/ai-analyzer';

async function main() {
  console.log('🤖 AI Repository Analyzer Test\n');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    console.error('   Get your key from: https://console.anthropic.com/');
    console.error('\nUsage:');
    console.error('   ANTHROPIC_API_KEY=your-key ts-node backend/test-ai-analyzer.ts\n');
    process.exit(1);
  }

  try {
    const analyzer = getAIAnalyzer();
    
    console.log('📦 Analyzing repository: vercel/next.js\n');
    console.log('⏳ This may take 30-60 seconds...\n');
    
    const startTime = Date.now();
    
    const result = await analyzer.analyzeRepository('vercel', 'next.js', 'canary');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ Analysis Complete!\n');
    console.log('─'.repeat(60));
    console.log(`Framework:        ${result.framework}`);
    console.log(`Confidence:       ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`Detected Ports:   ${result.detectedPorts.join(', ')}`);
    console.log(`Tools:            ${result.detectedTools.join(', ')}`);
    console.log(`\nBuild Commands:`);
    console.log(`  Install:  ${result.suggestedInstallCommand}`);
    console.log(`  Build:    ${result.suggestedBuildCommand}`);
    console.log(`  Dev:      ${result.suggestedDevCommand}`);
    console.log(`  Output:   ${result.suggestedOutputDirectory}`);
    console.log(`\nEnvironment Variables:`);
    if (result.requiresEnvironmentVariables.length > 0) {
      result.requiresEnvironmentVariables.forEach(env => {
        console.log(`  - ${env}`);
      });
    } else {
      console.log(`  (none detected)`);
    }
    console.log(`\nSummary:\n  ${result.summary}`);
    console.log(`\nEstimated Build Time: ${result.estimatedBuildTime}s`);
    console.log(`Analysis Duration:    ${duration}s`);
    console.log('─'.repeat(60));
    console.log('\n✨ Test passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('\nError details:', error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
