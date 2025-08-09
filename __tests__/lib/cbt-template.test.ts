import { generateCBTTemplate, generateQuickCBTTemplate, getCBTPromptsForEmotion } from '@/lib/therapy/cbt-template';

describe('CBT Template Functions', () => {
  describe('generateCBTTemplate', () => {
    it('should generate a comprehensive CBT template', () => {
      const template = generateCBTTemplate();
      
      // Check that template contains key sections
      expect(template).toContain('📝 **CBT Diary Entry**');
      expect(template).toContain('**Date:**');
      expect(template).toContain('## **Situation**');
      expect(template).toContain('## **Feelings**');
      expect(template).toContain('## **Automatic Thoughts**');
      expect(template).toContain('## **Schema**');
      expect(template).toContain('## **Challenge**');
      expect(template).toContain('## **Rational Thoughts**');
      expect(template).toContain('## **Result**');
      
      // Check that it uses 1-10 intensity scales
      expect(template).toContain('___/10');
      expect(template).not.toContain('___/100');
      
      // Check for current date
      const today = new Date().toISOString().split('T')[0];
      expect(template).toContain(today);
    });

    it('should include helpful placeholders and instructions', () => {
      const template = generateCBTTemplate();
      
      expect(template).toContain('(Where am I? With whom? What is happening?)');
      expect(template).toContain('Rate intensity from 1-10');
      expect(template).toContain('Credibility: Rate how much you believe');
    });

    it('should include schema modes checklist', () => {
      const template = generateCBTTemplate();
      
      expect(template).toContain('The Vulnerable Child');
      expect(template).toContain('The Angry Child');
      expect(template).toContain('The Punishing Parent');
      expect(template).toContain('The Healthy Adult');
    });

    it('should include challenge questions table', () => {
      const template = generateCBTTemplate();
      
      expect(template).toContain('| **Question** | **Answer** |');
      expect(template).toContain('What does it say about me that I have this thought?');
      expect(template).toContain('Are thoughts the same as actions?');
      expect(template).toContain('What would I say to a friend in this situation?');
    });
  });

  describe('generateQuickCBTTemplate', () => {
    it('should generate a simplified CBT template', () => {
      const template = generateQuickCBTTemplate();
      
      expect(template).toContain('📝 **Quick CBT Check-in**');
      expect(template).toContain('**Date:**');
      expect(template).toContain('**Situation:**');
      expect(template).toContain('**Feeling:**');
      expect(template).toContain('**Thought:**');
      expect(template).toContain('**Challenge:**');
      expect(template).toContain('**Result:**');
      
      // Should be much shorter than full template
      const fullTemplate = generateCBTTemplate();
      expect(template.length).toBeLessThan(fullTemplate.length / 3);
    });

    it('should include current date', () => {
      const template = generateQuickCBTTemplate();
      const today = new Date().toISOString().split('T')[0];
      expect(template).toContain(today);
    });
  });

  describe('getCBTPromptsForEmotion', () => {
    it('should return anxiety-specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('anxiety');
      
      expect(prompts).toContain('What is the worst that could realistically happen?');
      expect(prompts).toContain('How likely is this feared outcome (0-100%)?');
      expect(prompts).toContain('Have I survived similar situations before?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return depression-specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('depression');
      
      expect(prompts).toContain('Is this thought helping or hurting me?');
      expect(prompts).toContain('What evidence contradicts this negative view?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return anger-specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('anger');
      
      expect(prompts).toContain('What need or value is being threatened here?');
      expect(prompts).toContain('Is my reaction proportionate to the situation?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return shame-specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('shame');
      
      expect(prompts).toContain('Would I judge a friend this harshly for the same thing?');
      expect(prompts).toContain('Is this mistake part of being human?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return default prompts for unknown emotions', () => {
      const prompts = getCBTPromptsForEmotion('unknown-emotion');
      
      // Should fallback to anxiety prompts
      expect(prompts).toContain('What is the worst that could realistically happen?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive emotion matching', () => {
      const upperCasePrompts = getCBTPromptsForEmotion('ANXIETY');
      const lowerCasePrompts = getCBTPromptsForEmotion('anxiety');
      
      expect(upperCasePrompts).toEqual(lowerCasePrompts);
    });
  });
});