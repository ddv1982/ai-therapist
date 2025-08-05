import { validateRequest, chatRequestSchema, messageSchema, emailReportSchema } from '@/lib/validation'

describe('Validation Functions', () => {
  describe('validateRequest', () => {
    it('should return success for valid data', () => {
      const validData = { message: 'Hello world' }
      const schema = messageSchema.pick({ content: true }).extend({ message: messageSchema.shape.content })
      
      const result = validateRequest(schema, validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe('Hello world')
      }
    })

    it('should return error for invalid data', () => {
      const invalidData = { message: '' }
      const schema = messageSchema.pick({ content: true }).extend({ message: messageSchema.shape.content })
      
      const result = validateRequest(schema, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('cannot be empty')
      }
    })
  })

  describe('chatRequestSchema', () => {
    it('should validate valid chat request', () => {
      const validRequest = {
        model: 'openai/gpt-oss-120b',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9
      }

      const result = validateRequest(chatRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid temperature', () => {
      const invalidRequest = {
        temperature: 3.0 // Too high
      }

      const result = validateRequest(chatRequestSchema, invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Temperature must be between 0 and 2')
      }
    })

    it('should reject invalid maxTokens', () => {
      const invalidRequest = {
        maxTokens: 200000 // Too high
      }

      const result = validateRequest(chatRequestSchema, invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Max tokens cannot exceed')
      }
    })
  })

  describe('messageSchema', () => {
    it('should validate user message', () => {
      const validMessage = {
        role: 'user' as const,
        content: 'How can I manage my anxiety?',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateRequest(messageSchema, validMessage)
      expect(result.success).toBe(true)
    })

    it('should validate assistant message', () => {
      const validMessage = {
        role: 'assistant' as const,
        content: 'I understand you\'re looking for ways to manage anxiety.',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateRequest(messageSchema, validMessage)
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidMessage = {
        role: 'system',
        content: 'Test message',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateRequest(messageSchema, invalidMessage)
      expect(result.success).toBe(false)
    })

    it('should reject empty content', () => {
      const invalidMessage = {
        role: 'user' as const,
        content: '',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateRequest(messageSchema, invalidMessage)
      expect(result.success).toBe(false)
    })

    it('should reject invalid session ID', () => {
      const invalidMessage = {
        role: 'user' as const,
        content: 'Test message',
        sessionId: 'not-a-uuid'
      }

      const result = validateRequest(messageSchema, invalidMessage)
      expect(result.success).toBe(false)
    })
  })

  describe('emailReportSchema', () => {
    const validMessage = {
      role: 'user' as const,
      content: 'Test message',
      sessionId: '123e4567-e89b-12d3-a456-426614174000'
    }

    it('should validate console email report', () => {
      const validReport = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messages: [validMessage],
        emailAddress: 'test@example.com',
        emailConfig: {
          service: 'console' as const
        }
      }

      const result = validateRequest(emailReportSchema, validReport)
      expect(result.success).toBe(true)
    })

    it('should validate SMTP email report', () => {
      const validReport = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messages: [validMessage],
        emailAddress: 'test@example.com',
        emailConfig: {
          service: 'smtp' as const,
          smtpHost: 'smtp.gmail.com',
          smtpUser: 'user@gmail.com',
          smtpPass: 'password',
          fromEmail: 'from@example.com'
        }
      }

      const result = validateRequest(emailReportSchema, validReport)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email address', () => {
      const invalidReport = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messages: [validMessage],
        emailAddress: 'not-an-email'
      }

      const result = validateRequest(emailReportSchema, invalidReport)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid email address format')
      }
    })

    it('should reject SMTP config without required fields', () => {
      const invalidReport = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messages: [validMessage],
        emailAddress: 'test@example.com',
        emailConfig: {
          service: 'smtp' as const,
          smtpHost: 'smtp.gmail.com'
          // Missing required SMTP fields
        }
      }

      const result = validateRequest(emailReportSchema, invalidReport)
      expect(result.success).toBe(false)
    })
  })
})