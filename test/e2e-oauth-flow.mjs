#!/usr/bin/env node

/**
 * E2E OAuth Flow Test
 * Simulates the complete GitHub OAuth flow to identify where it breaks
 */

import { chromium } from 'playwright';

const PROD_URL = 'https://v0-sarge.vercel.app';
const TEST_URL = process.env.TEST_URL || PROD_URL;

console.log('🚀 Starting E2E OAuth Flow Test');
console.log('📍 Target URL:', TEST_URL);
console.log('');

async function testOAuthFlow() {
  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: 500 // Slow down to see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error('🔴 [BROWSER ERROR]', text);
    } else if (type === 'warning') {
      console.warn('⚠️  [BROWSER WARN]', text);
    } else if (text.includes('[AUTH') || text.includes('[SIGNIN') || text.includes('[JWT') || text.includes('[SESSION')) {
      console.log('📋 [BROWSER]', text);
    }
  });
  
  // Track requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/auth') || url.includes('/api/projects')) {
      console.log('📤 [REQUEST]', request.method(), url);
    }
  });
  
  // Track responses
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('/api/auth') || url.includes('/api/projects')) {
      const icon = status >= 400 ? '❌' : status >= 300 ? '🔄' : '✅';
      console.log(`📥 [RESPONSE] ${icon} ${status}`, url);
    }
  });
  
  try {
    // Step 1: Navigate to homepage
    console.log('\n📍 Step 1: Loading homepage...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const currentUrl1 = page.url();
    console.log('✅ Current URL:', currentUrl1);
    
    if (currentUrl1.includes('/sign-in')) {
      console.log('✅ Redirected to sign-in (not authenticated)');
    }
    
    // Step 2: Check if GitHub sign-in button exists
    console.log('\n📍 Step 2: Looking for GitHub sign-in button...');
    await page.waitForTimeout(1000);
    
    const githubButton = await page.locator('button:has-text("Sign in with GitHub"), button:has-text("GitHub"), [data-provider="github"]').first();
    const buttonExists = await githubButton.count() > 0;
    
    if (buttonExists) {
      console.log('✅ GitHub sign-in button found');
      
      // Step 3: Click sign-in button
      console.log('\n📍 Step 3: Clicking GitHub sign-in button...');
      await githubButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl2 = page.url();
      console.log('✅ Redirected to:', currentUrl2);
      
      if (currentUrl2.includes('github.com')) {
        console.log('✅ Redirected to GitHub OAuth authorization page');
        console.log('');
        console.log('🔍 You should now manually authorize the app in the browser window.');
        console.log('🔍 After authorization, watch the console for callback logs...');
        console.log('');
        
        // Wait for callback
        await page.waitForURL(url => !url.includes('github.com'), { timeout: 60000 });
        
        const currentUrl3 = page.url();
        console.log('\n✅ Returned from GitHub to:', currentUrl3);
        
        // Wait for authentication to complete
        await page.waitForTimeout(3000);
        
        // Step 4: Check if session exists
        console.log('\n📍 Step 4: Checking session...');
        const sessionResponse = await page.request.get(`${TEST_URL}/api/auth/session`);
        const sessionData = await sessionResponse.json();
        
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
        
        if (sessionData && sessionData.user) {
          console.log('\n✅✅✅ SUCCESS! User is authenticated:');
          console.log('   User ID:', sessionData.user.id || 'N/A');
          console.log('   Email:', sessionData.user.email || 'N/A');
          console.log('   Name:', sessionData.user.name || 'N/A');
          
          // Step 5: Try accessing protected route
          console.log('\n📍 Step 5: Testing protected route access...');
          const finalUrl = page.url();
          
          if (finalUrl.includes('/sign-in')) {
            console.error('\n❌❌❌ FAILED! Still on sign-in page despite having session');
            console.error('This suggests middleware is not recognizing the session cookie');
          } else {
            console.log('✅ Able to access protected routes');
          }
        } else {
          console.error('\n❌❌❌ FAILED! No session found after OAuth');
          console.error('Session response:', sessionData);
        }
        
      } else if (currentUrl2.includes('/api/auth/error')) {
        console.error('❌ OAuth error - redirected to error page');
        console.error('URL:', currentUrl2);
        const pageContent = await page.content();
        console.error('Error details:', pageContent.slice(0, 500));
      } else {
        console.error('❌ Unexpected redirect after clicking sign-in');
        console.error('URL:', currentUrl2);
      }
      
    } else {
      console.error('❌ GitHub sign-in button not found');
      console.error('Page HTML:', await page.content());
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n⏸️  Keeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
    console.log('✅ Browser closed');
  }
}

testOAuthFlow().catch(console.error);
