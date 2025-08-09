import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log the error with detailed information
    console.error('CLIENT ERROR REPORT:', {
      timestamp: new Date().toISOString(),
      ...errorData
    });

    // You could also save to database or send to external error tracking service
    // For now, we'll just log to console

    return NextResponse.json({ 
      success: true, 
      message: 'Error logged successfully' 
    });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return system information for debugging
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV
  });
}