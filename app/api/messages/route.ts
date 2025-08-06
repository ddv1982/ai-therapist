import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';

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

    const message = await prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(message);
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

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}