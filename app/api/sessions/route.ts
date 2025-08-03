import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // For now, we'll use a default user ID
    // In a real app, this would come from authentication
    const defaultUserId = 'default-user-id';

    // Create or get default user
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: {
        id: defaultUserId,
        email: 'default@example.com',
        name: 'Default User',
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: defaultUserId,
        title,
        status: 'active',
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}