/**
 * Enhanced Authentication Flow Test
 * 
 * This test specifically monitors the authentication flow from 2FA completion
 * through to successful main app access, with detailed logging and debugging.
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication Flow Testing', () => {
  test('complete authentication flow and access main app', async ({ page }) => {
    console.log('🔐 Starting enhanced authentication flow test');
    console.log('==========================================');
    
    // Set up console logging to capture browser-side messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Verification successful') || 
          text.includes('Redirect attempt') || 
          text.includes('Authentication') ||
          text.includes('Auth check') ||
          text.includes('Cookies')) {
        console.log(`🌐 BROWSER: ${text}`);
      }
    });
    
    // Monitor network requests related to authentication
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/auth/') || url.includes('/auth/')) {
        console.log(`📡 NETWORK: ${response.status()} ${url}`);
      }
    });
    
    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:4000');
    
    // Wait for initial page load and check where we land
    await page.waitForTimeout(2000);
    const initialUrl = page.url();
    console.log(`🌐 Initial URL: ${initialUrl}`);
    
    if (initialUrl.includes('/auth/verify')) {
      console.log('🔐 Detected 2FA verification screen');
      console.log('');
      console.log('📋 INSTRUCTIONS:');
      console.log('1. Enter your 6-digit authentication code');
      console.log('2. Click the "Verify" button');
      console.log('3. Wait for the redirect (this test will monitor it)');
      console.log('4. The test will automatically continue once authenticated');
      console.log('');
      
      // Wait for authentication completion by monitoring URL changes
      let authCompleted = false;
      let urlChangeCount = 0;
      let lastUrl = initialUrl;
      
      console.log('⏳ Monitoring for authentication completion...');
      
      while (!authCompleted && urlChangeCount < 60) { // 60 * 2 = 120 seconds max
        await page.waitForTimeout(2000); // Check every 2 seconds
        urlChangeCount++;
        
        const currentUrl = page.url();
        
        // Log URL changes
        if (currentUrl !== lastUrl) {
          console.log(`🔄 URL changed: ${lastUrl} → ${currentUrl}`);
          lastUrl = currentUrl;
        }
        
        // Check if we've moved away from auth screens
        if (!currentUrl.includes('/auth/')) {
          authCompleted = true;
          console.log('✅ Authentication completed! Reached main application');
          console.log(`📍 Final URL: ${currentUrl}`);
          break;
        }
        
        // Provide progress updates
        if (urlChangeCount % 15 === 0) { // Every 30 seconds
          console.log(`⏳ Still waiting for authentication completion... (${urlChangeCount * 2}s elapsed)`);
          
          // Check for any error messages on the auth screen
          try {
            const errorElements = await page.locator('text=/error|invalid|failed/i').count();
            if (errorElements > 0) {
              const errorText = await page.locator('text=/error|invalid|failed/i').first().textContent();
              console.log(`❌ Possible error detected: ${errorText}`);
            }
          } catch (e) {
            // Ignore errors when checking for error messages
          }
        }
      }
      
      if (!authCompleted) {
        console.log('⏰ Authentication monitoring timed out');
        console.log('🔄 This may indicate an issue with the authentication flow');
        
        // Take a screenshot for debugging
        await page.screenshot({ 
          path: '__tests__/e2e/screenshots/auth-timeout.png',
          fullPage: true 
        });
        console.log('📸 Timeout screenshot saved to __tests__/e2e/screenshots/auth-timeout.png');
        
        // Fail the test with helpful information
        expect(authCompleted).toBe(true);
        return;
      }
    } else {
      console.log('✅ Already authenticated or no auth required');
      console.log(`📍 Current URL: ${initialUrl}`);
    }
    
    // Wait a moment for the app to fully load
    await page.waitForTimeout(3000);
    
    // Verify we're in the main application
    const finalUrl = page.url();
    console.log('');
    console.log('🎉 AUTHENTICATION FLOW COMPLETED!');
    console.log(`📍 Final URL: ${finalUrl}`);
    
    // Verify we're not on any auth screens
    expect(finalUrl).not.toContain('/auth/');
    
    // Check for main app elements
    console.log('🔍 Checking for main application elements...');
    
    // Wait for main app to load
    await page.waitForTimeout(2000);
    
    // Look for chat interface elements
    const chatElements = await page.locator('text=/chat|message|session/i').count();
    const appElements = await page.locator('text=/AI Therapist|therapy|therapeutic/i').count();
    
    console.log(`💬 Chat-related elements found: ${chatElements}`);
    console.log(`🏥 App-related elements found: ${appElements}`);
    
    // We should have some main app content
    expect(chatElements + appElements).toBeGreaterThan(0);
    
    // Now test the CBT data display functionality
    console.log('');
    console.log('🧠 Testing CBT data display functionality...');
    
    // Look for session with title "hi"
    const hiSession = page.locator('text="hi"').first();
    const hiSessionExists = await hiSession.count() > 0;
    
    if (hiSessionExists) {
      console.log('✅ Found "hi" session, clicking it...');
      await hiSession.click();
      await page.waitForTimeout(2000);
      
      // Look for memory/report buttons
      const memoryButtons = await page.locator('text=/memory|report|session.*report/i').count();
      console.log(`📋 Memory/report buttons found: ${memoryButtons}`);
      
      if (memoryButtons > 0) {
        // Click on a memory/report button
        const memoryButton = page.locator('text=/memory|report|session.*report/i').first();
        console.log('🔍 Clicking memory/report button...');
        await memoryButton.click();
        await page.waitForTimeout(3000);
        
        // Check for CBT diagnostic component
        const diagnosticComponent = await page.locator('text="CBT Data Diagnostic"').count();
        console.log(`🔧 CBT Diagnostic component found: ${diagnosticComponent}`);
        
        // Check for CBT data display elements
        const cbtElements = await page.locator('[data-testid*="cbt"]').count();
        console.log(`🧠 CBT data elements found: ${cbtElements}`);
        
        // Check for tables
        const tables = await page.locator('table').count();
        console.log(`📊 Tables found: ${tables}`);
        
        if (tables > 0) {
          console.log('📋 Analyzing table content...');
          for (let i = 0; i < Math.min(tables, 3); i++) {
            const tableText = await page.locator('table').nth(i).textContent();
            const content = tableText?.replace(/\s+/g, ' ').trim() || '';
            console.log(`  Table ${i + 1}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
          }
        }
      } else {
        console.log('⚠️  No memory/report buttons found');
      }
    } else {
      console.log('⚠️  "hi" session not found');
    }
    
    // Take a final screenshot
    await page.screenshot({ 
      path: '__tests__/e2e/screenshots/auth-flow-complete.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved to __tests__/e2e/screenshots/auth-flow-complete.png');
    
    console.log('');
    console.log('✅ Authentication flow test completed successfully!');
    console.log('==========================================');
  });
  
  test('quick auth status check', async ({ page }) => {
    console.log('🔍 Quick authentication status check...');
    
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const title = await page.title();
    
    console.log(`📍 URL: ${url}`);
    console.log(`📄 Title: ${title}`);
    
    if (url.includes('/auth/')) {
      console.log('🔐 Authentication required');
      
      // Check what type of auth screen
      const setupElements = await page.locator('text=/setup|configure/i').count();
      const verifyElements = await page.locator('text=/verify|authentication.*code/i').count();
      
      if (setupElements > 0) {
        console.log('🔧 On setup screen - TOTP needs to be configured');
      } else if (verifyElements > 0) {
        console.log('🔑 On verification screen - 2FA code needed');
      } else {
        console.log('❓ Unknown auth screen type');
      }
    } else {
      console.log('✅ Already authenticated - on main app');
      
      // Quick check for main app elements
      const chatElements = await page.locator('text=/chat|session/i').count();
      console.log(`💬 Chat elements: ${chatElements}`);
    }
    
    expect(true).toBe(true); // Always pass - this is just for status checking
  });
});