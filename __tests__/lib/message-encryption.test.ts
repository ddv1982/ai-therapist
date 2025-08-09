/**
 * Message Encryption Service Test Suite
 * Tests all functions in message-encryption.ts for complete coverage
 */

import {
  encryptMessage,
  decryptMessage,
  encryptMessages,
  decryptMessages,
  encryptSessionReportContent,
  decryptSessionReportContent,
  isContentEncrypted,
  safeDecryptMessage,
  safeDecryptMessages,
  encryptCognitiveDistortions,
  decryptCognitiveDistortions,
  encryptSchemaAnalysis,
  decryptSchemaAnalysis,
  encryptTherapeuticFrameworks,
  decryptTherapeuticFrameworks,
  encryptTherapeuticRecommendations,
  decryptTherapeuticRecommendations,
  encryptEnhancedAnalysisData,
  decryptEnhancedAnalysisData,
  EncryptedMessage,
  DecryptedMessage
} from '@/lib/message-encryption';

// Mock the crypto utils
jest.mock('@/lib/crypto-utils', () => ({
  encryptSensitiveData: jest.fn(),
  decryptSensitiveData: jest.fn(),
}));

const mockEncrypt = require('@/lib/crypto-utils').encryptSensitiveData;
const mockDecrypt = require('@/lib/crypto-utils').decryptSensitiveData;

