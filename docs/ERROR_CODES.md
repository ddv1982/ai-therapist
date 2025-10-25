# Error Codes Reference

This document provides a comprehensive reference for all error codes used in the AI Therapist application.

## Overview

All API errors follow a standardized format with:
- **code**: Machine-readable error code (e.g., `VALIDATION_ERROR`)
- **message**: User-friendly error message
- **statusCode**: HTTP status code
- **details**: Technical details for debugging
- **suggestedAction**: User-friendly recovery guidance
- **requestId**: Unique request identifier for tracing

## Error Categories

### 4xx Client Errors (Bad Request, Invalid Input)

#### Validation Errors (400)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `VALIDATION_ERROR` | Request data failed validation | Please check your message format and try again |
| `INVALID_INPUT` | Input data doesn't meet requirements | Verify your input meets the format requirements |
| `MISSING_REQUIRED_FIELD` | Required field is missing | Check that all required fields are provided |
| `INVALID_REQUEST_FORMAT` | Request format is invalid | Check the request format and structure |

**Example**: User sends a message with invalid format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message validation failed",
    "statusCode": 400,
    "suggestedAction": "Please check your message format and try again",
    "requestId": "req-12345"
  }
}
```

#### Authentication Errors (401)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `AUTHENTICATION_ERROR` | Authentication required or failed | Please log in again |
| `UNAUTHORIZED` | Not authenticated | Authentication required |
| `TOKEN_EXPIRED` | Authentication token has expired | Please refresh your session |
| `INVALID_CREDENTIALS` | Login credentials are invalid | Check your username and password |
| `SESSION_EXPIRED` | Session has expired | Please log in again |

**Example**: Token expired
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Authentication token has expired",
    "statusCode": 401,
    "suggestedAction": "Please refresh your session",
    "requestId": "req-12346"
  }
}
```

#### Authorization Errors (403)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `FORBIDDEN` | Access denied | You don't have permission to access this resource |
| `ACCESS_DENIED` | Access to this resource is denied | Contact support if you need access |
| `INSUFFICIENT_PERMISSIONS` | You don't have the required permissions | Your account needs additional permissions |

**Example**: User tries to access another user's session
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Access to this resource is denied",
    "statusCode": 403,
    "suggestedAction": "Contact support if you need access",
    "requestId": "req-12347"
  }
}
```

#### Not Found Errors (404)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `NOT_FOUND` | Resource not found | The requested resource doesn't exist |
| `RESOURCE_NOT_FOUND` | Resource not found | The resource doesn't exist or was deleted |
| `SESSION_NOT_FOUND` | Session not found | The session may have been deleted |
| `MESSAGE_NOT_FOUND` | Message not found | The message doesn't exist |
| `REPORT_NOT_FOUND` | Report not found | The report may not have been generated yet |
| `USER_NOT_FOUND` | User not found | The user account doesn't exist |

**Example**: Requesting a session that doesn't exist
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found",
    "statusCode": 404,
    "suggestedAction": "The session may have been deleted",
    "requestId": "req-12348"
  }
}
```

#### Rate Limiting Errors (429)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Please wait before making another request |
| `TOO_MANY_REQUESTS` | Rate limit exceeded | Try again in a few moments |

**Example**: User has sent too many requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "statusCode": 429,
    "suggestedAction": "Please wait before making another request",
    "requestId": "req-12349"
  }
}
```

---

### 5xx Server Errors (Internal Server Error)

#### Database Errors (500)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `DATABASE_ERROR` | Database operation failed | Please try again later |
| `DATABASE_QUERY_FAILED` | Database query failed | Please try again or contact support |
| `DATABASE_WRITE_FAILED` | Failed to save data to database | Please try again later |

**Example**: Database query fails
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_QUERY_FAILED",
    "message": "Database operation failed",
    "statusCode": 500,
    "suggestedAction": "Please try again later or contact support",
    "requestId": "req-12350"
  }
}
```

#### AI Service Errors (503)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `AI_SERVICE_ERROR` | AI service error occurred | Please try again or contact support |
| `AI_SERVICE_UNAVAILABLE` | AI service temporarily unavailable | Please try again in a few moments |

