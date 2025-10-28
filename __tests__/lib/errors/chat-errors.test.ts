import {
  AIServiceError,
  ChatCompletionError,
  ChatError,
  TherapeuticAnalysisError,
  DatabaseOperationError,
  EncryptionError,
  MemoryManagementError,
  MessageProcessingError,
  MessageValidationError,
  SessionError,
  getChatErrorResponse,
  isChatError,
} from '@/lib/errors/chat-errors';
import { ApiErrorCode } from '@/lib/api/error-codes';

describe('errors/chat-errors', () => {
  it('constructs ChatError derivatives with expected fields', () => {
    const e1 = new MessageValidationError('bad message', { endpoint: '/api/chat' });
    const e2 = new MessageProcessingError('processing failed', new Error('x'));
    const e3 = new SessionError('delete', new Error('db'));
    const e4 = new AIServiceError('down', true);
    const e5 = new ChatCompletionError('fail');
    const e6 = new TherapeuticAnalysisError('oops');
    const e7 = new EncryptionError('encrypt');
    const e8 = new DatabaseOperationError('query');
    const e9 = new MemoryManagementError('retrieve');
    const e10 = new AIServiceError('error', false);
    const e11 = new EncryptionError('decrypt');
    const e12 = new MemoryManagementError('delete');
    const e13 = new SessionError('update');
    const e14 = new SessionError('fetch');
    const all: ChatError[] = [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14];
    all.forEach(e => {
      expect(isChatError(e)).toBe(true);
      expect(e.toJSON().statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  it('getChatErrorResponse maps ChatError and non-ChatError', () => {
    const e = new SessionError('create');
    const r1 = getChatErrorResponse(e);
    expect(r1.code).toBeDefined();
    const r2 = getChatErrorResponse(new Error('oops'));
    expect(r2.code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
  });
});