describe('Message Encryption Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockEncrypt.mockImplementation((data: string) => `encrypted-${data}`);
    mockDecrypt.mockImplementation((data: string) => data.replace('encrypted-', ''));
    
    // Mock console.error to suppress expected error messages in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('encryptMessage', () => {
    it('should encrypt message content while preserving role', () => {
      const message = {
        role: 'user',
        content: 'I feel anxious about my presentation tomorrow.',
      };

      const result = encryptMessage(message);

      expect(mockEncrypt).toHaveBeenCalledWith('I feel anxious about my presentation tomorrow.');
      expect(result.role).toBe('user');
      expect(result.content).toBe('encrypted-I feel anxious about my presentation tomorrow.');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should preserve provided timestamp', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const message = {
        role: 'assistant',
        content: 'That sounds challenging.',
        timestamp,
      };

      const result = encryptMessage(message);

      expect(result.timestamp).toBe(timestamp);
      expect(result.content).toBe('encrypted-That sounds challenging.');
    });

    it('should generate timestamp if not provided', () => {
      const beforeTime = new Date();
      
      const result = encryptMessage({
        role: 'user',
        content: 'Test message',
      });
      
      const afterTime = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should handle empty content', () => {
      const result = encryptMessage({
        role: 'user',
        content: '',
      });

      expect(mockEncrypt).toHaveBeenCalledWith('');
      expect(result.content).toBe('encrypted-');
    });

    it('should handle special characters in content', () => {
      const content = 'Message with émojis 🎭 and symbols ©®™';
      
      const result = encryptMessage({
        role: 'user',
        content,
      });

      expect(mockEncrypt).toHaveBeenCalledWith(content);
      expect(result.content).toBe(`encrypted-${content}`);
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt message content while preserving other fields', () => {
      const timestamp = new Date();
      const encryptedMessage = {
        role: 'user',
        content: 'encrypted-I feel better now',
        timestamp,
      };

      const result = decryptMessage(encryptedMessage);

      expect(mockDecrypt).toHaveBeenCalledWith('encrypted-I feel better now');
      expect(result.role).toBe('user');
      expect(result.content).toBe('I feel better now');
      expect(result.timestamp).toBe(timestamp);
    });

    it('should handle decryption errors gracefully', () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = decryptMessage({
        role: 'assistant',
        content: 'corrupted-data',
        timestamp: new Date(),
      });

      expect(result.content).toBe('[Message content unavailable]');
      expect(result.role).toBe('assistant');
      expect(console.error).toHaveBeenCalledWith('Failed to decrypt message:', expect.any(Error));
    });

    it('should preserve timestamp during error handling', () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const timestamp = new Date('2024-01-01T10:00:00Z');
      const result = decryptMessage({
        role: 'user',
        content: 'corrupted-data',
        timestamp,
      });

      expect(result.timestamp).toBe(timestamp);
    });

    it('should handle empty encrypted content', () => {
      const result = decryptMessage({
        role: 'user',
        content: 'encrypted-',
        timestamp: new Date(),
      });

      expect(result.content).toBe('');
    });
  });

  describe('encryptMessages', () => {
    it('should encrypt multiple messages', () => {
      const messages = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Second message' },
        { role: 'user', content: 'Third message' },
      ];

      const results = encryptMessages(messages);

      expect(results).toHaveLength(3);
      expect(results[0].content).toBe('encrypted-First message');
      expect(results[1].content).toBe('encrypted-Second message');
      expect(results[2].content).toBe('encrypted-Third message');

      // Verify each has correct role and timestamp
      results.forEach((result, index) => {
        expect(result.role).toBe(messages[index].role);
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should handle empty array', () => {
      const results = encryptMessages([]);

      expect(results).toEqual([]);
      expect(mockEncrypt).not.toHaveBeenCalled();
    });

    it('should preserve individual timestamps when provided', () => {
      const timestamp1 = new Date('2024-01-01T10:00:00Z');
      const timestamp2 = new Date('2024-01-01T11:00:00Z');
      
      const messages = [
        { role: 'user', content: 'Message 1', timestamp: timestamp1 },
        { role: 'assistant', content: 'Message 2', timestamp: timestamp2 },
      ];

      const results = encryptMessages(messages);

      expect(results[0].timestamp).toBe(timestamp1);
      expect(results[1].timestamp).toBe(timestamp2);
    });
  });

  describe('decryptMessages', () => {
    it('should decrypt multiple messages', () => {
      const encryptedMessages = [
        { role: 'user', content: 'encrypted-Message 1', timestamp: new Date() },
        { role: 'assistant', content: 'encrypted-Message 2', timestamp: new Date() },
      ];

      const results = decryptMessages(encryptedMessages);

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Message 1');
      expect(results[1].content).toBe('Message 2');
    });

    it('should handle errors in individual messages', () => {
      mockDecrypt
        .mockReturnValueOnce('Successfully decrypted')
        .mockImplementationOnce(() => { throw new Error('Decryption failed'); });

      const encryptedMessages = [
        { role: 'user', content: 'encrypted-good', timestamp: new Date() },
        { role: 'assistant', content: 'corrupted-data', timestamp: new Date() },
      ];

      const results = decryptMessages(encryptedMessages);

      expect(results[0].content).toBe('Successfully decrypted');
      expect(results[1].content).toBe('[Message content unavailable]');
    });

    it('should handle empty array', () => {
      const results = decryptMessages([]);

      expect(results).toEqual([]);
      expect(mockDecrypt).not.toHaveBeenCalled();
    });
  });

  describe('encryptSessionReportContent and decryptSessionReportContent', () => {
    it('should encrypt session report content', () => {
      const reportContent = 'Patient shows significant improvement in anxiety management.';

      const result = encryptSessionReportContent(reportContent);

      expect(mockEncrypt).toHaveBeenCalledWith(reportContent);
      expect(result).toBe(`encrypted-${reportContent}`);
    });

    it('should decrypt session report content', () => {
      const encryptedContent = 'encrypted-Patient report data';

      const result = decryptSessionReportContent(encryptedContent);

      expect(mockDecrypt).toHaveBeenCalledWith(encryptedContent);
      expect(result).toBe('Patient report data');
    });

    it('should handle session report decryption errors', () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = decryptSessionReportContent('corrupted-data');

      expect(result).toBe('[Report content unavailable]');
      expect(console.error).toHaveBeenCalledWith('Failed to decrypt session report content:', expect.any(Error));
    });

    it('should handle empty session report content', () => {
      const result = encryptSessionReportContent('');

      expect(mockEncrypt).toHaveBeenCalledWith('');
      expect(result).toBe('encrypted-');
    });
  });

  describe('isContentEncrypted', () => {
    it('should identify encrypted content by format', () => {
      // Base64-like content with sufficient length
      const encryptedLookingContent = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwYWJjZGVmZ2hpams=';

      const result = isContentEncrypted(encryptedLookingContent);

      expect(result).toBe(true);
    });

    it('should identify unencrypted content', () => {
      const plainContent = 'This is a normal message with spaces and punctuation.';

      const result = isContentEncrypted(plainContent);

      expect(result).toBe(false);
    });

    it('should reject short content even if base64', () => {
      const shortBase64 = 'SGVsbG8='; // "Hello" in base64

      const result = isContentEncrypted(shortBase64);

      expect(result).toBe(false);
    });

    it('should handle invalid base64 gracefully', () => {
      const invalidBase64 = 'this-is-not-base64-but-looks-similar-with-dashes-and-long-enough-content';

      const result = isContentEncrypted(invalidBase64);

      expect(result).toBe(false);
    });

    it('should handle special characters that break base64', () => {
      const specialChars = 'SGVsbG8gV29ybGQh@@@@invalid';

      const result = isContentEncrypted(specialChars);

      expect(result).toBe(false);
    });

    it('should handle empty content', () => {
      const result = isContentEncrypted('');

      expect(result).toBe(false);
    });
  });

  describe('safeDecryptMessage', () => {
    it('should decrypt encrypted-looking content', () => {
      // Use actual content that looks encrypted (base64-like, long enough)
      const encryptedContent = 'VGhpcyBpcyBhIHRlc3QgbWVzc2FnZSB0aGF0IGxvb2tzIGVuY3J5cHRlZC5BYmNkZWZnaGlqa2xtbm9wcXJzdHU=';
      
      const message = {
        role: 'user',
        content: encryptedContent,
        timestamp: new Date(),
      };

      mockDecrypt.mockReturnValue('Decrypted content');

      const result = safeDecryptMessage(message);

      // Since this looks encrypted, it should try to decrypt
      expect(result.content).toBe('Decrypted content');
      expect(mockDecrypt).toHaveBeenCalledWith(encryptedContent);
    });

    it('should pass through unencrypted content', () => {
      const plainMessage = {
        role: 'user',
        content: 'This is plain text with spaces and punctuation!',
        timestamp: new Date(),
      };

      const result = safeDecryptMessage(plainMessage);

      // Should pass through without decryption attempt
      expect(result).toBe(plainMessage);
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it('should handle mixed encrypted and unencrypted messages in bulk', () => {
      const messages = [
        { role: 'user', content: 'VGhpcyBpcyBlbmNyeXB0ZWQgdGV4dCB0aGF0IGlzIGxvbmcgZW5vdWdoIHRvIGJlIGRldGVjdGVkQWJjZGVmZzEyMzQ=', timestamp: new Date() },
        { role: 'assistant', content: 'This is plain text with spaces!', timestamp: new Date() },
      ];

      mockDecrypt.mockReturnValue('decrypted content');

      const results = safeDecryptMessages(messages);

      expect(results[0].content).toBe('decrypted content');
      expect(results[1].content).toBe('This is plain text with spaces!');
    });
  });

  describe('safeDecryptMessages', () => {
    it('should safely decrypt multiple encrypted-looking messages', () => {
      mockDecrypt.mockReturnValue('Decrypted content');

      const messages = [
        { role: 'user', content: 'VGhpcyBpcyBlbmNyeXB0ZWQgdGV4dCB0aGF0IGlzIGxvbmcgZW5vdWdoIHRvIGJlIGRldGVjdGVkQWJjZGVmZ2hpams=', timestamp: new Date() },
        { role: 'assistant', content: 'QW5vdGhlciBlbmNyeXB0ZWQgbWVzc2FnZSB0aGF0IGxvb2tzIGxpa2UgYmFzZTY0IGVuY29kZWQgY29udGVudEFiY2Q=', timestamp: new Date() },
      ];

      const results = safeDecryptMessages(messages);

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Decrypted content');
      expect(results[1].content).toBe('Decrypted content');
    });

    it('should handle empty array', () => {
      const results = safeDecryptMessages([]);

      expect(results).toEqual([]);
    });
  });

  describe('Enhanced Psychological Analysis Encryption', () => {
    describe('Cognitive Distortions', () => {
      it('should encrypt and decrypt cognitive distortions', () => {
        const distortions = [
          { type: 'catastrophizing', severity: 'high' },
          { type: 'black-and-white-thinking', severity: 'medium' }
        ];

        const encrypted = encryptCognitiveDistortions(distortions);
        const decrypted = decryptCognitiveDistortions(encrypted);

        expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify(distortions));
        expect(decrypted).toEqual(distortions);
      });

      it('should handle decryption errors for cognitive distortions', () => {
        mockDecrypt.mockImplementation(() => {
          throw new Error('Decryption failed');
        });

        const result = decryptCognitiveDistortions('corrupted-data');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Failed to decrypt cognitive distortions data:', expect.any(Error));
      });

      it('should handle malformed JSON in cognitive distortions', () => {
        mockDecrypt.mockReturnValue('invalid-json{');

        const result = decryptCognitiveDistortions('encrypted-data');

        expect(result).toEqual([]);
      });
    });

    describe('Schema Analysis', () => {
      it('should encrypt and decrypt schema analysis', () => {
        const schemaAnalysis = {
          activeModes: ['vulnerable-child'],
          triggeredSchemas: ['abandonment', 'defectiveness'],
          predominantMode: 'vulnerable-child',
          behavioralPatterns: ['avoidance'],
          copingStrategies: { adaptive: ['mindfulness'], maladaptive: ['isolation'] },
          therapeuticRecommendations: ['cognitive-restructuring']
        };

        const encrypted = encryptSchemaAnalysis(schemaAnalysis);
        const decrypted = decryptSchemaAnalysis(encrypted);

        expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify(schemaAnalysis));
        expect(decrypted).toEqual(schemaAnalysis);
      });

      it('should return default schema analysis on decryption error', () => {
        mockDecrypt.mockImplementation(() => {
          throw new Error('Decryption failed');
        });

        const result = decryptSchemaAnalysis('corrupted-data');

        expect(result).toEqual({
          activeModes: [],
          triggeredSchemas: [],
          predominantMode: null,
          behavioralPatterns: [],
          copingStrategies: { adaptive: [], maladaptive: [] },
          therapeuticRecommendations: []
        });
      });
    });

    describe('Therapeutic Frameworks', () => {
      it('should encrypt and decrypt therapeutic frameworks', () => {
        const frameworks = [
          { name: 'CBT', applicability: 'high' },
          { name: 'DBT', applicability: 'medium' }
        ];

        const encrypted = encryptTherapeuticFrameworks(frameworks);
        const decrypted = decryptTherapeuticFrameworks(encrypted);

        expect(decrypted).toEqual(frameworks);
      });

      it('should handle decryption errors for therapeutic frameworks', () => {
        mockDecrypt.mockImplementation(() => {
          throw new Error('Decryption failed');
        });

        const result = decryptTherapeuticFrameworks('corrupted-data');

        expect(result).toEqual([]);
      });
    });

    describe('Therapeutic Recommendations', () => {
      it('should encrypt and decrypt therapeutic recommendations', () => {
        const recommendations = [
          { intervention: 'mindfulness', priority: 'high' },
          { intervention: 'journaling', priority: 'medium' }
        ];

        const encrypted = encryptTherapeuticRecommendations(recommendations);
        const decrypted = decryptTherapeuticRecommendations(encrypted);

        expect(decrypted).toEqual(recommendations);
      });

      it('should handle decryption errors for therapeutic recommendations', () => {
        mockDecrypt.mockImplementation(() => {
          throw new Error('Decryption failed');
        });

        const result = decryptTherapeuticRecommendations('corrupted-data');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Enhanced Analysis Data - Comprehensive Encryption/Decryption', () => {
    it('should encrypt complete enhanced analysis data', () => {
      const analysisData = {
        cognitiveDistortions: [{ type: 'catastrophizing' }],
        schemaAnalysis: { activeModes: ['vulnerable-child'] },
        therapeuticFrameworks: [{ name: 'CBT' }],
        recommendations: [{ intervention: 'mindfulness' }]
      };

      const result = encryptEnhancedAnalysisData(analysisData);

      expect(result.cognitiveDistortions).toContain('encrypted-');
      expect(result.schemaAnalysis).toContain('encrypted-');
      expect(result.therapeuticFrameworks).toContain('encrypted-');
      expect(result.recommendations).toContain('encrypted-');
    });

    it('should handle partial analysis data', () => {
      const partialData = {
        cognitiveDistortions: [{ type: 'all-or-nothing' }],
        // Missing other fields
      };

      const result = encryptEnhancedAnalysisData(partialData);

      expect(result.cognitiveDistortions).toContain('encrypted-');
      expect(result.schemaAnalysis).toBeNull();
      expect(result.therapeuticFrameworks).toBeNull();
      expect(result.recommendations).toBeNull();
    });

    it('should decrypt complete enhanced analysis data', () => {
      const encryptedData = {
        cognitiveDistortions: 'encrypted-[{"type":"catastrophizing"}]',
        schemaAnalysis: 'encrypted-{"activeModes":["vulnerable-child"]}',
        therapeuticFrameworks: 'encrypted-[{"name":"CBT"}]',
        recommendations: 'encrypted-[{"intervention":"mindfulness"}]'
      };

      // Setup mock to parse JSON correctly
      mockDecrypt.mockImplementation((data: string) => {
        return data.replace('encrypted-', '');
      });

      const result = decryptEnhancedAnalysisData(encryptedData);

      expect(result.cognitiveDistortions).toEqual([{type:"catastrophizing"}]);
      expect(result.schemaAnalysis).toEqual({activeModes:["vulnerable-child"]});
      expect(result.therapeuticFrameworks).toEqual([{name:"CBT"}]);
      expect(result.recommendations).toEqual([{intervention:"mindfulness"}]);
    });

    it('should handle null values in encrypted data', () => {
      const encryptedData = {
        cognitiveDistortions: null,
        schemaAnalysis: null,
        therapeuticFrameworks: null,
        recommendations: null
      };

      const result = decryptEnhancedAnalysisData(encryptedData);

      expect(result.cognitiveDistortions).toEqual([]);
      expect(result.schemaAnalysis).toEqual({
        activeModes: [],
        triggeredSchemas: [],
        predominantMode: null,
        behavioralPatterns: [],
        copingStrategies: { adaptive: [], maladaptive: [] },
        therapeuticRecommendations: []
      });
      expect(result.therapeuticFrameworks).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it('should handle undefined values in encrypted data', () => {
      const encryptedData = {
        // All undefined
      };

      const result = decryptEnhancedAnalysisData(encryptedData);

      expect(result.cognitiveDistortions).toEqual([]);
      expect(result.therapeuticFrameworks).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it('should handle mixed success and failure in comprehensive decryption', () => {
      mockDecrypt
        .mockReturnValueOnce('[{"type":"success"}]') // cognitiveDistortions success
        .mockImplementationOnce(() => { throw new Error('Schema decryption failed'); }) // schemaAnalysis fails
        .mockReturnValueOnce('[{"name":"CBT"}]') // therapeuticFrameworks success
        .mockImplementationOnce(() => { throw new Error('Recommendations decryption failed'); }); // recommendations fails

      const encryptedData = {
        cognitiveDistortions: 'encrypted-data1',
        schemaAnalysis: 'corrupted-data',
        therapeuticFrameworks: 'encrypted-data2',
        recommendations: 'corrupted-data2'
      };

      const result = decryptEnhancedAnalysisData(encryptedData);

      expect(result.cognitiveDistortions).toEqual([{type:"success"}]);
      expect(result.schemaAnalysis).toEqual({
        activeModes: [],
        triggeredSchemas: [],
        predominantMode: null,
        behavioralPatterns: [],
        copingStrategies: { adaptive: [], maladaptive: [] },
        therapeuticRecommendations: []
      });
      expect(result.therapeuticFrameworks).toEqual([{name:"CBT"}]);
      expect(result.recommendations).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete message encryption/decryption workflow', () => {
      const originalMessage = {
        role: 'user',
        content: 'I have been feeling overwhelmed with work lately.'
      };

      // Encrypt
      const encrypted = encryptMessage(originalMessage);
      expect(encrypted.content).toContain('encrypted-');

      // Decrypt
      const decrypted = decryptMessage(encrypted);
      expect(decrypted.content).toBe(originalMessage.content);
      expect(decrypted.role).toBe(originalMessage.role);
    });

    it('should handle bulk operations correctly', () => {
      const originalMessages = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' }
      ];

      // Bulk encrypt
      const encrypted = encryptMessages(originalMessages);
      encrypted.forEach(msg => {
        expect(msg.content).toContain('encrypted-');
      });

      // Bulk decrypt
      const decrypted = decryptMessages(encrypted);
      decrypted.forEach((msg, index) => {
        expect(msg.content).toBe(originalMessages[index].content);
        expect(msg.role).toBe(originalMessages[index].role);
      });
    });

    it('should handle complete session report workflow', () => {
      const reportContent = 'Patient shows significant improvement in managing anxiety through CBT techniques.';

      const encrypted = encryptSessionReportContent(reportContent);
      const decrypted = decryptSessionReportContent(encrypted);

      expect(decrypted).toBe(reportContent);
    });

    it('should handle complete enhanced analysis workflow', () => {
      const analysisData = {
        cognitiveDistortions: [{ type: 'catastrophizing', severity: 'high' }],
        schemaAnalysis: { activeModes: ['vulnerable-child'], triggeredSchemas: ['abandonment'] },
        therapeuticFrameworks: [{ name: 'CBT', applicability: 'high' }],
        recommendations: [{ intervention: 'cognitive-restructuring', priority: 'high' }]
      };

      const encrypted = encryptEnhancedAnalysisData(analysisData);
      
      // Setup proper JSON parsing for decryption
      mockDecrypt.mockImplementation((data: string) => data.replace('encrypted-', ''));
      
      const decrypted = decryptEnhancedAnalysisData(encrypted);

      expect(decrypted.cognitiveDistortions).toEqual(analysisData.cognitiveDistortions);
      expect(decrypted.schemaAnalysis).toEqual(analysisData.schemaAnalysis);
      expect(decrypted.therapeuticFrameworks).toEqual(analysisData.therapeuticFrameworks);
      expect(decrypted.recommendations).toEqual(analysisData.recommendations);
    });
  });
});