**Example**: Groq API is temporarily unavailable
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service temporarily unavailable",
    "statusCode": 503,
    "suggestedAction": "Please try again in a few moments",
    "requestId": "req-12351"
  }
}
```

#### Encryption Errors (500)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `ENCRYPTION_ERROR` | Data encryption failed | Please try again or contact support |
| `DECRYPTION_ERROR` | Data decryption failed | Please try again or contact support |

**Example**: Cannot decrypt stored message
```json
{
  "success": false,
  "error": {
    "code": "DECRYPTION_ERROR",
    "message": "Data decryption failed",
    "statusCode": 500,
    "suggestedAction": "Please try again or contact support",
    "requestId": "req-12352"
  }
}
```

#### Feature-Specific Errors (500)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `REPORT_GENERATION_FAILED` | Failed to generate report | Try generating the report again |
| `ANALYSIS_PROCESSING_FAILED` | Therapeutic analysis processing failed | Please try again or contact support |
| `CHAT_PROCESSING_FAILED` | Failed to generate response | Please try again or contact support |
| `MESSAGE_PROCESSING_FAILED` | Failed to process message | Please try again or contact support |
| `SESSION_CREATION_FAILED` | Failed to create new session | Please try again or contact support |
| `SESSION_DELETION_FAILED` | Failed to delete session | Please try again or contact support |
| `MEMORY_RETRIEVAL_FAILED` | Failed to retrieve therapeutic memory | Please try again or contact support |
| `MEMORY_DELETION_FAILED` | Failed to delete memory | Please try again or contact support |

**Example**: Report generation fails
```json
{
  "success": false,
  "error": {
    "code": "REPORT_GENERATION_FAILED",
    "message": "Failed to generate report",
    "statusCode": 500,
    "suggestedAction": "Try generating the report again",
    "requestId": "req-12353"
  }
}
```

#### Therapeutic Errors (500)

| Code | Message | Suggested Action |
|------|---------|------------------|
| `INVALID_THERAPEUTIC_CONTEXT` | Invalid therapeutic context | Please provide a valid context |
| `CBT_DATA_PARSING_FAILED` | Failed to parse CBT data | Check your CBT data format |
| `THERAPEUTIC_ANALYSIS_FAILED` | Therapeutic analysis processing failed | Please try again or contact support |

**Example**: CBT data format is invalid
```json
{
  "success": false,
  "error": {
    "code": "CBT_DATA_PARSING_FAILED",
    "message": "Failed to parse CBT data",
    "statusCode": 500,
    "suggestedAction": "Check your CBT data format",
    "requestId": "req-12354"
  }
}
```

---

## Using Error Codes in Your Code

### In API Routes

```typescript
import { ChatError, MessageValidationError } from '@/lib/errors/chat-errors';
import { createErrorResponse } from '@/lib/api/api-response';

export const POST = async (req: NextRequest, context) => {
  try {
    // Validation
    if (!message) {
      throw new MessageValidationError('Message is required', {
        endpoint: '/api/chat',
        requestId: context.requestId
      });
    }

    // Process message...
  } catch (error) {
    if (error instanceof ChatError) {
      return createErrorResponse(error.userMessage, error.statusCode, {
        code: error.code,
        details: error.message,
        suggestedAction: error.suggestedAction,
        requestId: context.requestId
      });
    }

    // Fallback for unexpected errors
    return createErrorResponse(
      'An unexpected error occurred',
      500,
      { requestId: context.requestId }
    );
  }
};
```

### In Client Code

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: userInput })
});

const data = await response.json();

if (!data.success) {
  const { code, message, suggestedAction } = data.error;

  // Show user-friendly message
  showToast({
    type: 'error',
    title: message,
    message: suggestedAction
  });

  // Log for debugging
  logger.error('Chat API error', { code, requestId: data.error.requestId });
}
```

---

## Error Handling Best Practices

### 1. Always Include Context
Provide relevant context when throwing errors to help with debugging:
```typescript
throw new ChatError({
  code: ApiErrorCode.MESSAGE_PROCESSING_FAILED,
  userMessage: 'Failed to process your message',
  details: `Validation failed: ${validationError.message}`,
  context: { messageLength, messagePreview: message.substring(0, 100) }
});
```

### 2. Use Specific Error Types
Choose the most specific error type for the situation:
```typescript
// ✅ Good - specific error type
throw new MessageValidationError('Message is empty');

// ❌ Bad - generic error
throw new Error('Message validation failed');
```

### 3. Never Expose Sensitive Information
Ensure error messages don't leak sensitive data:
```typescript
// ✅ Good - user-friendly message
throw new ChatError({
  userMessage: 'Database operation failed'
});

// ❌ Bad - exposes database connection details
throw new ChatError({
  userMessage: 'Database connection to postgres://user:pass@localhost failed'
});
```

### 4. Provide Helpful Suggested Actions
Guide users toward resolution:
```typescript
// ✅ Good - helpful guidance
suggestedAction: 'Check your message format and try again'

// ❌ Bad - no guidance
suggestedAction: 'Error occurred'
```

### 5. Log with Full Context
Include all relevant information for debugging:
```typescript
logger.error('Message processing failed', {
  apiEndpoint: '/api/chat',
  requestId: context.requestId,
  errorCode: error.code,
  errorMessage: error.message,
  context: error.context
});
```

---

## Monitoring Error Rates

Track these error codes to identify issues:

| Code | Monitored Metric | Alert Threshold |
|------|------------------|-----------------|
| `AI_SERVICE_UNAVAILABLE` | Service availability | > 5% of requests |
| `DATABASE_ERROR` | Database health | > 1% of requests |
| `RATE_LIMIT_EXCEEDED` | API usage patterns | > 10% of requests |
| `MESSAGE_PROCESSING_FAILED` | Chat functionality | > 2% of requests |

---

## Related Files

- **Error Definitions**: `/src/lib/errors/chat-errors.ts`
- **Error Code Registry**: `/src/lib/api/error-codes.ts`
- **API Response Format**: `/src/lib/api/api-response.ts`
- **Error Handling Middleware**: `/src/lib/api/api-middleware.ts`

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
