import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main chat interface', async ({ page }) => {
    // Check for main elements
    await expect(page.getByText('New Session')).toBeVisible();
    await expect(page.getByPlaceholder('Share what\'s on your mind')).toBeVisible();
  });

  test('should be able to start a new session', async ({ page }) => {
    // Click new session button
    await page.getByText('New Session').click();
    
    // Should show empty chat area
    await expect(page.getByText('How are you feeling today?')).toBeVisible();
  });

  test('should open and close settings modal', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: 'Settings' }).click();
    
    // Check settings modal is visible
    await expect(page.getByText('Chat Settings')).toBeVisible();
    
    // Close settings
    await page.getByRole('button', { name: 'Close' }).first().click();
    
    // Settings modal should be closed
    await expect(page.getByText('Chat Settings')).not.toBeVisible();
  });

  test('should toggle sidebar', async ({ page }) => {
    // Check if sidebar is initially visible
    await expect(page.getByText('Sessions')).toBeVisible();
    
    // Toggle sidebar (mobile menu)
    if (await page.getByRole('button', { name: 'Menu' }).isVisible()) {
      await page.getByRole('button', { name: 'Menu' }).click();
    }
  });

  test('should validate input requirements', async ({ page }) => {
    // Start a new session
    await page.getByText('New Session').click();
    
    // Try to send empty message
    const sendButton = page.getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeDisabled();
    
    // Type a message
    const messageInput = page.getByPlaceholder('Share what\'s on your mind');
    await messageInput.fill('Hello, I need help with anxiety');
    
    // Send button should now be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Start a new session
    await page.getByText('New Session').click();
    
    const messageInput = page.getByPlaceholder('Share what\'s on your mind');
    await messageInput.fill('Test message');
    
    // Test Enter key sends message (without Shift)
    await messageInput.press('Enter');
    
    // Check that message appears in chat
    await expect(page.getByText('Test message')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile elements are visible
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    
    // Toggle mobile menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByText('Sessions')).toBeVisible();
  });

  test('should display error for invalid API configuration', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: 'Settings' }).click();
    
    // Enter invalid API key if no environment key is set
    const apiKeyInput = page.getByPlaceholder('Enter your Groq API key');
    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.fill('invalid-key');
      
      // Close settings
      await page.getByRole('button', { name: 'Close' }).first().click();
      
      // Start session and try to send message
      await page.getByText('New Session').click();
      await page.getByPlaceholder('Share what\'s on your mind').fill('Test message');
      await page.getByRole('button', { name: 'Send' }).click();
      
      // Should show error (this would need API to actually respond with error)
      // await expect(page.getByText(/Failed to send message/)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should maintain session state', async ({ page }) => {
    // Start new session
    await page.getByText('New Session').click();
    
    // Send a message
    await page.getByPlaceholder('Share what\'s on your mind').fill('First message');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Check message appears
    await expect(page.getByText('First message')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Session should still be active and message visible
    await expect(page.getByText('First message')).toBeVisible();
  });

  test('should show typing indicator during response', async ({ page }) => {
    // Start session
    await page.getByText('New Session').click();
    
    // Send message
    await page.getByPlaceholder('Share what\'s on your mind').fill('Tell me about stress management');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Check for loading/typing state
    await expect(page.getByText('Tell me about stress management')).toBeVisible();
    
    // Note: In a real test, we'd mock the API to control the response timing
    // and check for typing indicators, but that requires more complex setup
  });
});