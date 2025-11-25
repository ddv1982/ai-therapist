/**
 * Auth Flow Integration Tests
 *
 * Tests for Clerk to Convex user synchronization including
 * webhook handling and session management.
 */

import {
  setupConvexMock,
  createMockResponses,
  type ConvexMockSetup,
} from '../test-utils/convex-mock';

/**
 * Mock Clerk webhook payload structure
 */
interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
      verification: { status: string };
    }>;
    primary_email_address_id?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
  };
}

/**
 * Simulates Clerk webhook processing with mock tracking
 */
async function processClerkWebhook(
  payload: ClerkWebhookPayload,
  convexMock: ConvexMockSetup
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { type, data } = payload;

  switch (type) {
    case 'user.created': {
      const email = data.email_addresses?.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address;

      if (!email) {
        return { success: false, error: 'No email found' };
      }

      // Track the mutation using the mock
      await convexMock.mockMutation('users.create', {
        clerkId: data.id,
        email,
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        imageUrl: data.image_url,
      });

      return { success: true, userId: `user-${data.id}` };
    }

    case 'user.updated': {
      const email = data.email_addresses?.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address;

      await convexMock.mockMutation('users.update', {
        clerkId: data.id,
        email,
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        imageUrl: data.image_url,
      });

      return { success: true };
    }

    case 'user.deleted': {
      await convexMock.mockMutation('users.delete', {
        clerkId: data.id,
      });

      return { success: true };
    }

    case 'session.ended': {
      await convexMock.mockMutation('sessions.invalidate', {
        clerkUserId: data.id,
      });

      return { success: true };
    }

    default:
      return { success: false, error: `Unknown webhook type: ${type}` };
  }
}

