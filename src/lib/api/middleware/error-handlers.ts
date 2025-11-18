import { createServerErrorResponse, createValidationErrorResponse } from '@/lib/api/api-response';
import type { RequestContext } from '@/lib/api/api-middleware';
import { logger } from '@/lib/utils/logger';

export const errorHandlers = {
  handleDatabaseError: (error: Error, operation: string, context: RequestContext) => {
    logger.databaseError(operation, error, context);

    if (error.message.includes('UNIQUE constraint')) {
      return createValidationErrorResponse(
        'Resource already exists with this identifier',
        context.requestId
      );
    }

    if (error.message.includes('FOREIGN KEY constraint')) {
      return createValidationErrorResponse('Referenced resource does not exist', context.requestId);
    }

    return createServerErrorResponse(error, context.requestId, context);
  },
};
