/**
 * Utility to generate a short chat title from the first user message.
 * - Max 80 characters
 * - No quotes or colons
 * - Falls back to truncating the message if AI fails
 */

import { generateText } from 'ai';
import { defaultModel, languageModels } from '@/ai/providers';
import type { AppLocale } from '@/i18n/config';

export async function generateChatTitle(
  firstMessage: string,
  locale: AppLocale = 'en'
): Promise<string> {
  try {
    const prompt =
      locale === 'nl'
        ? `Vat het volgende bericht samen tot een korte chattitel in het Nederlands.
- Maximaal 80 tekens.
- Geen aanhalingstekens of dubbele punten.
- Alleen de titel als output.

Bericht: ${firstMessage}`
        : `Summarize the following user message into a short chat title in English.
- Do not exceed 80 characters.
- Do not use quotes or colons.
- Output only the title.

Message: ${firstMessage}`;

    const aiResponse = await generateText({
      model: languageModels[defaultModel],
      prompt,
    });

    let title = aiResponse.text.trim();

    // Enforce constraints
    if (title.length > 80) {
      title = title.slice(0, 80);
    }
    title = title.replace(/["“”':]/g, '').trim();

    if (!title) {
      throw new Error('Empty AI title');
    }

    return title;
  } catch {
    // Fallback: truncate first message
    return firstMessage.slice(0, 80);
  }
}