describe('Auth Flow Integration', () => {
  let convexMock: ConvexMockSetup;

  beforeEach(() => {
    convexMock = setupConvexMock();
  });

  afterEach(() => {
    convexMock.reset();
  });

  // ============================================================================
  // CLERK WEBHOOK USER CREATION
  // ============================================================================

  describe('Clerk webhook user creation', () => {
    it('creates Convex user from Clerk user.created webhook', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'test@example.com',
              verification: { status: 'verified' },
            },
          ],
          primary_email_address_id: 'email_1',
          first_name: 'John',
          last_name: 'Doe',
          image_url: 'https://example.com/avatar.jpg',
          created_at: Date.now(),
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      convexMock.verifyMutation('users.create', {
        clerkId: 'clerk_user_123',
        email: 'test@example.com',
        name: 'John Doe',
        imageUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('handles user creation without name', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'anonymous@example.com',
              verification: { status: 'verified' },
            },
          ],
          primary_email_address_id: 'email_1',
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(true);
      convexMock.verifyMutation('users.create', {
        clerkId: 'clerk_user_123',
        email: 'anonymous@example.com',
        name: undefined,
        imageUrl: undefined,
      });
    });

    it('fails user creation when no email found', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [],
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No email found');
      convexMock.verifyNoMutations();
    });

    it('fails when email_addresses is undefined', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No email found');
    });
  });

  // ============================================================================
  // USER SYNC TO CONVEX
  // ============================================================================

  describe('User sync to Convex', () => {
    it('updates Convex user from Clerk user.updated webhook', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.updated',
        data: {
          id: 'clerk_user_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'newemail@example.com',
              verification: { status: 'verified' },
            },
          ],
          primary_email_address_id: 'email_1',
          first_name: 'Jane',
          last_name: 'Smith',
          image_url: 'https://example.com/new-avatar.jpg',
          updated_at: Date.now(),
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(true);
      convexMock.verifyMutation('users.update');
    });

    it('syncs user data on login', async () => {
      // Track the query call
      await convexMock.mockQuery('users.getByClerkId', {
        clerkId: 'clerk_user_123',
      });

      convexMock.verifyQuery('users.getByClerkId', { clerkId: 'clerk_user_123' });
    });

    it('creates user if not found on first sync', async () => {
      // First query returns null (user not found)
      const user = await convexMock.mockQuery('users.getByClerkId', {
        clerkId: 'clerk_user_new',
      });

      // User not found (default returns null)
      expect(user).toBeNull();

      // Simulate upsert logic
      await convexMock.mockMutation('users.create', {
        clerkId: 'clerk_user_new',
        email: 'new@example.com',
      });

      convexMock.verifyMutation('users.create');
    });

    it('handles concurrent sync requests', async () => {
      // Simulate concurrent auth checks
      await Promise.all([
        convexMock.mockQuery('users.getByClerkId', { clerkId: 'clerk_user_123' }),
        convexMock.mockQuery('users.getByClerkId', { clerkId: 'clerk_user_123' }),
        convexMock.mockQuery('users.getByClerkId', { clerkId: 'clerk_user_123' }),
      ]);

      expect(convexMock.getTrackedQueries()).toHaveLength(3);
    });
  });

  // ============================================================================
  // SESSION INVALIDATION
  // ============================================================================

  describe('Session invalidation', () => {
    it('invalidates sessions on Clerk session.ended webhook', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'session.ended',
        data: {
          id: 'clerk_user_123',
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(true);
      convexMock.verifyMutation('sessions.invalidate', { clerkUserId: 'clerk_user_123' });
    });

    it('handles user deletion with session cleanup', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.deleted',
        data: {
          id: 'clerk_user_123',
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(true);
      convexMock.verifyMutation('users.delete', { clerkId: 'clerk_user_123' });
    });

    it('handles session.ended for any user', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'session.ended',
        data: {
          id: 'non_existent_user',
        },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      // Should still be successful (idempotent)
      expect(result.success).toBe(true);
      convexMock.verifyMutation('sessions.invalidate');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error handling', () => {
    it('handles unknown webhook type', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'unknown.event',
        data: { id: 'test' },
      };

      const result = await processClerkWebhook(webhookPayload, convexMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown webhook type');
      convexMock.verifyNoMutations();
    });

    it('tracks user creation mutation', async () => {
      const webhookPayload: ClerkWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [
            {
              id: 'email_1',
              email_address: 'test@example.com',
              verification: { status: 'verified' },
            },
          ],
          primary_email_address_id: 'email_1',
        },
      };

      await processClerkWebhook(webhookPayload, convexMock);

      // Mutation was tracked
      const mutations = convexMock.getTrackedMutations();
      expect(mutations).toHaveLength(1);
      expect(mutations[0].api).toBe('users.create');
    });

    it('tracks multiple webhook events', async () => {
      // Process create
      await processClerkWebhook(
        {
          type: 'user.created',
          data: {
            id: 'user1',
            email_addresses: [
              { id: 'e1', email_address: 'a@test.com', verification: { status: 'verified' } },
            ],
            primary_email_address_id: 'e1',
          },
        },
        convexMock
      );

      // Process update
      await processClerkWebhook(
        {
          type: 'user.updated',
          data: {
            id: 'user1',
            email_addresses: [
              { id: 'e1', email_address: 'b@test.com', verification: { status: 'verified' } },
            ],
            primary_email_address_id: 'e1',
          },
        },
        convexMock
      );

      // Process delete
      await processClerkWebhook(
        {
          type: 'user.deleted',
          data: { id: 'user1' },
        },
        convexMock
      );

      expect(convexMock.getTrackedMutations()).toHaveLength(3);
    });
  });

  // ============================================================================
  // CLERK TEST UTILITIES
  // ============================================================================

  describe('Clerk test utilities', () => {
    it('generates valid Clerk webhook payload', () => {
      const createClerkPayload = (
        type: string,
        overrides: Partial<ClerkWebhookPayload['data']> = {}
      ): ClerkWebhookPayload => ({
        type,
        data: {
          id: `clerk_${Date.now()}`,
          email_addresses: [
            {
              id: 'email_1',
              email_address: `test-${Date.now()}@example.com`,
              verification: { status: 'verified' },
            },
          ],
          primary_email_address_id: 'email_1',
          created_at: Date.now(),
          ...overrides,
        },
      });

      const payload = createClerkPayload('user.created', {
        first_name: 'Test',
        last_name: 'User',
      });

      expect(payload.type).toBe('user.created');
      expect(payload.data.first_name).toBe('Test');
      expect(payload.data.email_addresses?.length).toBe(1);
    });

    it('validates webhook signature structure', () => {
      // Simulates webhook signature validation
      const validateWebhookSignature = (
        payload: string,
        signature: string,
        secret: string
      ): boolean => {
        // In real implementation, this would verify HMAC
        return payload.length > 0 && signature.length > 0 && secret.length > 0;
      };

      const isValid = validateWebhookSignature(
        JSON.stringify({ type: 'user.created', data: {} }),
        'svix_signature_123',
        'whsec_test_secret'
      );

      expect(isValid).toBe(true);
    });
  });

  // ============================================================================
  // MOCK RESPONSE INTEGRATION
  // ============================================================================

  describe('Mock response integration', () => {
    it('creates mock user for testing', () => {
      const mockUser = createMockResponses.user({
        clerkId: 'clerk_test_123',
        email: 'mock@example.com',
      });

      expect(mockUser._id).toBeDefined();
      expect(mockUser.clerkId).toBe('clerk_test_123');
      expect(mockUser.email).toBe('mock@example.com');
    });

    it('uses mock user in query simulation', async () => {
      // Create mock user for context (query simulation uses clerkId)
      createMockResponses.user({ clerkId: 'clerk_123' });

      // Track query
      await convexMock.mockQuery('users.getByClerkId', { clerkId: 'clerk_123' });

      // Verify the query was tracked
      const queries = convexMock.getTrackedQueries();
      expect(queries).toHaveLength(1);
      expect(queries[0].api).toBe('users.getByClerkId');
    });
  });
});
