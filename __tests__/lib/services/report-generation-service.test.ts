import { ReportGenerationService } from '@/lib/services/report-generation-service';
import {
  generateSessionReport,
  extractStructuredAnalysis,
} from '@/lib/api/groq-client';
import { getConvexHttpClient } from '@/lib/convex/http-client';
import {
  encryptSessionReportContent,
  encryptEnhancedAnalysisData,
} from '@/lib/chat/message-encryption';
import {
  validateTherapeuticContext,
  calculateContextualConfidence,
} from '@/lib/therapy/validators';
import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/parsers';
import { generateFallbackAnalysis as generateFallbackAnalysisExternal } from '@/lib/reports/fallback-analysis';
import { supportsWebSearch, getModelDisplayName } from '@/ai/model-metadata';
import { getReportPrompt } from '@/lib/therapy/therapy-prompts';

// Mocks
jest.mock('@/lib/api/groq-client');
jest.mock('@/lib/therapy/therapy-prompts', () => ({
  __esModule: true,
  ANALYSIS_EXTRACTION_PROMPT_TEXT: 'mock-analysis-prompt',
  getReportPrompt: jest.fn(),
}));
jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: jest.fn(),
  anyApi: {
    reports: {
      create: 'reports:create',
    },
  },
}));
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    therapeuticOperation: jest.fn(),
  },
  devLog: jest.fn(),
}));
jest.mock('@/lib/chat/message-encryption');
jest.mock('@/lib/therapy/validators');
jest.mock('@/lib/therapy/parsers');
jest.mock('@/lib/reports/fallback-analysis');
jest.mock('@/ai/model-metadata');

