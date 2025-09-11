import { test, expect } from '@playwright/test';

// Basic happy-path: Situation -> Emotions -> Thoughts
// Assumes the app is running and test environment uses a seeded account or unauth flow for CBT diary

test.describe('CBT Diary Flow', () => {
  test('progresses to next step after each completion', async ({ page }) => {
    await page.goto('/cbt-diary');

    // Start the flow
    await page.getByRole('button', { name: /begin|resume/i }).first().click({ timeout: 15000 });

    // Situation step visible (textarea present)
    const situationTextarea = page.getByRole('textbox');
    await expect(situationTextarea).toBeVisible();
    await situationTextarea.fill('A brief description of a situation for testing.');

    // Continue to Emotions
    await page.getByRole('button', { name: /continue to emotions/i }).click();

    // Emotions component should appear (look for an emotion label or slider)
    await expect(page.getByText(/Fear|Anger|Sadness|Joy/i).first()).toBeVisible();

    // Select an emotion by clicking the first card
    const emotionCard = page.locator('div').filter({ hasText: /Fear|Anger|Sadness|Joy/i }).first();
    await emotionCard.click();

    // Continue to Thoughts
    await page.getByRole('button', { name: /continue to thoughts/i }).click();

    // Thoughts component visible (look for thought input)
    await expect(page.getByText(/Automatic Thoughts|What thoughts went through your mind/i)).toBeVisible();
  });
});

