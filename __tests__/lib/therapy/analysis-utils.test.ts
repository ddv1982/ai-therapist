/**
 * Test suite for consolidated analysis utilities
 * Ensures DRY violation fixes and comprehensive functionality coverage
 */

import {
  extractUserRatings,
  hasUserQuantifiedAssessments,
  assessSchemaReflectionDepth,
  isBriefRequest,
  analyzeContentMetrics,
  assessUserDataPriority,
  replaceTemplatePlaceholders,
  convertToClientFriendlyLanguage,
  calculateUserDataWeightedConfidence,
  getMinimumWordCountThreshold,
  AnalysisUtils,
  type UserRatingExtraction,
  type ContentAnalysisMetrics,
  type UserDataPriority
} from '@/lib/therapy/analysis-utils';

describe('Analysis Utils - Consolidated Functionality', () => {
  
  // ========================================
  // USER RATING EXTRACTION TESTS
  // ========================================
  
  describe('extractUserRatings', () => {
    
    test('should extract structured emotion ratings', () => {
      const content = `
        Today's emotions:
        - Anxiety: 8/10
        - Sadness: 6/10  
        - Fear: 4/10
      `;
      
      const ratings = extractUserRatings(content);
      
      expect(ratings).toHaveLength(3);
      expect(ratings[0]).toEqual({
        rating: 8,
        context: 'Anxiety',
        type: 'emotion'
      });
      expect(ratings[1]).toEqual({
        rating: 6,
        context: 'Sadness', 
        type: 'emotion'
      });
      expect(ratings[2]).toEqual({
        rating: 4,
        context: 'Fear',
        type: 'emotion'
      });
    });
    
    test('should extract credibility ratings', () => {
      const content = `
        - "I'm going to fail this presentation" *(7/10)*
        - "Everyone will judge me" *(9/10)*
        - "I'm completely incompetent" *(5/10)*
      `;
      
      const ratings = extractUserRatings(content);
      
      expect(ratings).toHaveLength(3);
      ratings.forEach(rating => {
        expect(rating.type).toBe('credibility');
        expect(rating.context).toBe('thought credibility');
      });
      expect(ratings.map(r => r.rating)).toEqual([7, 9, 5]);
    });
    
    test('should extract general self-assessments', () => {
      const content = `
        I feel anxiety at about 7/10 right now.
        My stress level is 8 today.
        I would rate my confidence as 3 out of 10.
      `;
      
      const ratings = extractUserRatings(content);
      
      expect(ratings).toHaveLength(3);
      expect(ratings[0]).toEqual({
        rating: 7,
        context: 'self-assessment',
        type: 'emotion'
      });
      expect(ratings[1]).toEqual({
        rating: 8,
        context: 'self-assessment', 
        type: 'general'
      });
      expect(ratings[2]).toEqual({
        rating: 3,
        context: 'self-assessment',
        type: 'general'
      });
    });
    
    test('should handle mixed rating types', () => {
      const content = `
        ## CBT Diary Entry
        - Anxiety: 8/10
        - Depression: 6/10
        
        Automatic thoughts:
        - "I'm worthless" *(9/10)*
        
        I feel my overall mood is about 4/10 today.
      `;
      
      const ratings = extractUserRatings(content);
      
      expect(ratings).toHaveLength(4);
      expect(ratings.filter(r => r.type === 'emotion')).toHaveLength(3);
      expect(ratings.filter(r => r.type === 'credibility')).toHaveLength(1);
    });
    
    test('should return empty array for no ratings', () => {
      const content = "Just having a regular conversation about work.";
      const ratings = extractUserRatings(content);
      expect(ratings).toHaveLength(0);
    });
    
    test('should validate rating range (0-10)', () => {
      const content = `
        I feel anxiety at 15/10 (invalid)
        My stress level is 7 (valid)
        Rating of -2 (invalid)
      `;
      
      const ratings = extractUserRatings(content);
      // Should only extract the valid rating of 7
      expect(ratings).toHaveLength(1);
      expect(ratings[0].rating).toBe(7);
    });
  });
  
  // ========================================
  // USER QUANTIFIED ASSESSMENTS TESTS
  // ========================================
  
  describe('hasUserQuantifiedAssessments', () => {
    
    test('should detect various user assessment patterns', () => {
      const testCases = [
        "I feel anxiety at 7/10",
        "My stress level is 8",
        "I would rate this feeling as 6",
        "On a scale of 1-10, I'm at 7",
        "I assess my confidence as 4",
        "Personally I'd say 6 out of 10",
        "7/10 intensity right now",
        "feeling about 80 percent confident"
      ];
      
      testCases.forEach(content => {
        expect(hasUserQuantifiedAssessments(content)).toBe(true);
      });
    });
    
    test('should detect structured rating patterns', () => {
      const content = `
        - Anxiety: 7/10
        - Self-assessment: 8
        - My rating: 5
        *(6/10)*
      `;
      
      expect(hasUserQuantifiedAssessments(content)).toBe(true);
    });
    
    test('should return false for non-quantified content', () => {
      const content = "I'm feeling quite anxious about the presentation tomorrow.";
      expect(hasUserQuantifiedAssessments(content)).toBe(false);
    });
    
    test('should handle mixed content correctly', () => {
      const content = `
        I'm worried about tomorrow's meeting. Everyone will be there and I feel
        my anxiety level is about 7 out of 10 right now.
      `;
      
      expect(hasUserQuantifiedAssessments(content)).toBe(true);
    });
  });
  
  // ========================================
  // SCHEMA REFLECTION DEPTH TESTS
  // ========================================
  
  describe('assessSchemaReflectionDepth', () => {
    
    test('should detect comprehensive schema reflection', () => {
      const content = `
        ## SCHEMA REFLECTION
        
        **Personal Self-Assessment:**
        Through this Therapeutic Insights process, I can see how my childhood patterns
        have shaped my current responses. Early experiences of criticism formed core beliefs
        about being inadequate. Schema modes get activated when I face evaluation situations.
        Maladaptive patterns developed as protective mechanisms, but now my inner critic voice
        dominates. My vulnerable child part still seeks approval while my healing journey
        involves recognizing these patterns.
        
        **Guided Reflection Insights:**
        These patterns no longer serve me and I can choose different responses.
      `;
      
      expect(assessSchemaReflectionDepth(content)).toBe('comprehensive');
    });
    
    test('should detect moderate schema reflection', () => {
      const content = `
        Looking at my patterns, I see how childhood experiences influence my core beliefs.
        My schema modes get triggered in certain situations. This maladaptive pattern
        developed early but I can work on healing these wounds.
      `;
      
      expect(assessSchemaReflectionDepth(content)).toBe('moderate');
    });
    
    test('should detect minimal schema reflection', () => {
      const content = `
        I notice some patterns in my thinking that might come from childhood experiences.
        There are core beliefs that don't serve me well.
      `;
      
      expect(assessSchemaReflectionDepth(content)).toBe('minimal');
    });
    
    test('should detect no schema reflection', () => {
      const content = "Just had a regular conversation about work deadlines and project planning.";
      expect(assessSchemaReflectionDepth(content)).toBe('none');
    });
    
    test('should be case-insensitive', () => {
      const content = "schema reflection insights about core belief patterns";
      expect(assessSchemaReflectionDepth(content)).toBe('minimal');
    });
  });
  
  // ========================================
  // BRIEF REQUEST DETECTION TESTS  
  // ========================================
  
  describe('isBriefRequest', () => {
    
    test('should detect search requests', () => {
      const requests = [
        "Can you search for meditation videos?",
        "Please find information about anxiety coping strategies",
        "Could you look up breathing exercises?",
        "Help me find resources for depression support",
        "What are some mindfulness apps?",
        "Where can I find therapy options?",
        "Do you know about CBT techniques?",
        "Tell me about panic attack management"
      ];
      
      requests.forEach(request => {
        expect(isBriefRequest(request)).toBe(true);
      });
    });
    
    test('should not flag therapeutic conversations as brief requests', () => {
      const content = `
        I'm really struggling with anxiety lately. It feels like everything is overwhelming
        and I can't shake the feeling that I'm not good enough. This has been going on
        for weeks and it's affecting my sleep and work performance.
      `;
      
      expect(isBriefRequest(content)).toBe(false);
    });
    
    test('should handle empty or whitespace content', () => {
      expect(isBriefRequest("")).toBe(false);
      expect(isBriefRequest("   ")).toBe(false);
    });
    
    test('should match from beginning of string', () => {
      // Should match
      expect(isBriefRequest("Can you search for resources?")).toBe(true);
      
      // Should not match (not at beginning)
      expect(isBriefRequest("I was wondering if you can search for resources?")).toBe(false);
    });
  });
  
  // ========================================
  // CONTENT ANALYSIS METRICS TESTS
  // ========================================
  
  describe('analyzeContentMetrics', () => {
    
    test('should analyze comprehensive CBT content', () => {
      const content = `
        ## CBT Diary Entry - Date: 2024-01-15
        
        **Situation:** Preparing for important presentation at work
        
        **Emotions:**
        - Anxiety: 8/10
        - Fear: 7/10  
        - Shame: 5/10
        
        **Automatic Thoughts:**
        - "I'm going to fail miserably" *(9/10)*
        - "Everyone will see I'm incompetent" *(8/10)*
        
        ## SCHEMA REFLECTION
        
        **Personal Self-Assessment:**
        I notice this connects to childhood patterns where I felt criticized.
        Core beliefs about inadequacy get activated in performance situations.
        Schema modes switch between vulnerable child and inner critic.
        Maladaptive patterns developed as protective mechanisms but now limit me.
        
        **Therapeutic Insights:**
        These early experiences formed beliefs that no longer serve me.
        I can choose different responses and practice self-compassion.
        My healing journey involves recognizing these patterns without judgment.
      `;
      
      const metrics = analyzeContentMetrics(content);
      
      expect(metrics.wordCount).toBeGreaterThan(100);
      expect(metrics.hasUserAssessments).toBe(true);
      expect(metrics.userAssessmentCount).toBeGreaterThan(0);
      expect(metrics.schemaReflectionDepth).toBe('comprehensive');
      expect(metrics.isBriefRequest).toBe(false);
      expect(metrics.userDataReliability).toBeGreaterThan(80); // High reliability due to structured ratings
    });
    
    test('should analyze standard therapeutic conversation', () => {
      const content = `
        I've been struggling with anxiety lately. I feel like I'm always worrying
        about things that might not even happen. My stress level has been around 7
        most days. I notice patterns in my thinking where I automatically assume
        the worst will happen. In my experience, this started in childhood when
        I felt criticized a lot. I'm aware that these thoughts aren't always
        realistic but they feel so real in the moment.
      `;
      
      const metrics = analyzeContentMetrics(content);
      
      expect(metrics.hasUserAssessments).toBe(true);
      expect(metrics.schemaReflectionDepth).toBe('minimal');
      expect(metrics.isBriefRequest).toBe(false);
      expect(metrics.userDataReliability).toBeGreaterThan(60);
    });
    
    test('should analyze brief request', () => {
      const content = "Can you search for mindfulness meditation apps?";
      
      const metrics = analyzeContentMetrics(content);
      
      expect(metrics.wordCount).toBeLessThan(20);
      expect(metrics.hasUserAssessments).toBe(false);
      expect(metrics.userAssessmentCount).toBe(0);
      expect(metrics.schemaReflectionDepth).toBe('none');
      expect(metrics.isBriefRequest).toBe(true);
      expect(metrics.userDataReliability).toBe(50); // Default baseline
    });
    
    test('should handle empty content', () => {
      const metrics = analyzeContentMetrics("");
      
      expect(metrics.wordCount).toBe(1); // Empty string split gives 1
      expect(metrics.hasUserAssessments).toBe(false);
      expect(metrics.userAssessmentCount).toBe(0);
      expect(metrics.schemaReflectionDepth).toBe('none');
      expect(metrics.isBriefRequest).toBe(false);
    });
  });
  
  // ========================================
  // USER DATA PRIORITY TESTS
  // ========================================
  
  describe('assessUserDataPriority', () => {
    
    test('should assess high priority user data', () => {
      const content = `
        - Anxiety: 8/10
        - Depression: 6/10
        - Fear: 7/10
        
        I feel like my stress is at 9 out of 10 today.
        In my experience, these feelings are more intense than usual.
        I notice that I'm aware of these patterns more clearly now.
        Personally, I would rate my coping ability as 4/10.
      `;
      
      const priority = assessUserDataPriority(content);
      
      expect(priority.hasUserProvidedData).toBe(true);
      expect(priority.userRatingCount).toBe(4);
      expect(priority.shouldPrioritizeUserData).toBe(true);
      expect(priority.userDataReliability).toBeGreaterThan(80);
      expect(priority.userAssessmentTypes).toContain('emotion');
      expect(priority.extractedRatings).toHaveLength(4);
    });
    
    test('should assess medium priority user data', () => {
      const content = `
        I feel my anxiety is around 6 out of 10 today. I notice some patterns
        in my thinking that concern me.
      `;
      
      const priority = assessUserDataPriority(content);
      
      expect(priority.hasUserProvidedData).toBe(true);
      expect(priority.userRatingCount).toBe(1);
      expect(priority.userDataReliability).toBeBetween(50, 80);
    });
    
    test('should assess no user data priority', () => {
      const content = "Having a regular conversation about work projects.";
      
      const priority = assessUserDataPriority(content);
      
      expect(priority.hasUserProvidedData).toBe(false);
      expect(priority.userRatingCount).toBe(0);
      expect(priority.shouldPrioritizeUserData).toBe(false);
      expect(priority.userDataReliability).toBe(50); // Baseline
    });
    
    test('should boost reliability for self-reflective language', () => {
      const content1 = "I feel anxiety at 6/10"; // No self-reflective language
      const content2 = `
        I feel anxiety at 6/10. In my experience, I notice that I'm aware
        of these patterns personally.
      `; // Multiple self-reflective patterns
      
      const priority1 = assessUserDataPriority(content1);
      const priority2 = assessUserDataPriority(content2);
      
      expect(priority2.userDataReliability).toBeGreaterThan(priority1.userDataReliability);
    });
  });
  
  // ========================================
  // TEMPLATE UTILITIES TESTS
  // ========================================
  
  describe('replaceTemplatePlaceholders', () => {
    
    test('should replace all placeholders', () => {
      const template = "Hello {name}, your {type} session on {date} was {quality}.";
      const replacements = {
        name: "Sarah",
        type: "CBT",
        date: "2024-01-15", 
        quality: "excellent"
      };
      
      const result = replaceTemplatePlaceholders(template, replacements);
      expect(result).toBe("Hello Sarah, your CBT session on 2024-01-15 was excellent.");
    });
    
    test('should handle missing replacements', () => {
      const template = "Hello {name}, your session was {missing}.";
      const replacements = { name: "John" };
      
      const result = replaceTemplatePlaceholders(template, replacements);
      expect(result).toBe("Hello John, your session was [missing content].");
    });
    
    test('should handle duplicate placeholders', () => {
      const template = "{greeting} {name}, {greeting} again {name}!";
      const replacements = { greeting: "Hello", name: "Alice" };
      
      const result = replaceTemplatePlaceholders(template, replacements);
      expect(result).toBe("Hello Alice, Hello again Alice!");
    });
    
    test('should handle empty replacements', () => {
      const template = "No placeholders here.";
      const result = replaceTemplatePlaceholders(template, {});
      expect(result).toBe("No placeholders here.");
    });
  });
  
  describe('convertToClientFriendlyLanguage', () => {
    
    test('should convert clinical terms', () => {
      const clinicalText = `
        The patient shows cognitive distortions and maladaptive behaviors.
        This pathological pattern indicates a disorder with significant dysfunction.
      `;
      
      const friendlyText = convertToClientFriendlyLanguage(clinicalText);
      
      expect(friendlyText).toContain('thinking pattern');
      expect(friendlyText).toContain('protective but limiting');
      expect(friendlyText).toContain('challenging');
      expect(friendlyText).toContain('experience');
      expect(friendlyText).toContain('difficulty');
      expect(friendlyText).not.toContain('cognitive distortion');
      expect(friendlyText).not.toContain('maladaptive');
      expect(friendlyText).not.toContain('pathological');
      expect(friendlyText).not.toContain('disorder');
      expect(friendlyText).not.toContain('dysfunction');
    });
    
    test('should be case-insensitive', () => {
      const text = "Cognitive Distortion and MALADAPTIVE patterns";
      const result = convertToClientFriendlyLanguage(text);
      expect(result).toBe("thinking pattern and protective but limiting patterns");
    });
    
    test('should handle text without clinical terms', () => {
      const text = "This is regular therapeutic language about growth and healing.";
      const result = convertToClientFriendlyLanguage(text);
      expect(result).toBe(text); // Should remain unchanged
    });
  });
  
  // ========================================
  // CONFIDENCE CALCULATION TESTS
  // ========================================
  
  describe('calculateUserDataWeightedConfidence', () => {
    
    test('should return AI confidence when no user data', () => {
      const userDataPriority: UserDataPriority = {
        hasUserProvidedData: false,
        userRatingCount: 0,
        userDataReliability: 50,
        shouldPrioritizeUserData: false,
        extractedRatings: [],
        userAssessmentTypes: []
      };
      
      const result = calculateUserDataWeightedConfidence(75, userDataPriority);
      expect(result).toBe(75);
    });
    
    test('should weight user data highly for reliable assessments', () => {
      const userDataPriority: UserDataPriority = {
        hasUserProvidedData: true,
        userRatingCount: 5,
        userDataReliability: 90, // High reliability
        shouldPrioritizeUserData: true,
        extractedRatings: [],
        userAssessmentTypes: ['emotion', 'credibility']
      };
      
      const result = calculateUserDataWeightedConfidence(60, userDataPriority, 0.8);
      
      // Should be closer to user data confidence (~88) than AI confidence (60)
      expect(result).toBeGreaterThan(70);
      expect(result).toBeLessThan(90);
    });
    
    test('should reduce user data weight for low reliability', () => {
      const userDataPriority: UserDataPriority = {
        hasUserProvidedData: true,
        userRatingCount: 1,
        userDataReliability: 40, // Low reliability
        shouldPrioritizeUserData: false,
        extractedRatings: [],
        userAssessmentTypes: []
      };
      
      const result = calculateUserDataWeightedConfidence(75, userDataPriority);
      
      // Should be closer to AI confidence due to low user data reliability
      expect(result).toBeCloseTo(75, 0);
    });
    
    test('should handle edge cases', () => {
      const userDataPriority: UserDataPriority = {
        hasUserProvidedData: true,
        userRatingCount: 3,
        userDataReliability: 100, // Perfect reliability
        shouldPrioritizeUserData: true,
        extractedRatings: [],
        userAssessmentTypes: []
      };
      
      const result = calculateUserDataWeightedConfidence(50, userDataPriority, 0.95);
      expect(result).toBeLessThanOrEqual(95); // Should not exceed maximum confidence
    });
  });
  
  // ========================================
  // THRESHOLD UTILITIES TESTS
  // ========================================
  
  describe('getMinimumWordCountThreshold', () => {
    
    test('should return correct thresholds for each analysis type', () => {
      expect(getMinimumWordCountThreshold('comprehensive')).toBe(100);
      expect(getMinimumWordCountThreshold('moderate')).toBe(50);
      expect(getMinimumWordCountThreshold('surface')).toBe(25);
    });
    
    test('should handle invalid analysis type', () => {
      // @ts-ignore - Testing runtime behavior
      expect(getMinimumWordCountThreshold('invalid')).toBe(25);
    });
  });
  
  // ========================================
  // ANALYSIS UTILS BUNDLE TESTS
  // ========================================
  
  describe('AnalysisUtils bundle', () => {
    
    test('should export all main functions', () => {
      expect(AnalysisUtils.analyzeContentMetrics).toBeDefined();
      expect(AnalysisUtils.assessSchemaReflectionDepth).toBeDefined();
      expect(AnalysisUtils.isBriefRequest).toBeDefined();
      expect(AnalysisUtils.extractUserRatings).toBeDefined();
      expect(AnalysisUtils.hasUserQuantifiedAssessments).toBeDefined();
      expect(AnalysisUtils.assessUserDataPriority).toBeDefined();
      expect(AnalysisUtils.replaceTemplatePlaceholders).toBeDefined();
      expect(AnalysisUtils.convertToClientFriendlyLanguage).toBeDefined();
      expect(AnalysisUtils.calculateUserDataWeightedConfidence).toBeDefined();
      expect(AnalysisUtils.getMinimumWordCountThreshold).toBeDefined();
    });
    
    test('should work with real therapeutic content', () => {
      const content = `
        I'm really struggling today. My anxiety is at 8/10 and I feel overwhelmed.
        I notice patterns where I always expect the worst outcome. In my experience,
        this connects to childhood criticism that formed core beliefs about inadequacy.
        I'm aware that these patterns no longer serve me.
      `;
      
      const metrics = AnalysisUtils.analyzeContentMetrics(content);
      const userPriority = AnalysisUtils.assessUserDataPriority(content);
      
      expect(metrics.hasUserAssessments).toBe(true);
      expect(metrics.schemaReflectionDepth).toBe('minimal');
      expect(userPriority.shouldPrioritizeUserData).toBe(true);
      expect(userPriority.userDataReliability).toBeGreaterThan(70);
    });
  });
});

// Helper function for range assertions
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBetween(floor: number, ceiling: number): R;
    }
  }
}