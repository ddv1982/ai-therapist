import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';
import { encryptMessage, safeDecryptMessages } from '@/lib/message-encryption';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      return createAuthErrorResponse(authResult.error || 'Authentication required');
    }
    
    const { sessionId, role, content } = await request.json();

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'SessionId, role, and content are required' },
        { status: 400 }
      );
    }

    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/user-session');
    const userInfo = getSingleUserInfo(request);

    // Verify session belongs to this user
    const session = await prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: userInfo.userId 
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Encrypt the message before storing
    const encryptedMessageData = encryptMessage({
      role,
      content,
      timestamp: new Date()
    });

    const message = await prisma.message.create({
      data: {
        sessionId,
        role: encryptedMessageData.role,
        content: encryptedMessageData.content,
        timestamp: encryptedMessageData.timestamp,
      },
    });

    // Return decrypted message for immediate use by client
    return NextResponse.json({
      id: message.id,
      sessionId: message.sessionId,
      role,
      content, // Return original unencrypted content
      timestamp: message.timestamp,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      return createAuthErrorResponse(authResult.error || 'Authentication required');
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/user-session');
    const userInfo = getSingleUserInfo(request);

    // Verify session belongs to this user
    const session = await prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: userInfo.userId 
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });

    // Decrypt messages before returning to client
    const decryptedMessages = safeDecryptMessages(messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    })));

    // Combine decrypted content with original message metadata
    const responseMessages = messages.map((msg, index) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      role: decryptedMessages[index].role,
      content: decryptedMessages[index].content,
      timestamp: decryptedMessages[index].timestamp,
      createdAt: msg.createdAt
    }));

    return NextResponse.json(responseMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}