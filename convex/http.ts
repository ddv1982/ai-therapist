import { httpRouter, anyApi } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';

const http = httpRouter();

// Clerk webhook handler for user synchronization
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Verify the webhook signature using Svix
    try {
      const svix = new Webhook(webhookSecret);
      const payload = await request.json();
      const svixHeaders = {
        'svix-id': request.headers.get('svix-id') || '',
        'svix-timestamp': request.headers.get('svix-timestamp') || '',
        'svix-signature': request.headers.get('svix-signature') || '',
      } as const;
      if (
        !svixHeaders['svix-id'] ||
        !svixHeaders['svix-timestamp'] ||
        !svixHeaders['svix-signature']
      ) {
        return new Response('Missing Svix headers', { status: 400 });
      }

      // Verify the signature
      const verified = svix.verify(
        JSON.stringify(payload),
        svixHeaders as unknown as Record<string, string>
      );

      // Handle different Clerk user events
      type EmailAddress = { email_address?: string };
      type ClerkWebhook = {
        type?: string;
        data?: {
          id?: string;
          email_addresses?: EmailAddress[];
          first_name?: string;
          last_name?: string;
        };
      };
      const verifiedObj = verified as ClerkWebhook;
      const type = verifiedObj?.type as string | undefined;
      const data = verifiedObj?.data;

      if (!data?.id) {
        return new Response('Invalid Clerk webhook payload', { status: 400 });
      }

      if (type === 'user.created') {
        // Create user in Convex when Clerk user is created
        await ctx.runMutation(anyApi.users.internal.createFromClerk, {
          clerkId: data?.id ?? '',
          email: data?.email_addresses?.[0]?.email_address || '',
          name:
            data?.first_name || data?.last_name
              ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
              : undefined,
        });
      } else if (type === 'user.updated') {
        // Update user in Convex when Clerk user is updated
        await ctx.runMutation(anyApi.users.internal.updateFromClerk, {
          clerkId: data?.id ?? '',
          email: data?.email_addresses?.[0]?.email_address || '',
          name:
            data?.first_name || data?.last_name
              ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
              : undefined,
        });
      } else if (type === 'user.deleted') {
        // Soft delete user in Convex when Clerk user is deleted
        // We keep therapeutic data but mark user as deleted
        await ctx.runMutation(anyApi.users.internal.deleteFromClerk, {
          clerkId: data?.id ?? '',
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Log webhook failures with structured logging for debugging and compliance
      const errorDetails = {
        operation: 'clerk-webhook',
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        headers: {
          'svix-id': request.headers.get('svix-id') || 'missing',
          'svix-timestamp': request.headers.get('svix-timestamp') || 'missing',
        },
      };
      
      // In Convex context, use console but with structured format
      // TODO: Once Convex logger utility is available, replace with: logger.error(...)
      console.error('[WEBHOOK_ERROR]', JSON.stringify(errorDetails));
      
      return new Response('Webhook verification failed', { status: 401 });
    }
  }),
});

export default http;