describe('ReportGenerationService', () => {
  let service: ReportGenerationService;
  const mockSessionId = 'session-123';
  const mockMessages = [
    { role: 'user', content: 'I feel sad' },
    { role: 'assistant', content: 'Tell me more' },
  ] as any[];
  const mockModel = 'llama-3-70b';

  const mockMutation = jest.fn();
  const mockConvexClient = {
    mutation: mockMutation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getConvexHttpClient as jest.Mock).mockReturnValue(mockConvexClient);
    (encryptSessionReportContent as jest.Mock).mockImplementation((text) => `encrypted-${text}`);
    (encryptEnhancedAnalysisData as jest.Mock).mockImplementation((data) => ({
      cognitiveDistortions: 'encrypted-distortions',
      schemaAnalysis: 'encrypted-schema',
      therapeuticFrameworks: 'encrypted-frameworks',
      recommendations: 'encrypted-recommendations',
    }));
    (getModelDisplayName as jest.Mock).mockReturnValue('Llama 3');
    (supportsWebSearch as jest.Mock).mockReturnValue(false);
    (getReportPrompt as jest.Mock).mockReturnValue('mock-report-prompt');
    (validateTherapeuticContext as jest.Mock).mockReturnValue({
      contextualAnalysis: {
        contextType: 'general',
        emotionalIntensity: 5,
        therapeuticRelevance: 5,
      },
    });
    
    service = new ReportGenerationService(mockModel);
  });

  describe('generateReport', () => {
    it('should generate a report successfully without CBT data', async () => {
      (hasCBTData as jest.Mock).mockReturnValue(false);
      (generateSessionReport as jest.Mock).mockResolvedValue('Generated Report Content');
      (extractStructuredAnalysis as jest.Mock).mockResolvedValue(JSON.stringify({
        sessionOverview: { themes: ['sadness'] },
        cognitiveDistortions: [],
        keyPoints: ['Point 1'],
      }));
      
      const result = await service.generateReport(mockSessionId, mockMessages, 'en');
      
      expect(generateSessionReport).toHaveBeenCalledWith(
        mockMessages, 
        'mock-report-prompt', 
        mockModel
      );
      expect(extractStructuredAnalysis).toHaveBeenCalled();
      expect(mockMutation).toHaveBeenCalled();
      expect(result).toEqual({
        reportContent: 'Generated Report Content',
        modelUsed: mockModel,
        modelDisplayName: 'Llama 3',
        cbtDataSource: 'none',
        cbtDataAvailable: false,
      });
    });

    it('should integrate CBT data when available', async () => {
      (hasCBTData as jest.Mock).mockReturnValue(true);
      (parseAllCBTData as jest.Mock).mockReturnValue({
        situation: 'Test situation',
        emotions: { sad: 80 },
        thoughts: ['I am bad'],
      });
      (generateCBTSummary as jest.Mock).mockReturnValue('CBT Summary');
      (generateSessionReport as jest.Mock).mockResolvedValue('Generated Report Content');
      (extractStructuredAnalysis as jest.Mock).mockResolvedValue(JSON.stringify({
        therapeuticInsights: {},
        keyPoints: [],
      }));

      const result = await service.generateReport(mockSessionId, mockMessages, 'en');

      expect(hasCBTData).toHaveBeenCalledWith(mockMessages);
      expect(parseAllCBTData).toHaveBeenCalledWith(mockMessages);
      expect(mockMutation).toHaveBeenCalled();
      
      // Check if CBT data integration logic was triggered (via checking saved data or result)
      expect(result.cbtDataAvailable).toBe(true);
      expect(result.cbtDataSource).toBe('parsed');
    });

    it('should handle analysis extraction failure with fallback', async () => {
        (hasCBTData as jest.Mock).mockReturnValue(false);
        (generateSessionReport as jest.Mock).mockResolvedValue('Generated Report Content');
        // Mock extraction to return invalid JSON or fail
        (extractStructuredAnalysis as jest.Mock).mockResolvedValue('Invalid JSON');
        
        (generateFallbackAnalysisExternal as jest.Mock).mockReturnValue({
            keyPoints: ['Fallback point'],
        });

        const result = await service.generateReport(mockSessionId, mockMessages, 'en');

        expect(generateFallbackAnalysisExternal).toHaveBeenCalledWith('Generated Report Content');
        expect(mockMutation).toHaveBeenCalled();
    });

    it('should throw error if report generation fails', async () => {
      (generateSessionReport as jest.Mock).mockResolvedValue(null);

      await expect(service.generateReport(mockSessionId, mockMessages, 'en'))
        .rejects.toThrow('Failed to generate session report');
    });
    
    it('should handle database save failure gracefully', async () => {
        (hasCBTData as jest.Mock).mockReturnValue(false);
        (generateSessionReport as jest.Mock).mockResolvedValue('Generated Report Content');
        (extractStructuredAnalysis as jest.Mock).mockResolvedValue('{}');
        
        mockMutation.mockRejectedValue(new Error('DB Error'));
        
        // Should not throw, but log error (which is mocked)
        const result = await service.generateReport(mockSessionId, mockMessages, 'en');
        
        expect(result.reportContent).toBe('Generated Report Content');
    });

    it('should apply contextual validation to cognitive distortions', async () => {
        (hasCBTData as jest.Mock).mockReturnValue(false);
        (generateSessionReport as jest.Mock).mockResolvedValue('Generated Report Content');
        
        const mockAnalysis = {
            cognitiveDistortions: [
                { name: 'All-or-nothing', contextAwareConfidence: 50, falsePositiveRisk: 'high' }
            ]
        };
        (extractStructuredAnalysis as jest.Mock).mockResolvedValue(JSON.stringify(mockAnalysis));
        
        (validateTherapeuticContext as jest.Mock).mockReturnValue({
            contextualAnalysis: { contextType: 'general', emotionalIntensity: 5, therapeuticRelevance: 8 }
        });
        (calculateContextualConfidence as jest.Mock).mockReturnValue(40); // Low confidence

        await service.generateReport(mockSessionId, mockMessages, 'en');
        
        expect(validateTherapeuticContext).toHaveBeenCalled();
        expect(calculateContextualConfidence).toHaveBeenCalled();
    });
  });
});
