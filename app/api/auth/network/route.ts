import { NextRequest, NextResponse } from 'next/server';
import { getNetworkPassword } from '@/lib/network-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    const networkPassword = getNetworkPassword();
    
    console.log(`[DEBUG API] Received password: ${password?.substring(0, 4)}...`);
    console.log(`[DEBUG API] Expected password: ${networkPassword?.substring(0, 4)}...`);
    console.log(`[DEBUG API] Password match: ${password === networkPassword}`);
    
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