import { NextRequest, NextResponse } from 'next/server';
import { getNetworkPassword } from '@/lib/network-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    const networkPassword = getNetworkPassword();
    
    // Environment-controlled debug logging
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
      console.log(`[AUTH] Network authentication attempt from IP: ${request.ip || 'unknown'}`);
    }
    
    if (password === networkPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('network-auth-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 2, // 2 hours
        path: '/'
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}