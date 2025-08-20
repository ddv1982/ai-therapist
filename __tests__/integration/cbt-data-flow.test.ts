/**
 * CBT Data Flow Integration Test
 * 
 * Tests the complete data flow from CBT diary completion through
 * report generation to display components.
 */

import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/cbt-data-parser';
// import type { ExtractedCBTData } from '@/lib/therapy/cbt-data-parser';

describe('CBT Data Flow Integration', () => {
  describe('Card Format Data Flow', () => {
    it('should handle complete CBT session data from new card format', () => {
      // Simulate a message with new card format CBT data
      const mockMessage = {
        role: 'assistant',
        content: `
<!-- CBT_SUMMARY_CARD:{"situation":"Feeling overwhelmed at work","date":"2024-01-15","initialEmotions":[{"emotion":"anxiety","rating":8},{"emotion":"stress","rating":7}],"finalEmotions":[{"emotion":"anxiety","rating":4},{"emotion":"stress","rating":3}],"automaticThoughts":[{"thought":"I can't handle this workload"},{"thought":"I'm going to fail"}],"coreBelief":{"belief":"I am not good enough","credibility":8},"rationalThoughts":[{"thought":"I have handled difficult situations before"},{"thought":"I can ask for help when needed"}],"schemaModes":[{"name":"Vulnerable Child","intensity":7}],"newBehaviors":["Take regular breaks","Practice deep breathing"],"alternativeResponses":[{"response":"Ask supervisor for guidance"}]} -->

This is a CBT session summary card that contains structured therapeutic data.
        `
      };

      const messages = [mockMessage];

      // Test 1: Data detection
      expect(hasCBTData(messages)).toBe(true);

      // Test 2: Data parsing
      const extractedData = parseAllCBTData(messages);
      
      // Verify situation data
      expect(extractedData.situation).toEqual({
        date: "2024-01-15",
        description: "Feeling overwhelmed at work"
      });

      // Verify emotions data
      expect(extractedData.emotions?.initial).toEqual({
        anxiety: 8,
        stress: 7
      });
      expect(extractedData.emotions?.final).toEqual({
        anxiety: 4,
        stress: 3
      });

      // Verify thoughts data
      expect(extractedData.thoughts?.automaticThoughts).toEqual([
        "I can't handle this workload",
        "I'm going to fail"
      ]);

      // Verify core beliefs data
      expect(extractedData.coreBeliefs).toEqual({
        belief: "I am not good enough",
        credibility: 8
      });

      // Verify rational thoughts data
      expect(extractedData.rationalThoughts?.thoughts).toEqual([
        "I have handled difficult situations before",
        "I can ask for help when needed"
      ]);

      // Verify schema modes data
      expect(extractedData.schemaModes).toEqual([{
        name: "Vulnerable Child",
        intensity: 7,
        description: "Vulnerable Child"
      }]);

      // Verify action plan data
      expect(extractedData.actionPlan).toEqual({
        newBehaviors: ["Take regular breaks", "Practice deep breathing"],
        alternativeResponses: ["Ask supervisor for guidance"]
      });

      // Test 3: Summary generation
      const summary = generateCBTSummary(extractedData);
      expect(summary).toContain("Feeling overwhelmed at work");
      expect(summary).toContain("anxiety: 8/10, stress: 7/10");
      expect(summary).toContain("2 identified");
    });
  });

  describe('Legacy Format Data Flow', () => {
    it('should handle CBT data from old markdown format', () => {
      const mockMessage = {
        role: 'assistant',
        content: `
**CBT Session - Situation Analysis**

📅 **Date**: 2024-01-15
📝 **Situation**: Feeling overwhelmed at work with multiple deadlines

---

**CBT Session - Emotion Assessment**

💭 **Current Emotional State**:
• **Anxiety**: 8/10
• **Stress**: 7/10
• **Sadness**: 3/10

**Total Emotions Rated**: 3

---

**CBT Session - Automatic Thoughts**

🧠 **Identified Thoughts**:
1. "I can't handle this workload"
2. "I'm going to fail at everything"
3. "Everyone will think I'm incompetent"

**Total Thoughts Identified**: 3

---

**CBT Session - Core Belief Exploration**

🎯 **Identified Core Belief**: "I am not good enough"
📊 **Belief Strength**: 8/10

---
        `
      };

      const messages = [mockMessage];

      // Test data detection and parsing
      expect(hasCBTData(messages)).toBe(true);
      
      const extractedData = parseAllCBTData(messages);

      // Verify parsed data structure
      expect(extractedData.situation).toEqual({
        date: "2024-01-15",
        description: "Feeling overwhelmed at work with multiple deadlines"
      });

      expect(extractedData.emotions?.initial).toEqual({
        anxiety: 8,
        other: 7,  // "Stress" is treated as custom emotion in old format
        sadness: 3
      });

      expect(extractedData.thoughts?.automaticThoughts).toEqual([
        "I can't handle this workload",
        "I'm going to fail at everything",
        "Everyone will think I'm incompetent"
      ]);

      expect(extractedData.coreBeliefs).toEqual({
        belief: "I am not good enough",
        credibility: 8
      });
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should handle malformed card format gracefully', () => {
      const mockMessage = {
        role: 'assistant',
        content: `
<!-- CBT_SUMMARY_CARD:{"invalid":"json"} -->
This card has invalid JSON structure.
        `
      };

      const messages = [mockMessage];
      
      // Should still detect CBT data but parsing should return empty
      expect(hasCBTData(messages)).toBe(true);
      
      const extractedData = parseAllCBTData(messages);
      expect(Object.keys(extractedData)).toHaveLength(0);
    });

    it('should handle empty messages gracefully', () => {
      const messages: Array<{ content: string; role: string }> = [];
      
      expect(hasCBTData(messages)).toBe(false);
      
      const extractedData = parseAllCBTData(messages);
      expect(Object.keys(extractedData)).toHaveLength(0);
    });

    it('should handle mixed content without CBT data', () => {
      const mockMessage = {
        role: 'user',
        content: 'Hello, how are you today? I need some help with anxiety.'
      };

      const messages = [mockMessage];
      
      expect(hasCBTData(messages)).toBe(false);
      
      const extractedData = parseAllCBTData(messages);
      expect(Object.keys(extractedData)).toHaveLength(0);
    });
  });

  describe('Report Integration Simulation', () => {
    it('should simulate complete report generation flow', () => {
      // Simulate complete CBT session data
      const cbtMessage = {
        role: 'assistant',
        content: `
<!-- CBT_SUMMARY_CARD:{"situation":"Work stress situation","date":"2024-01-15","initialEmotions":[{"emotion":"anxiety","rating":8},{"emotion":"stress","rating":7}],"finalEmotions":[{"emotion":"anxiety","rating":3},{"emotion":"stress","rating":2}],"automaticThoughts":[{"thought":"I can't handle this"}],"coreBelief":{"belief":"I'm inadequate","credibility":7},"rationalThoughts":[{"thought":"I've succeeded before"}],"schemaModes":[{"name":"Vulnerable Child","intensity":6}],"newBehaviors":["Take breaks"],"alternativeResponses":[{"response":"Ask for help"}]} -->

CBT session completed with therapeutic insights.
        `
      };

      const regularMessage = {
        role: 'user',
        content: 'Thank you for helping me work through this situation.'
      };

      const messages = [cbtMessage, regularMessage];

      // Step 1: Detect CBT data (simulates report generation detection)
      const hasCBT = hasCBTData(messages);
      expect(hasCBT).toBe(true);

      // Step 2: Parse CBT data (simulates report generation parsing)
      const cbtData = parseAllCBTData(messages);
      expect(cbtData).toBeDefined();
      expect(cbtData.situation).toBeDefined();
      expect(cbtData.emotions).toBeDefined();
      expect(cbtData.actionPlan).toBeDefined();

      // Step 3: Generate summary (simulates inclusion in therapeutic insights)
      const summary = generateCBTSummary(cbtData);
      expect(summary).toContain("Work stress situation");
      expect(summary).toContain("anxiety: 8/10");

      // Step 4: Simulate structured data for display components
      const reportDetail = {
        id: 'test-report-1',
        sessionId: 'test-session-1',
        sessionTitle: 'CBT Session Test',
        sessionDate: '2024-01-15',
        reportDate: '2024-01-15',
        contentPreview: 'CBT session completed...',
        keyInsights: ['Anxiety reduced', 'Coping strategies identified'],
        hasEncryptedContent: true,
        reportSize: 1024,
        fullContent: 'Full therapeutic report content...',
        structuredCBTData: cbtData
      };

      // Verify that structured data can be used by display components
      expect(reportDetail.structuredCBTData).toEqual(cbtData);
      
      // Simulate display component checks
      const hasValidData = !!(
        cbtData.situation || 
        (cbtData.emotions && Object.keys(cbtData.emotions.initial || {}).length > 0) ||
        (cbtData.thoughts && cbtData.thoughts.automaticThoughts?.length > 0) ||
        cbtData.coreBeliefs ||
        (cbtData.rationalThoughts && cbtData.rationalThoughts.thoughts?.length > 0) ||
        (cbtData.schemaModes && cbtData.schemaModes.length > 0) ||
        cbtData.actionPlan
      );

      expect(hasValidData).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      // Create message with large amount of CBT data
      const largeEmotionsList = Array.from({ length: 50 }, (_, i) => ({
        emotion: `emotion_${i}`,
        rating: Math.floor(Math.random() * 10) + 1
      }));

      const largeThoughtsList = Array.from({ length: 100 }, (_, i) => ({
        thought: `This is automatic thought number ${i} with some realistic content about various situations and concerns.`
      }));

      const largeCBTData = {
        situation: "Complex situation with multiple stressors",
        date: "2024-01-15",
        initialEmotions: largeEmotionsList,
        automaticThoughts: largeThoughtsList,
        coreBelief: { belief: "Complex core belief", credibility: 8 },
        rationalThoughts: largeThoughtsList.map(t => ({ thought: `Rational: ${t.thought}` })),
        schemaModes: [{ name: "Multiple Mode", intensity: 7 }],
        newBehaviors: Array.from({ length: 20 }, (_, i) => `Behavior ${i}`),
        alternativeResponses: Array.from({ length: 20 }, (_, i) => ({ response: `Response ${i}` }))
      };

      const mockMessage = {
        role: 'assistant',
        content: `<!-- CBT_SUMMARY_CARD:${JSON.stringify(largeCBTData)} -->`
      };

      const messages = [mockMessage];

      // Performance test - should complete within reasonable time
      const start = Date.now();
      const extractedData = parseAllCBTData(messages);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(extractedData.emotions?.initial).toBeDefined();
      expect(Object.keys(extractedData.emotions?.initial || {})).toHaveLength(50);
      expect(extractedData.thoughts?.automaticThoughts).toHaveLength(100);
    });

    it('should handle multiple CBT sessions in message history', () => {
      const session1 = {
        role: 'assistant',
        content: `<!-- CBT_SUMMARY_CARD:{"situation":"Session 1","date":"2024-01-15","initialEmotions":[{"emotion":"anxiety","rating":8}]} -->`
      };

      const session2 = {
        role: 'assistant', 
        content: `<!-- CBT_SUMMARY_CARD:{"situation":"Session 2","date":"2024-01-16","initialEmotions":[{"emotion":"stress","rating":6}]} -->`
      };

      const messages = [session1, session2];

      // Should return data from the first found session (as per current implementation)
      const extractedData = parseAllCBTData(messages);
      expect(extractedData.situation?.description).toBe("Session 1");
      expect(extractedData.emotions?.initial).toEqual({ anxiety: 8 });
    });
  });
});