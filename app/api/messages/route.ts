import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, role, content } = await request.json();

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'SessionId, role, and content are required' },
        { status: 400 }
      );
    }

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    // Verify session belongs to this device user
    const session = await prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: deviceUser.userId 
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    // Verify session belongs to this device user
    const session = await prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: deviceUser.userId 
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