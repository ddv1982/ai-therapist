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

    it('should convert tables to proper HTML tables with therapeutic styling', () => {
      const input = `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;
      
      const result = processMarkdown(input, false);
      
      // Basic table structure
      expect(result).toContain('<table');
      expect(result).toContain('<thead');
      expect(result).toContain('<tbody');
      expect(result).toContain('<th');
      expect(result).toContain('<td');
      expect(result).toContain('Column 1');
      expect(result).toContain('Column 2');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Cell 2');
      
      // Enhanced therapeutic features
      expect(result).toContain('class="therapeutic-table table-striped"'); // Auto-applied classes
      expect(result).toContain('<div class="table-responsive">'); // Responsive wrapper
      expect(result).toContain('data-label="Column 1"'); // Mobile labels
      expect(result).toContain('data-label="Column 2"'); // Mobile labels
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
      
      // Should still have therapeutic enhancements
      expect(result).toContain('class="therapeutic-table table-striped"');
      expect(result).toContain('<div class="table-responsive">');
    });

    it('should support custom table classes via markdown-it-attrs', () => {
      const input = `| Header 1 | Header 2 |
|----------|----------|
| Data 1   | Data 2   |

{.table-compact}`;
      
      const result = processMarkdown(input, false);
      
      // Should contain the custom class
      expect(result).toContain('table-compact');
      // Should still have the responsive wrapper
      expect(result).toContain('<div class="table-responsive">');
    });

    it('should handle complex therapeutic table scenarios', () => {
      const input = `| Emotion | Initial (0-100) | After CBT (0-100) |
|---------|-----------------|-------------------|
| Anxiety | 85              | 35                |
| Sadness | 70              | 25                |

{.table-cbt-report}`;
      
      const result = processMarkdown(input, false);
      
      // Should have proper structure
      expect(result).toContain('Emotion');
      expect(result).toContain('Initial (0-100)');
      expect(result).toContain('After CBT (0-100)');
      expect(result).toContain('Anxiety');
      expect(result).toContain('85');
      expect(result).toContain('35');
      
      // Should have therapeutic enhancements
      expect(result).toContain('table-cbt-report');
      expect(result).toContain('<div class="table-responsive">');
      expect(result).toContain('data-label="Emotion"');
      expect(result).toContain('data-label="Initial (0-100)"');
    });

    it('should create proper mobile data-labels for complex headers', () => {
      const input = `| **Cognitive Distortion** | Frequency | **Therapeutic Priority** |
|---------------------------|-----------|--------------------------|
| All-or-nothing thinking   | 8/10      | High                     |
| Catastrophizing           | 6/10      | Medium                   |`;
      
      const result = processMarkdown(input, false);
      
      // Should extract clean header text for data-labels
      expect(result).toContain('data-label="Cognitive Distortion"');
      expect(result).toContain('data-label="Frequency"');
      expect(result).toContain('data-label="Therapeutic Priority"');
      
      // Should preserve header formatting
      expect(result).toContain('<strong>Cognitive Distortion</strong>');
      expect(result).toContain('<strong>Therapeutic Priority</strong>');
    });

    it('should handle tables without headers gracefully', () => {
      const input = `| Row 1 Col 1 | Row 1 Col 2 |
|-------------|-------------|
| Row 2 Col 1 | Row 2 Col 2 |`;
      
      const result = processMarkdown(input, false);
      
      // Should still apply therapeutic styling
      expect(result).toContain('class="therapeutic-table table-striped"');
      expect(result).toContain('<div class="table-responsive">');
      
      // Should have basic table structure
      expect(result).toContain('<table');
      expect(result).toContain('<tbody');
    });

    it('should wrap multiple tables independently', () => {
      const input = `| Table 1 | Col 2 |
|---------|-------|
| Data    | More  |

Some text between tables.

| Table 2 | Col 2 |
|---------|-------|
| Other   | Data  |`;
      
      const result = processMarkdown(input, false);
      
      // Should have two responsive wrappers
      const wrapperMatches = result.match(/<div class="table-responsive">/g);
      expect(wrapperMatches).toHaveLength(2);
      
      // Both tables should have therapeutic styling
      const tableMatches = result.match(/class="therapeutic-table table-striped"/g);
      expect(tableMatches).toHaveLength(2);
    });
  });

  describe('Enhanced table functionality', () => {
    it('should preserve existing table classes when present', () => {
      const input = `| Header | Data |
|--------|------|
| Test   | Info |

{.custom-table}`;
      
      const result = processMarkdown(input, false);
      
      // Should preserve the custom class
      expect(result).toContain('custom-table');
      // Should still wrap in responsive container
      expect(result).toContain('<div class="table-responsive">');
    });

    it('should handle tables with complex cell content', () => {
      const input = `| Question | Answer |
|----------|---------|
| **How are you feeling?** | *Much better* now |
| What's your goal? | To improve ~~my mood~~ my **overall wellness** |`;
      
      const result = processMarkdown(input, false);
      
      // Should preserve inline formatting
      expect(result).toContain('<strong>How are you feeling?</strong>');
      expect(result).toContain('<em>Much better</em>');
      expect(result).toContain('<s>my mood</s>');
      expect(result).toContain('<strong>overall wellness</strong>');
      
      // Should have therapeutic styling
      expect(result).toContain('class="therapeutic-table table-striped"');
      expect(result).toContain('data-label="Question"');
      expect(result).toContain('data-label="Answer"');
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