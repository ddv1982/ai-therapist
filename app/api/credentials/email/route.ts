import { NextRequest, NextResponse } from 'next/server';
import { 
  storeEmailCredentials, 
  getEmailCredentials, 
  hasStoredEmailCredentials,
  deleteEmailCredentials 
} from '@/lib/secure-credentials';
import { validateEncryption } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    // Validate encryption is working
    if (!validateEncryption()) {
      return NextResponse.json(
        { error: 'Encryption system not properly configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, credentials } = body;

    switch (action) {
      case 'store':
        if (!credentials || !credentials.smtpPass) {
          return NextResponse.json(
            { error: 'Email credentials required' },
            { status: 400 }
          );
        }
        
        await storeEmailCredentials(request, credentials);
        return NextResponse.json({ success: true, message: 'Credentials stored securely' });

      case 'get':
        const storedCredentials = await getEmailCredentials(request);
        if (!storedCredentials) {
          return NextResponse.json(
            { error: 'No stored credentials found' },
            { status: 404 }
          );
        }
        
        // Return credentials without the password for security
        return NextResponse.json({
          hasCredentials: true,
          service: storedCredentials.service,
          smtpHost: storedCredentials.smtpHost,
          smtpUser: storedCredentials.smtpUser,
          fromEmail: storedCredentials.fromEmail,
          // Don't return the actual password for security
          smtpPass: '••••••••••••••••'
        });

      case 'check':
        const hasCredentials = await hasStoredEmailCredentials(request);
        return NextResponse.json({ hasCredentials });

      case 'delete':
        const deleted = await deleteEmailCredentials(request);
        return NextResponse.json({ 
          success: deleted, 
          message: deleted ? 'Credentials deleted' : 'Failed to delete credentials' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: store, get, check, or delete' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Credential management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage credentials' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user has stored credentials
    const hasCredentials = await hasStoredEmailCredentials(request);
    
    if (!hasCredentials) {
      return NextResponse.json({ hasCredentials: false });
    }

    // Get credentials info (without exposing password)
    const credentials = await getEmailCredentials(request);
    if (!credentials) {
      return NextResponse.json({ hasCredentials: false });
    }

    return NextResponse.json({
      hasCredentials: true,
      service: credentials.service,
      smtpHost: credentials.smtpHost,
      smtpUser: credentials.smtpUser,
      fromEmail: credentials.fromEmail
    });
  } catch (error) {
    console.error('Failed to check credentials:', error);
    return NextResponse.json(
      { error: 'Failed to check stored credentials' },
      { status: 500 }
    );
  }
}