import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface SessionUpdateData {
  updatedAt: Date;
  status?: string;
  endedAt?: Date | null;
  title?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { status, endedAt, title } = await request.json();
    const { sessionId } = params;

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    const updateData: SessionUpdateData = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (endedAt !== undefined) updateData.endedAt = endedAt ? new Date(endedAt) : null;
    if (title !== undefined) updateData.title = title;

    const session = await prisma.session.update({
      where: { 
        id: sessionId,
        userId: deviceUser.userId // Ensure user can only update their own sessions
      },
      data: updateData,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    const session = await prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: deviceUser.userId // Ensure user can only access their own sessions
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        reports: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    await prisma.session.delete({
      where: { 
        id: sessionId,
        userId: deviceUser.userId // Ensure user can only delete their own sessions
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}