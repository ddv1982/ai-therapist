import {
  analyzeCBTMessage,
  hasSchemaReflection,
} from '@/lib/chat/cbt-message-detector';
import { validateTherapeuticContext } from '@/lib/therapy/validators';
import * as Analysis from '@/lib/therapy/analysis';

// Mock dependencies
jest.mock('@/lib/chat/cbt-message-detector');
jest.mock('@/lib/therapy/validators');

describe('Therapy Analysis Utilities', () => {
  describe('Pattern Matching & Extraction', () => {
    describe('extractUserRatings', () => {
      it('should extract emotion ratings with format "emotion: 8/10"', () => {
        const content = 'I am feeling - anxiety: 8/10 and - depression: 6/10';
        const ratings = Analysis.extractUserRatings(content);
        expect(ratings).toEqual(expect.arrayContaining([
          expect.objectContaining({ rating: 8, context: 'anxiety', type: 'emotion' }),
          expect.objectContaining({ rating: 6, context: 'depression', type: 'emotion' }),
        ]));
      });

      it('should extract credibility ratings with format "*(8/10)*"', () => {
        const content = 'This thought feels true *(8/10)*';
        const ratings = Analysis.extractUserRatings(content);
        expect(ratings).toContainEqual(
          expect.objectContaining({ rating: 8, context: 'thought credibility', type: 'credibility' })
        );
      });

      it('should extract natural language ratings', () => {
        const examples = [
          { text: 'my anxiety is at 7/10', rating: 7 },
          { text: 'stress is around 5 out of 10', rating: 5 },
          { text: 'I feel 4/10', rating: 4 },
          { text: 'my confidence level has been around 6', rating: 6 },
        ];

        examples.forEach(({ text, rating }) => {
          const ratings = Analysis.extractUserRatings(text);
          expect(ratings.some(r => r.rating === rating)).toBe(true);
        });
      });

      it('should ignore invalid ratings', () => {
        const content = 'my anxiety is 11/10'; // Out of bounds
        const ratings = Analysis.extractUserRatings(content);
        // Depending on implementation, it might filter it.
        // The regex might capture it but the logic check "rating >= 0 && rating <= 10" should filter it.
        // Actually regex for standard format uses \d+, so 11 is captured.
        // enhancedPatterns usually capture specific digits.
        // Let's verify specific behavior.
        expect(ratings.some(r => r.rating === 11)).toBe(false);
      });
    });

    describe('hasUserQuantifiedAssessments', () => {
      it('should return true if ratings are extracted', () => {
        expect(Analysis.hasUserQuantifiedAssessments('- anxiety: 8/10')).toBe(true);
      });

      it('should return true for user quantified assessment patterns even if extraction fails', () => {
        // Some patterns might not be covered by extractUserRatings but are in USER_QUANTIFIED_ASSESSMENT_PATTERNS
        // However, extractUserRatings checks many patterns.
        // Let's test a pattern directly from USER_QUANTIFIED_ASSESSMENT_PATTERNS
        expect(Analysis.hasUserQuantifiedAssessments('self-assessment: 7')).toBe(true);
      });

      it('should return false for text without assessments', () => {
        expect(Analysis.hasUserQuantifiedAssessments('I am feeling sad today.')).toBe(false);
      });
    });

    describe('assessSchemaReflectionDepth', () => {
      it('should detect comprehensive reflection', () => {
        const text = `
          SCHEMA REFLECTION
          I notice patterns in thinking.
          This started in childhood.
          It relates to my core beliefs.
          I have an inner critic voice.
          My vulnerable child part is hurt.
        `;
        expect(Analysis.assessSchemaReflectionDepth(text)).toBe('comprehensive'); // >= 6 matches?
        // Count matches:
        // SCHEMA REFLECTION (1)
        // patterns in thinking (1)
        // started in childhood (1)
        // core beliefs (1)
        // inner critic voice (1)
        // vulnerable child part (1)
        // Total 6.
      });

      it('should detect moderate reflection', () => {
        const text = 'I notice patterns. It reminds me of childhood.';
        // matches: "I notice patterns" (1), "childhood" (maybe "childhood.*patterns" or "childhood.*when" etc)
        // Let's look at patterns: /childhood.*patterns/i, /I notice.*patterns/i
        // "I notice patterns" -> match.
        // "reminds me of childhood" -> might not match specific childhood patterns.
        // Let's use clearer matches.
        const clearText = 'I notice patterns in thinking. core beliefs. self-awareness.';
        expect(Analysis.assessSchemaReflectionDepth(clearText)).toBe('moderate'); // >= 3
      });

      it('should detect minimal reflection', () => {
        const text = 'I have some self-awareness.';
        expect(Analysis.assessSchemaReflectionDepth(text)).toBe('minimal'); // >= 1
      });

      it('should detect none', () => {
        expect(Analysis.assessSchemaReflectionDepth('Hello there.')).toBe('none');
      });
    });

    describe('isBriefRequest', () => {
      it('should identify brief requests', () => {
        expect(Analysis.isBriefRequest('can you search for anxiety resources')).toBe(true);
        expect(Analysis.isBriefRequest('tell me about CBT')).toBe(true);
      });

      it('should return false for detailed content', () => {
        expect(Analysis.isBriefRequest('I have been feeling really down lately because...')).toBe(false);
      });
    });
  });

  describe('Metrics & Priority', () => {
    describe('analyzeContentMetrics', () => {
      it('should calculate metrics correctly', () => {
        const content = 'I feel anxiety: 8/10. I notice patterns in thinking.';
        const metrics = Analysis.analyzeContentMetrics(content);

        expect(metrics.wordCount).toBeGreaterThan(0);
        expect(metrics.hasUserAssessments).toBe(true);
        expect(metrics.userAssessmentCount).toBeGreaterThan(0);
        expect(metrics.userDataReliability).toBeGreaterThan(50); // Bonus for ratings
      });
    });

    describe('assessUserDataPriority', () => {
      it('should prioritize user data when reliability is high', () => {
        const content = '- anxiety: 8/10, - depression: 7/10, - stress: 5/10. I notice patterns.';
        const priority = Analysis.assessUserDataPriority(content);

        expect(priority.hasUserProvidedData).toBe(true);
        expect(priority.shouldPrioritizeUserData).toBe(true); // >= 3 ratings -> reliability += 25. base 50 -> 75.
      });

      it('should not prioritize when data is scarce', () => {
        const content = 'I feel sad.';
        const priority = Analysis.assessUserDataPriority(content);
        expect(priority.shouldPrioritizeUserData).toBe(false);
      });
    });
  });

  describe('ERP Analysis', () => {
    it('should detect compulsive behaviors', () => {
      expect(Analysis.detectCompulsiveBehaviors('I check door lock repeatedly')).toBeGreaterThan(0);
    });

    it('should detect intrusive thoughts', () => {
      expect(Analysis.detectIntrusiveThoughts('I have contamination fear and feel dirty')).toBeGreaterThan(0);
    });

    it('should detect avoidance behaviors', () => {
      expect(Analysis.detectAvoidanceBehaviors('I avoid public restrooms')).toBeGreaterThan(0);
    });

    it('should score thought action fusion', () => {
      expect(Analysis.scoreThoughtActionFusion('thinking makes it happen')).toBeGreaterThan(0);
    });

    it('should score uncertainty intolerance', () => {
      expect(Analysis.scoreUncertaintyIntolerance('I need to know for sure')).toBeGreaterThan(0);
    });

    it('should analyze ERP applicability', () => {
      const content = 'I check door lock repeatedly because I am afraid of intruders. I check stove too.';
      const result = Analysis.analyzeERPApplicability(content);
      expect(result.compulsiveBehaviorCount).toBeGreaterThan(0);
      expect(result.erpApplicabilityScore).toBeGreaterThan(0);
      expect(result.dominantPatterns).toContain('compulsive behaviors');
    });
  });

  describe('Utilities', () => {
    it('should replace template placeholders', () => {
      const t = 'Hello {name}, your score is {score}.';
      const r = Analysis.replaceTemplatePlaceholders(t, { name: 'User', score: '10' });
      expect(r).toBe('Hello User, your score is 10.');
    });

    it('should convert to client friendly language', () => {
      const text = 'cognitive distortion and pathological dysfunction';
      const friendly = Analysis.convertToClientFriendlyLanguage(text);
      expect(friendly).toContain('thinking pattern');
      expect(friendly).toContain('challenging');
      expect(friendly).toContain('difficulty');
    });

    it('should calculate user data weighted confidence', () => {
      const priority = {
        hasUserProvidedData: true,
        userRatingCount: 1,
        userDataReliability: 80,
        shouldPrioritizeUserData: true,
        extractedRatings: [],
        userAssessmentTypes: []
      };
      const conf = Analysis.calculateUserDataWeightedConfidence(50, priority);
      // Reliability 80 -> adj 0.3. base 0.7. weight 1.0 (min 0.85).
      // User conf: 55 + 80*0.35 = 55 + 28 = 83. min 88.
      // Weighted: 83*0.85 + 50*0.15 approx.
      expect(conf).toBeGreaterThan(50);
    });

    it('should return minimal word count threshold', () => {
      expect(Analysis.getMinimumWordCountThreshold('surface')).toBe(25);
      expect(Analysis.getMinimumWordCountThreshold('moderate')).toBe(50);
      expect(Analysis.getMinimumWordCountThreshold('comprehensive')).toBe(100);
    });
  });

  describe('Content Tier Analysis', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should analyze Tier 1 Content (Premium/High Confidence)', () => {
      (analyzeCBTMessage as jest.Mock).mockReturnValue({
        hasCBTHeader: true,
        hasEmotionRatings: true,
        hasAutomaticThoughts: true,
        confidence: 0.9
      });
      (hasSchemaReflection as jest.Mock).mockReturnValue(true);
      (validateTherapeuticContext as jest.Mock).mockReturnValue({
        isValidTherapeuticContext: true,
        contextualAnalysis: {
          emotionalIntensity: 8,
          therapeuticRelevance: 9,
          neutralContextFlags: [],
          stressIndicators: [],
          contextType: 'therapeutic',
          confidence: 100
        }
      });

      const messages = [{ role: 'user', content: 'CBT Entry. Emotion: 8/10. Thought: I am bad.' }];
      const result = Analysis.analyzeContentTier(messages);

      expect(result.tier).toBe('tier1_premium');
      expect(result.analysisRecommendation.shouldAnalyzeCognitiveDistortions).toBe(true);
    });

    it('should analyze Tier 3 Content (Minimal/Brief)', () => {
      (analyzeCBTMessage as jest.Mock).mockReturnValue({
        confidence: 0.1
      });
      (hasSchemaReflection as jest.Mock).mockReturnValue(false);
      (validateTherapeuticContext as jest.Mock).mockReturnValue({
        isValidTherapeuticContext: false,
        exclusionReason: 'brief_interaction',
        contextualAnalysis: {
          emotionalIntensity: 1,
          therapeuticRelevance: 1,
          neutralContextFlags: ['brief'],
          stressIndicators: [],
          contextType: 'neutral',
          confidence: 90
        }
      });

      const messages = [{ role: 'user', content: 'Hi there' }];
      const result = Analysis.analyzeContentTier(messages);

      expect(result.tier).toBe('tier3_minimal');
    });

    it('should analyze Tier 2 Content (Standard)', () => {
      (analyzeCBTMessage as jest.Mock).mockReturnValue({
        confidence: 0.5 // Partial
      });
      (hasSchemaReflection as jest.Mock).mockReturnValue(false);
      (validateTherapeuticContext as jest.Mock).mockReturnValue({
        isValidTherapeuticContext: true,
        contextualAnalysis: {
          emotionalIntensity: 6,
          therapeuticRelevance: 7,
          neutralContextFlags: [],
          stressIndicators: ['stress'],
          contextType: 'therapeutic',
          confidence: 80
        }
      });

      const messages = [{ role: 'user', content: 'I am feeling a bit stressed about work.' }];
      const result = Analysis.analyzeContentTier(messages);

      expect(result.tier).toBe('tier2_standard');
    });

    it('should handle empty content', () => {
        const messages: any[] = [];
        const result = Analysis.analyzeContentTier(messages);
        expect(result.tier).toBe('tier3_minimal');
    });

    it('should analyze Tier 1 Content via hasUserQuantifiedAssessments and schema depth', () => {
      (analyzeCBTMessage as jest.Mock).mockReturnValue({
        confidence: 0.1
      });
      (hasSchemaReflection as jest.Mock).mockReturnValue(false);
      // This test relies on analyzeContentTier internal logic:
      // if (hasStrongCBT || hasSchemaContent || (hasUserData && schemaDepth !== 'none') ...
      // We want to trigger (hasUserData && schemaDepth !== 'none')
      (validateTherapeuticContext as jest.Mock).mockReturnValue({
        isValidTherapeuticContext: true,
        contextualAnalysis: {
          emotionalIntensity: 5,
          therapeuticRelevance: 5,
          neutralContextFlags: [],
          stressIndicators: [],
          contextType: 'therapeutic',
          confidence: 80
        }
      });

      // To mock hasUserData, we can use a string that matches patterns, or mock extraction (if we could, but it's inside the file).
      // We are testing the real Analysis functions (except the mocked external ones).
      // So we need a string that passes extractUserRatings/hasUserQuantifiedAssessments AND assessSchemaReflectionDepth.
      // String: "My anxiety is 8/10. I notice patterns in thinking."
      const messages = [{ role: 'user', content: 'My anxiety is 8/10. I notice patterns in thinking.' }];
      const result = Analysis.analyzeContentTier(messages);
      
      expect(result.tier).toBe('tier1_premium');
    });
  });

  describe('getContentTierExplanation', () => {
    it('should generate explanation', () => {
      const analysis: Analysis.ContentTierAnalysis = {
        tier: 'tier1_premium',
        confidence: 90,
        triggers: ['Trigger1'],
        analysisRecommendation: {} as any,
        reportType: 'client_friendly',
        userSelfAssessmentPresent: true,
        schemaReflectionDepth: 'moderate'
      };
      const exp = Analysis.getContentTierExplanation(analysis);
      expect(exp).toContain('Premium CBT/Schema Analysis');
      expect(exp).toContain('Trigger1');
      expect(exp).toContain('User self-assessments detected');
    });
  });

  describe('meetsAnalysisThreshold', () => {
      it('should return true for tier 1 and 2', () => {
          expect(Analysis.meetsAnalysisThreshold({ tier: 'tier1_premium' } as any)).toBe(true);
          expect(Analysis.meetsAnalysisThreshold({ tier: 'tier2_standard' } as any)).toBe(true);
      });

      it('should return true for tier 3 ONLY if insights are recommended', () => {
          expect(Analysis.meetsAnalysisThreshold({
              tier: 'tier3_minimal',
              analysisRecommendation: { shouldProvideTherapeuticInsights: true }
           } as any)).toBe(true);

           expect(Analysis.meetsAnalysisThreshold({
            tier: 'tier3_minimal',
            analysisRecommendation: { shouldProvideTherapeuticInsights: false }
         } as any)).toBe(false);
      });
  });

  describe('Branch Coverage & Edge Cases', () => {
    describe('calculateUserDataWeightedConfidence', () => {
      it('should return AI confidence if no user data', () => {
        const priority = { hasUserProvidedData: false } as any;
        expect(Analysis.calculateUserDataWeightedConfidence(80, priority)).toBe(80);
      });

      it('should handle low reliability user data', () => {
        const priority = {
          hasUserProvidedData: true,
          userDataReliability: 30 // < 50
        } as any;
        // expected: aiConf + (30-50)*0.05 = aiConf - 1.
        // Then weighted avg.
        const conf = Analysis.calculateUserDataWeightedConfidence(80, priority);
        expect(conf).toBeLessThan(80);
      });
    });

    describe('getMinimumWordCountThreshold', () => {
      it('should return default for unknown type', () => {
        expect(Analysis.getMinimumWordCountThreshold('unknown' as any)).toBe(25);
      });
    });

    describe('analyzeContentTier (Tier 2 Branches)', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should handle high therapeutic relevance in Tier 2', () => {
             (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.5 });
             (hasSchemaReflection as jest.Mock).mockReturnValue(false);
             (validateTherapeuticContext as jest.Mock).mockReturnValue({
                 isValidTherapeuticContext: true,
                 contextualAnalysis: {
                     emotionalIntensity: 5,
                     therapeuticRelevance: 8, // High
                     neutralContextFlags: [],
                     stressIndicators: ['stress', 'anxiety'], // >= 2
                     contextType: 'therapeutic',
                     confidence: 100
                 }
             });

             const result = Analysis.analyzeContentTier([{ role: 'user', content: 'text' }]);
             expect(result.tier).toBe('tier2_standard');
             expect(result.triggers).toContain('High therapeutic relevance detected');
             expect(result.triggers).toContain('Multiple emotional distress indicators');
        });

        it('should handle user self assessments in Tier 2', () => {
            // Tier 2 path: not Tier 1.
            // Tier 1 checks: hasUserData && schemaDepth !== 'none'.
            // So if we have UserData but schemaDepth is 'none', it falls through to logic check.
            // analyzeContentTier logic:
            // if (hasStrongCBT || hasSchemaContent || (hasUserData && schemaDepth !== 'none') || (cbtSignature.confidence >= 0.4 && hasUserData))
            // We need to avoid these to hit Tier 2 WITH user data?
            // If hasUserData is true, and conf < 0.4, and schemaDepth none.
            
            (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.2 });
            (hasSchemaReflection as jest.Mock).mockReturnValue(false);
            (validateTherapeuticContext as jest.Mock).mockReturnValue({
                isValidTherapeuticContext: true,
                contextualAnalysis: {
                    emotionalIntensity: 5,
                    therapeuticRelevance: 5,
                    neutralContextFlags: [],
                    stressIndicators: [],
                    contextType: 'therapeutic',
                    confidence: 100
                }
            });
            
            // Content that has user data but no schema reflection.
            const content = '- anxiety: 8/10.'; 
            const result = Analysis.analyzeContentTier([{ role: 'user', content }]);
            expect(result.tier).toBe('tier2_standard');
            expect(result.userSelfAssessmentPresent).toBe(true);
            expect(result.triggers).toContain('User self-assessments and ratings detected');
       });

       it('should handle low emotional intensity in Tier 2', () => {
            (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.2 });
            (hasSchemaReflection as jest.Mock).mockReturnValue(false);
            (validateTherapeuticContext as jest.Mock).mockReturnValue({
                isValidTherapeuticContext: true,
                contextualAnalysis: {
                    emotionalIntensity: 2, // <= 3
                    therapeuticRelevance: 5,
                    neutralContextFlags: [],
                    stressIndicators: [],
                    contextType: 'therapeutic',
                    confidence: 100
                }
            });
            
            const result = Analysis.analyzeContentTier([{ role: 'user', content: 'mild stuff' }]);
            expect(result.tier).toBe('tier2_standard');
            // Check confidence cap or logic if possible, but tier check is good enough to exercise the path.
       });

       it('should handle high emotional intensity in Tier 2', () => {
           (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.2 });
           (hasSchemaReflection as jest.Mock).mockReturnValue(false);
           (validateTherapeuticContext as jest.Mock).mockReturnValue({
               isValidTherapeuticContext: true,
               contextualAnalysis: {
                   emotionalIntensity: 9, // >= 8
                   therapeuticRelevance: 5,
                   neutralContextFlags: [],
                   stressIndicators: [],
                   contextType: 'therapeutic',
                   confidence: 100
               }
           });
           
           const result = Analysis.analyzeContentTier([{ role: 'user', content: 'INTENSE' }]);
           expect(result.tier).toBe('tier2_standard');
      });
    });

    describe('analyzeContentTier (Tier 3 Branches)', () => {
        it('should handle brief request in Tier 3', () => {
            (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.1 });
            (hasSchemaReflection as jest.Mock).mockReturnValue(false);
            (validateTherapeuticContext as jest.Mock).mockReturnValue({
                isValidTherapeuticContext: false,
                contextualAnalysis: {
                    emotionalIntensity: 1,
                    therapeuticRelevance: 1,
                    neutralContextFlags: [],
                    stressIndicators: [],
                    contextType: 'neutral',
                    confidence: 100
                }
            });

            const result = Analysis.analyzeContentTier([{ role: 'user', content: 'can you search for X' }]);
            expect(result.tier).toBe('tier3_minimal');
            expect(result.triggers).toContain('Brief request or casual interaction');
        });

        it('should handle neutral context flags in Tier 3', () => {
            (analyzeCBTMessage as jest.Mock).mockReturnValue({ confidence: 0.1 });
            (hasSchemaReflection as jest.Mock).mockReturnValue(false);
            (validateTherapeuticContext as jest.Mock).mockReturnValue({
                isValidTherapeuticContext: false,
                contextualAnalysis: {
                    emotionalIntensity: 1,
                    therapeuticRelevance: 1,
                    neutralContextFlags: ['meeting_notes'],
                    stressIndicators: [],
                    contextType: 'neutral',
                    confidence: 100
                }
            });

            const result = Analysis.analyzeContentTier([{ role: 'user', content: 'notes' }]);
            expect(result.tier).toBe('tier3_minimal');
            expect(result.triggers).toContain('Neutral/organizational context flags');
        });
    });
  });
});
