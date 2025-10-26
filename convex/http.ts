import { httpRouter } from 'convex/server';
import { httpAction } from 'convex/server';
import { api } from './_generated/api';
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
      const headers = Object.fromEntries(request.headers);

      // Verify the signature
      const verified = svix.verify(JSON.stringify(payload), headers);

      // Handle different Clerk user events
      const { type, data } = verified as Record<string, unknown>;

      if (type === 'user.created') {
        // Create user in Convex when Clerk user is created
        await ctx.runMutation(api.users.internal.createFromClerk, {
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address || '',
          name: data.first_name || data.last_name
            ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
            : undefined,
        });
      } else if (type === 'user.updated') {
        // Update user in Convex when Clerk user is updated
        await ctx.runMutation(api.users.internal.updateFromClerk, {
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address || '',
          name: data.first_name || data.last_name
            ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
            : undefined,
        });
      } else if (type === 'user.deleted') {
        // Soft delete user in Convex when Clerk user is deleted
        // We keep therapeutic data but mark user as deleted
        await ctx.runMutation(api.users.internal.deleteFromClerk, {
          clerkId: data.id,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return new Response('Webhook verification failed', { status: 401 });
    }
  }),
});

export default http;
