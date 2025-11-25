/**
 * Tests for Chat Services Index
 *
 * Validates that all exports are correctly re-exported from the barrel
 */

import * as chatServices from '@/lib/services/chat';

describe('Chat Services Index', () => {
  describe('Service exports', () => {
    it('exports MessagePersistenceService', () => {
      expect(chatServices.MessagePersistenceService).toBeDefined();
      expect(typeof chatServices.MessagePersistenceService).toBe('function');
    });

    it('exports createMessagePersistenceService factory', () => {
      expect(chatServices.createMessagePersistenceService).toBeDefined();
      expect(typeof chatServices.createMessagePersistenceService).toBe('function');
    });

    it('exports MetadataManager', () => {
      expect(chatServices.MetadataManager).toBeDefined();
      expect(typeof chatServices.MetadataManager).toBe('function');
    });

    it('exports createMetadataManager factory', () => {
      expect(chatServices.createMetadataManager).toBeDefined();
      expect(typeof chatServices.createMetadataManager).toBe('function');
    });
  });

  describe('API Client Adapter export', () => {
    it('exports chatApiClientAdapter', () => {
      expect(chatServices.chatApiClientAdapter).toBeDefined();
      expect(typeof chatServices.chatApiClientAdapter).toBe('object');
    });

    it('chatApiClientAdapter has required methods', () => {
      expect(chatServices.chatApiClientAdapter.listMessages).toBeDefined();
      expect(chatServices.chatApiClientAdapter.postMessage).toBeDefined();
      expect(chatServices.chatApiClientAdapter.patchMessageMetadata).toBeDefined();
    });
  });

  describe('Type utilities exports', () => {
    it('exports ok function', () => {
      expect(chatServices.ok).toBeDefined();
      expect(typeof chatServices.ok).toBe('function');
    });

    it('exports err function', () => {
      expect(chatServices.err).toBeDefined();
      expect(typeof chatServices.err).toBe('function');
    });

    it('ok function creates success result', () => {
      const result = chatServices.ok('test data');
      expect(result).toEqual({ success: true, data: 'test data' });
    });

    it('err function creates error result', () => {
      const error = new Error('test error');
      const result = chatServices.err(error);
      expect(result).toEqual({ success: false, error });
    });
  });

  describe('Export completeness', () => {
    const expectedExports = [
      // Services
      'MessagePersistenceService',
      'createMessagePersistenceService',
      'MetadataManager',
      'createMetadataManager',
      // Adapter
      'chatApiClientAdapter',
      // Type utilities
      'ok',
      'err',
    ];

    it.each(expectedExports)('exports %s', (exportName) => {
      expect((chatServices as Record<string, unknown>)[exportName]).toBeDefined();
    });

    it('has at least the expected number of exports', () => {
      const exportKeys = Object.keys(chatServices);
      expect(exportKeys.length).toBeGreaterThanOrEqual(expectedExports.length);
    });
  });
});
