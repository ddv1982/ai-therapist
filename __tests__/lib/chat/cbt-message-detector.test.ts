import {
  analyzeCBTMessage,
  isCBTDiaryMessage,
  getCBTIdentificationReason,
  extractCBTDate,
  hasSchemaReflection,
  hasUserQuantifiedAssessments,
  extractUserRatings,
} from '@/lib/chat/cbt-message-detector';

describe('CBT Message Detector', () => {
  describe('Headers', () => {
    it.each([
        '🌟 CBT Diary Entry',
        '# 🌟 CBT Diary',
        'CBT Diary Entry with Analysis',
    ])('detects header: "%s"', (header) => {
        const result = analyzeCBTMessage(header);
        expect(result.hasCBTHeader).toBe(true);
    });

    it('does not detect unrelated headers', () => {
        expect(analyzeCBTMessage('Daily Journal').hasCBTHeader).toBe(false);
        expect(analyzeCBTMessage('My Thoughts').hasCBTHeader).toBe(false);
    });
  });

  describe('Sections', () => {
    const sections = [
      '## 📍 Situation Context',
      '## 💭 Emotional Landscape',
      '## 💭 Initial Emotions',
      '## 🧠 Automatic Thoughts',
      '## 🎯 Core Schema Analysis',
      '## Challenge Questions',
      '## Final Reflection',
      '## 🔄 Rational Thoughts',
      '## ✨ Final Reflection',
    ];

    it.each(sections)('detects section: "%s"', (section) => {
      // analyzeCBTMessage counts matches. To set hasCBTSections true, we need >= 3.
      // But here we might want to verify individual pattern matching if possible, 
      // or just check that it contributes to the count. 
      // Since we can't check the internal count directly, we can check that providing 3 of them results in true.
      
      // For unit testing specific patterns, we can construct a message with just one and see if confidence is non-zero or checks other props? 
      // Actually hasCBTSections is strict >= 3.
      
      // Let's test that 3 distinct sections trigger the flag.
      // const msg = `${section}\n\n## 📍 Situation Context\n\n## 🧠 Automatic Thoughts`; 
      // Note: if section is one of those appended, regex might match same one twice if we aren't careful about unique checks in implementation? 
      // Implementation uses reduce on patterns list. So duplicates in content don't matter, it checks if EACH pattern exists.
      
      // Construct a message with 3 unique sections including the one under test
      const uniqueSections = [
          '## 📍 Situation Context', 
          '## 🧠 Automatic Thoughts', 
          '## 🎯 Core Schema Analysis'
      ].filter(s => s !== section && !section.includes(s.replace('## ', '').trim())); // rough filtering
      
      const msgToTest = `${section}\n${uniqueSections[0]}\n${uniqueSections[1]}`;
      const result = analyzeCBTMessage(msgToTest);
      expect(result.hasCBTSections).toBe(true);
    });

    it('requires at least 3 sections for hasCBTSections', () => {
        const result = analyzeCBTMessage('## 📍 Situation Context\n## 🧠 Automatic Thoughts');
        expect(result.hasCBTSections).toBe(false);
    });
  });

  describe('Emotion Ratings', () => {
      it('detects structured emotion ratings', () => {
          const msg = '- Anxiety: 7/10\n- Sadness: 5/10';
          const result = analyzeCBTMessage(msg);
          expect(result.hasEmotionRatings).toBe(true);
      });

      it('requires at least 2 emotion ratings', () => {
          const msg = '- Anxiety: 7/10';
          const result = analyzeCBTMessage(msg);
          expect(result.hasEmotionRatings).toBe(false);
      });

      it('detects ratings with word chars', () => {
           const msg = '- SelfDoubt: 8/10\n- Anger: 4/10';
           const result = analyzeCBTMessage(msg);
           expect(result.hasEmotionRatings).toBe(true);
      });
  });

  describe('Automatic Thoughts', () => {
      it('detects automatic thoughts with credibility', () => {
          const msg = '- "I will fail" *(8/10)*';
          const result = analyzeCBTMessage(msg);
          expect(result.hasAutomaticThoughts).toBe(true);
      });

      it('detects standalone credibility ratings in correct format', () => {
          const msg = '*(8/10)*';
          const result = analyzeCBTMessage(msg);
          expect(result.hasAutomaticThoughts).toBe(true);
      });
  });

  describe('Schema Analysis', () => {
      const patterns = [
          '*Credibility: 8/10*',
          'Core Belief: I am unlovable',
          'Behavioral Patterns:',
          'Confirming behaviors:',
          'Avoidant behaviors:',
          'Schema Modes'
      ];

      it.each(patterns)('detects schema element: "%s"', (pattern) => {
          // Needs >= 2 matches
          const otherPattern = patterns.find(p => p !== pattern) || patterns[0];
          const msg = `${pattern}\n${otherPattern}`;
          const result = analyzeCBTMessage(msg);
          expect(result.hasSchemaAnalysis).toBe(true);
      });

      it('requires at least 2 schema elements', () => {
          const result = analyzeCBTMessage('Core Belief: I am unlovable');
          expect(result.hasSchemaAnalysis).toBe(false);
      });
  });

  describe('Quantified Self Assessments (Enhanced)', () => {
      const patterns = [
          'I feel anxiety at 7/10',
          'My stress level is 8',
          'I would rate this feeling as 6',
          "On a scale of 1-10, I'm at 7",
          'I assess my confidence as 4',
          "Personally I'd say 6 out of 10",
          '7/10 intensity',
          'feeling about 80 percent confident'
      ];

      it.each(patterns)('detects quantified pattern: "%s"', (pattern) => {
          const result = analyzeCBTMessage(pattern);
          expect(result.hasQuantifiedSelfAssessment).toBe(true);
      });
  });

  describe('User Provided Ratings (Premium)', () => {
      const patterns = [
          '- Anxiety: 7/10',
          '*(7/10)*',
          'I rate this as 6',
          'self-assessment: 8',
          'my rating: 5'
      ];

      it.each(patterns)('detects user rating pattern: "%s"', (pattern) => {
          const result = analyzeCBTMessage(pattern);
          expect(result.hasUserProvidedRatings).toBe(true);
      });
  });

  describe('Schema Reflection', () => {
      it('detects schema reflection content', () => {
          const msg = 'SCHEMA REFLECTION\nTHERAPEUTIC INSIGHTS';
          const result = analyzeCBTMessage(msg);
          expect(result.hasSchemaReflectionContent).toBe(true);
      });

      it('calculates minimal depth', () => {
          // Need 1-3 matches
          const msg = 'childhood patterns shaped my life';
          const result = analyzeCBTMessage(msg);
          expect(result.schemaReflectionDepth).toBe('minimal');
      });

      it('calculates moderate depth', () => {
          // Need 4-7 matches
          const msg = `
            childhood patterns shaped
            early experiences influence
            core beliefs formed
            schema modes activated
          `;
          const result = analyzeCBTMessage(msg);
          expect(result.schemaReflectionDepth).toBe('moderate');
      });
      
      it('calculates comprehensive depth', () => {
          // Need >= 8 matches
          const msg = `
            SCHEMA REFLECTION THERAPEUTIC INSIGHTS
            Personal Self-Assessment
            Guided Reflection Insights
            childhood patterns shaped
            early experiences influence
            core beliefs formed
            schema modes activated
            maladaptive patterns developed
          `;
          const result = analyzeCBTMessage(msg);
          expect(result.schemaReflectionDepth).toBe('comprehensive');
      });
  });

  describe('Confidence Calculation', () => {
      it('calculates high confidence for comprehensive entry', () => {
          const msg = `
            🌟 CBT Diary Entry
            ## 📍 Situation Context
            ## 🧠 Automatic Thoughts
            ## 🎯 Core Schema Analysis
            - Anxiety: 8/10
            - Fear: 7/10
            I rate this as 9.
            SCHEMA REFLECTION
          `;
          const result = analyzeCBTMessage(msg);
          expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('calculates zero confidence for irrelevant text', () => {
          const result = analyzeCBTMessage('Just a random message');
          expect(result.confidence).toBe(0);
      });

      it('caps confidence at 1.0', () => {
           // Construct super message
           const msg = `
            🌟 CBT Diary Entry
            ## 📍 Situation Context
            ## 🧠 Automatic Thoughts
            ## 🎯 Core Schema Analysis
            - Anxiety: 8/10
            - Fear: 7/10
            *(8/10)*
            Core Belief: Bad
            Behavioral Patterns: Bad
            SCHEMA REFLECTION
            Personal Self-Assessment
            Guided Reflection Insights
            childhood patterns shaped
            early experiences influence
            core beliefs formed
            schema modes activated
            maladaptive patterns developed
            protective mechanisms learned
            inner critic voice
            vulnerable child part
           `;
           const result = analyzeCBTMessage(msg);
           expect(result.confidence).toBe(1.0);
      });
  });

  describe('Helper Functions', () => {
      describe('isCBTDiaryMessage', () => {
          it('returns true when confidence is above threshold', () => {
             // Header + Sections + UserRatings + Quantified + SchemaReflection
             
             const strongMsg = `
                🌟 CBT Diary Entry
                ## 📍 Situation Context
                ## 🧠 Automatic Thoughts
                ## 🎯 Core Schema Analysis
                - Anxiety: 8/10
                - Fear: 7/10
             `;
             expect(isCBTDiaryMessage(strongMsg)).toBe(true);
          });

          it('respects custom threshold', () => {
              const msg = '🌟 CBT Diary Entry'; // 0.25
              expect(isCBTDiaryMessage(msg, 0.2)).toBe(true);
              expect(isCBTDiaryMessage(msg, 0.3)).toBe(false);
          });
      });

      describe('getCBTIdentificationReason', () => {
          it('returns "No CBT indicators found" for empty/irrelevant', () => {
              const sig = analyzeCBTMessage('nothing');
              expect(getCBTIdentificationReason(sig)).toBe('No CBT indicators found');
          });

          it('lists single reason', () => {
              const sig = analyzeCBTMessage('🌟 CBT Diary Entry');
              expect(getCBTIdentificationReason(sig)).toBe('Contains CBT diary header');
          });

          it('lists multiple reasons joined correctly', () => {
               const sig = analyzeCBTMessage('🌟 CBT Diary Entry\n- Anxiety: 8/10');
               // Header + UserRatings + QuantifiedSelf (due to overlap in logic sometimes) or EmotionRatings?
               // Header -> yes
               // EmotionRatings -> No (needs 2)
               // UserProvidedRatings -> Yes ("- Anxiety: 8/10" matches USER_RATING_PATTERNS)
               // QuantifiedSelf -> Yes ("- Anxiety: 8/10" might match? No, QUANTIFIED_SELF_PATTERNS are different)
               // Let's check regex: 
               // USER_RATING_PATTERNS: /-\s*\w+:\s*\d+\/10/g
               
               const reason = getCBTIdentificationReason(sig);
               expect(reason).toContain('user-provided ratings');
               expect(reason).toContain('CBT diary header');
               expect(reason).toContain(' and ');
          });
      });

      describe('extractCBTDate', () => {
          it('extracts bold date', () => {
              expect(extractCBTDate('**Date:** 2023-01-01')).toBe('2023-01-01');
          });
          it('extracts plain date', () => {
              expect(extractCBTDate('Date: January 5, 2023')).toBe('January 5, 2023');
          });
          it('returns null when not found', () => {
              expect(extractCBTDate('No date here')).toBeNull();
          });
      });

      describe('hasSchemaReflection', () => {
          it('returns true if pattern matches', () => {
              expect(hasSchemaReflection('childhood patterns shaped')).toBe(true);
          });
          it('returns false if no pattern', () => {
              expect(hasSchemaReflection('Hello world')).toBe(false);
          });
      });

      describe('hasUserQuantifiedAssessments', () => {
          it('detects quantified patterns', () => {
              expect(hasUserQuantifiedAssessments('I feel anxiety at 7/10')).toBe(true);
          });
          it('detects user rating patterns', () => {
              expect(hasUserQuantifiedAssessments('my rating: 5')).toBe(true);
          });
      });

      describe('extractUserRatings', () => {
          it('extracts structured emotion ratings', () => {
              const ratings = extractUserRatings('- Anxiety: 7/10\n- Fear: 5/10');
              expect(ratings).toHaveLength(2);
              expect(ratings[0]).toEqual({ rating: 7, context: 'Anxiety', type: 'emotion' });
          });

          it('extracts credibility ratings', () => {
              const ratings = extractUserRatings('*(8/10)*');
              expect(ratings).toHaveLength(1);
              expect(ratings[0]).toEqual({ rating: 8, context: 'thought credibility', type: 'credibility' });
          });

          it('extracts general self-assessments', () => {
              const ratings = extractUserRatings('I feel anxiety at 7/10');
              expect(ratings).toHaveLength(1);
              expect(ratings[0]).toEqual({ rating: 7, context: 'self-assessment', type: 'emotion' });
          });

          it('validates rating range', () => {
               // Regex usually enforces digits, but parseInt might be anything.
               // The regex is \d+. But logic checks >= 0 && <= 10 for general patterns.
               const ratings = extractUserRatings('I feel anxiety at 15/10'); 
               // "15" matches \d+. 
               expect(ratings).toHaveLength(0); 
          });
      });
  });
});
