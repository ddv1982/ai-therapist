/**
 * Authentication Troubleshooting Test
 * 
 * Helps debug authentication flow issues by monitoring URL changes
 * and providing detailed guidance for completing 2FA.
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication Troubleshooting', () => {
  test('monitor authentication flow and provide guidance', async ({ page }) => {
    console.log('🔐 Authentication Flow Monitor');
    console.log('==============================');
    console.log('');
    
    // Navigate to application
    await page.goto('http://localhost:4000');
    
    let urlHistory: string[] = [];
    let authAttempts = 0;
    
    // Monitor URL changes
    page.on('response', async (response) => {
      if (response.url().includes('/auth/') || response.url().includes('localhost:4000')) {
        console.log(`📡 Network: ${response.status()} ${response.url()}`);
      }
    });
    
    // Function to check authentication progress
    async function checkAuthProgress() {
      const currentUrl = page.url();
      
      // Only log if URL changed
      if (!urlHistory.includes(currentUrl)) {
        urlHistory.push(currentUrl);
        console.log(`🌐 URL Changed: ${currentUrl}`);
        
        if (currentUrl.includes('/auth/verify')) {
          authAttempts++;
          console.log(`🔐 2FA Verification Screen (attempt ${authAttempts})`);
          console.log('   • Enter your 6-digit authentication code');
          console.log('   • Click the "Verify" button');
          console.log('   • Watch for URL change after verification');
          
          // Check for any error messages
          const errorMessages = await page.locator('text=/error|invalid|failed/i').count();
          if (errorMessages > 0) {
            console.log('❌ Possible error messages detected on auth screen');
          }
          
          // Check if form elements are present
          const codeInput = await page.locator('input[type="text"], input[placeholder*="code"], input[name*="code"]').count();
          const verifyButton = await page.locator('button:has-text("Verify"), button[type="submit"]').count();
          console.log(`   • Code input field: ${codeInput > 0 ? 'Found' : 'Not found'}`);
          console.log(`   • Verify button: ${verifyButton > 0 ? 'Found' : 'Not found'}`);
          
        } else if (currentUrl.includes('/auth/setup')) {
          console.log('🔧 Authentication Setup Screen');
          console.log('   • Complete the initial authentication setup');
          
        } else if (!currentUrl.includes('/auth/')) {
          console.log('✅ Successfully reached main application!');
          console.log(`   • Final URL: ${currentUrl}`);
          console.log('   • You can now test the CBT data display functionality');
          
          // Check for main app elements
          const chatElements = await page.locator('text=/chat|message|session/i').count();
          const cbtElements = await page.locator('text=/cbt|cognitive|therapy/i').count();
          console.log(`   • Chat-related elements: ${chatElements}`);
          console.log(`   • CBT-related elements: ${cbtElements}`);
          
          return true; // Authentication completed
        } else {
          console.log(`🤔 Unknown auth screen: ${currentUrl}`);
        }
      }
      
      return false; // Authentication still in progress
    }
    
    // Initial check
    console.log('🚀 Starting authentication flow monitoring...');
    await page.waitForTimeout(2000);
    await checkAuthProgress();
    
    // Monitor for authentication completion
    let authCompleted = false;
    let checkCount = 0;
    
    while (!authCompleted && checkCount < 720) { // 720 * 5 = 3600 seconds = 1 hour max
      await page.waitForTimeout(5000); // Check every 5 seconds
      checkCount++;
      
      try {
        authCompleted = await checkAuthProgress();
        
        if (checkCount % 12 === 0) { // Every minute
          console.log(`⏳ Monitoring for ${Math.floor(checkCount * 5 / 60)} minutes... (press Ctrl+C to stop)`);
        }
        
        // If stuck on verify screen for too long, provide additional help
        if (checkCount > 24 && page.url().includes('/auth/verify')) { // After 2 minutes
          console.log('');
          console.log('🆘 TROUBLESHOOTING HELP:');
          console.log('   • Double-check your authentication code');
          console.log('   • Try refreshing the page if stuck');
          console.log('   • Check browser console for JavaScript errors (F12)');
          console.log('   • Verify network requests are completing (Network tab)');
          console.log('');
        }
        
      } catch (error) {
        console.log(`⚠️ Error during monitoring: ${error}`);
      }
    }
    
    if (authCompleted) {
      console.log('');
      console.log('🎉 AUTHENTICATION SUCCESSFUL!');
      console.log('✅ You can now proceed to test CBT data display');
      console.log('📋 Next steps:');
      console.log('   1. Find the chat session titled "hi"');
      console.log('   2. Click on it to open the session');
      console.log('   3. Look for memory/report buttons');
      console.log('   4. Click them to load session reports');
      console.log('   5. Look for the yellow "CBT Data Diagnostic" box');
      console.log('');
    } else {
      console.log('⏰ Authentication monitoring timed out');
      console.log('🔄 Try running the test again or check authentication setup');
    }
    
    // Take a screenshot of final state
    await page.screenshot({ 
      path: '__tests__/e2e/screenshots/auth-final-state.png',
      fullPage: true 
    });
    console.log('📸 Final state screenshot saved to __tests__/e2e/screenshots/auth-final-state.png');
    
    // Always pass - this is a diagnostic test
    expect(true).toBe(true);
  });
});