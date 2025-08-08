import { processMarkdown } from '@/lib/markdown-processor';

describe('Markdown Processor with sanitize-html', () => {
  describe('Basic markdown patterns', () => {
    it('should convert headers to HTML', () => {
      const input = `# Main Header
## Secondary Header
### Sub Header`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<h1');
      expect(result).toContain('<h2');
      expect(result).toContain('<h3');
      expect(result).toContain('Main Header');
      expect(result).toContain('Secondary Header');
      expect(result).toContain('Sub Header');
    });

    it('should convert bold text to strong tags', () => {
      const input = 'This is **bold text** in a sentence.';
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<strong');
      expect(result).toContain('bold text');
      expect(result).toContain('</strong>');
    });

    it('should convert italic text to em tags', () => {
      const input = 'This is *italic text* in a sentence.';
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<em');
      expect(result).toContain('italic text');
      expect(result).toContain('</em>');
    });

    it('should convert lists to standard HTML ul/li elements', () => {
      const input = `- First item
- Second item
- Third item`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('First item');
      expect(result).toContain('Second item');
      expect(result).toContain('Third item');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('</li>');
      expect(result).toContain('</ul>');
    });

    it('should convert horizontal rules to hr tags', () => {
      const input = `Content above

---

Content below`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<hr');
      expect(result).toContain('Content above');
      expect(result).toContain('Content below');
    });

    it('should convert tables to proper HTML tables', () => {
      const input = `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<table');
      expect(result).toContain('<thead');
      expect(result).toContain('<tbody');
      expect(result).toContain('<th');
      expect(result).toContain('<td');
      expect(result).toContain('Column 1');
      expect(result).toContain('Column 2');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Cell 2');
    });

    it('should handle tables with empty cells', () => {
      const input = `| Question | Answer |
|----------|---------|
| What happened? | I felt anxious |
| Why? |  |
| How do you feel now? | Better |`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<table');
      expect(result).toContain('What happened?');
      expect(result).toContain('I felt anxious');
      expect(result).toContain('Why?');
      expect(result).toContain('How do you feel now?');
      expect(result).toContain('Better');
      // Should handle empty cell gracefully
      expect(result).toMatch(/<td[^>]*>\s*(&nbsp;|\s*)<\/td>/);
    });
  });

  describe('Complex markdown content', () => {
    it('should process CBT diary-style content correctly', () => {
      const input = `# 📝 CBT Diary Entry

**Date:** 2025-08-07

---

## Situation
I was walking outside during my lunch break.

---

## Initial Feelings
*Emotion ratings from 1-10*

- Fear: 8/10
- Anxiety: 4/10

---

## Challenge Questions

| Question | Answer |
|----------|---------|
| What does it say about me? | It shows I'm worried |
| Are thoughts actions? | No, they are different |

---

*This is for reflection and growth.*`;
      
      const result = processMarkdown(input, false);
      
      // Check headers
      expect(result).toContain('<h1');
      expect(result).toContain('CBT Diary Entry');
      expect(result).toContain('<h2');
      expect(result).toContain('Situation');
      expect(result).toContain('Initial Feelings');
      expect(result).toContain('Challenge Questions');
      
      // Check bold text
      expect(result).toContain('<strong');
      expect(result).toContain('Date:');
      
      // Check italic text
      expect(result).toContain('<em');
      expect(result).toContain('Emotion ratings from 1-10');
      expect(result).toContain('This is for reflection and growth');
      
      // Check lists
      expect(result).toContain('Fear: 8/10');
      expect(result).toContain('Anxiety: 4/10');
      expect(result).toContain('<ul>'); // Standard HTML lists
      expect(result).toContain('<li>'); // List items
      
      // Check table
      expect(result).toContain('<table');
      expect(result).toContain('What does it say about me?');
      expect(result).toContain('It shows I\'m worried');
      
      // Check horizontal rules
      expect(result).toContain('<hr');
    });
  });

  describe('Security and sanitization', () => {
    it('should sanitize dangerous HTML while preserving markdown', () => {
      const input = `**Bold text** with <script>alert('xss')</script> dangerous content`;
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<strong');
      expect(result).toContain('Bold text');
      expect(result).not.toContain('<script');
      // XSS content is escaped but text content may remain - check it's not executable
      expect(result).not.toContain('<script>alert');
    });

    it('should generate clean HTML without inline classes', () => {
      const input = '**Bold text**';
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('<strong>');
      expect(result).toContain('Bold text');
      expect(result).toContain('</strong>');
      // New approach: no CSS classes added by processor (handled by CSS templates)
      expect(result).not.toContain('class="');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const result = processMarkdown('', false);
      
      expect(result).toBe('');
    });

    it('should handle plain text without markdown', () => {
      const input = 'Just plain text without any markdown formatting.';
      
      const result = processMarkdown(input, false);
      
      expect(result).toContain('Just plain text without any markdown formatting.');
      expect(result).toContain('<p');
    });

    it('should handle mixed user and assistant styling', () => {
      const input = '**Bold text**';
      
      const userResult = processMarkdown(input, true);
      const assistantResult = processMarkdown(input, false);
      
      // Both should produce strong tags but may have different classes
      expect(userResult).toContain('<strong');
      expect(assistantResult).toContain('<strong');
      expect(userResult).toContain('Bold text');
      expect(assistantResult).toContain('Bold text');
    });
  });
});