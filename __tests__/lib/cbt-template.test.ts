import {
  generateCBTTemplate,
  generateQuickCBTTemplate,
  getCBTPromptsForEmotion,
  getERPChallengeQuestions,
  generateERPTemplate,
  generateQuickERPTemplate,
} from '@/lib/therapy/cbt-template';

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

    it('should return ERP-specific OCD prompts', () => {
      const prompts = getCBTPromptsForEmotion('ocd');

      expect(prompts).toContain('What compulsion am I feeling urged to perform right now?');
      expect(prompts).toContain('Can I sit with this uncertainty for 5 more minutes?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return intrusive thought specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('intrusive_thoughts');

      expect(prompts).toContain('Is having this thought the same as wanting to act on it?');
      expect(prompts).toContain('Can I notice this thought and let it pass like a cloud?');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return contamination specific prompts', () => {
      const prompts = getCBTPromptsForEmotion('contamination');

      expect(prompts).toContain("What am I truly afraid will happen if I don't wash/clean?");
      expect(prompts).toContain("What would 'normal' cleanliness look like here?");
      expect(prompts.length).toBeGreaterThan(0);
    });
  });

  describe('getERPChallengeQuestions', () => {
    it('should return contamination-specific ERP questions', () => {
      const questions = getERPChallengeQuestions('contamination');

      expect(questions).toContain("What level of cleanliness is 'normal' for this situation?");
      expect(questions).toContain(
        "Can I tolerate this feeling of 'dirtiness' for 10 more minutes?"
      );
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return checking-specific ERP questions', () => {
      const questions = getERPChallengeQuestions('checking');

      expect(questions).toContain('What evidence do I actually have that something is wrong?');
      expect(questions).toContain('Can I practice trusting that I did it right the first time?');
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return harm-specific ERP questions', () => {
      const questions = getERPChallengeQuestions('harm');

      expect(questions).toContain('Is having a scary thought the same as being dangerous?');
      expect(questions).toContain('Can I let this thought exist without pushing it away?');
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return default questions for unknown obsession type', () => {
      const questions = getERPChallengeQuestions('unknown');

      // Should fallback to contamination questions
      expect(questions).toContain("What level of cleanliness is 'normal' for this situation?");
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive obsession type matching', () => {
      const upperCaseQuestions = getERPChallengeQuestions('CHECKING');
      const lowerCaseQuestions = getERPChallengeQuestions('checking');

      expect(upperCaseQuestions).toEqual(lowerCaseQuestions);
    });
  });

  describe('generateERPTemplate', () => {
    it('should generate a comprehensive ERP template', () => {
      const template = generateERPTemplate();

      // Check key sections
      expect(template).toContain('🎯 **ERP (Exposure and Response Prevention) Plan**');
      expect(template).toContain('## **Compassionate Approach**');
      expect(template).toContain('## **Current Obsession/Compulsion Pattern**');
      expect(template).toContain('## **Compassionate Exposure Hierarchy**');
      expect(template).toContain('## **Response Prevention Plan**');
      expect(template).toContain('## **Tracking Progress**');
      expect(template).toContain('## **Reflection & Self-Compassion**');

      // Check for anxiety rating scales
      expect(template).toContain('___/10');

      // Check for current date
      const today = new Date().toISOString().split('T')[0];
      expect(template).toContain(today);
    });

    it('should include compassionate language and approach', () => {
      const template = generateERPTemplate();

      expect(template).toContain('compassionate');
      expect(template).toContain('gentle');
      expect(template).toContain('Go at your own pace');
      expect(template).toContain("I'm being brave");
      expect(template).toContain('Self-Compassion');
    });

    it('should include exposure hierarchy levels', () => {
      const template = generateERPTemplate();

      expect(template).toContain('Low-Level Exposures (Anxiety 3-4/10)');
      expect(template).toContain('Mid-Level Exposures (Anxiety 5-7/10)');
      expect(template).toContain('High-Level Exposures (Anxiety 8-10/10)');
    });

    it('should include progress tracking sections', () => {
      const template = generateERPTemplate();

      expect(template).toContain('Before Exposure');
      expect(template).toContain('During Exposure');
      expect(template).toContain('After Exposure');
      expect(template).toContain('Confidence I can handle this');
    });
  });

  describe('generateQuickERPTemplate', () => {
    it('should generate a simplified ERP template', () => {
      const template = generateQuickERPTemplate();

      expect(template).toContain('🎯 **Quick ERP Check-in**');
      expect(template).toContain('**Date:**');
      expect(template).toContain("Today's exposure:");
      expect(template).toContain('Anxiety before:');
      expect(template).toContain('Anxiety after:');
      expect(template).toContain('Did I resist?');
      expect(template).toContain('What I learned:');
      expect(template).toContain('Tomorrow I will:');

      // Check for current date
      const today = new Date().toISOString().split('T')[0];
      expect(template).toContain(today);
    });

    it('should be shorter than the full ERP template', () => {
      const fullTemplate = generateERPTemplate();
      const quickTemplate = generateQuickERPTemplate();

      expect(quickTemplate.length).toBeLessThan(fullTemplate.length);
    });

    it('should include anxiety rating scales', () => {
      const template = generateQuickERPTemplate();

      expect(template).toContain('___/10');
    });
  });
});
