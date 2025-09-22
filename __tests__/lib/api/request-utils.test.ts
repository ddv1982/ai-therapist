import { NextRequest, NextResponse } from 'next/server';
import { readHeaderValue, getClientIPFromRequest, setResponseHeaders } from '@/lib/api/middleware/request-utils';

describe('request-utils', () => {
  it('readHeaderValue works with Headers and is case-insensitive', () => {
    const h = new Headers({ 'X-Forwarded-For': '1.2.3.4, 5.6.7.8', 'x-real-ip': '9.9.9.9' });
    expect(readHeaderValue(h, 'x-forwarded-for')).toBe('1.2.3.4, 5.6.7.8');
    expect(readHeaderValue(h, 'X-REAL-IP')).toBe('9.9.9.9');
  });

  it('readHeaderValue works with plain object and arrays', () => {
    const h: Record<string, string | string[] | undefined> = { 'x-forwarded-for': ['10.0.0.1', '10.0.0.2'], 'x-real-ip': '10.0.0.9' };
    expect(readHeaderValue(h, 'x-forwarded-for')).toBe('10.0.0.1');
    expect(readHeaderValue(h, 'X-REAL-IP')).toBe('10.0.0.9');
  });

  it('getClientIPFromRequest prefers x-forwarded-for then x-real-ip then request.ip', () => {
    // forwarded
    const req1 = { headers: new Headers({ 'x-forwarded-for': '100.100.100.100, 200.200.200.200' }) } as unknown as NextRequest;
    expect(getClientIPFromRequest(req1)).toBe('100.100.100.100');
    // real ip
    const req2 = { headers: new Headers({ 'x-real-ip': '123.123.123.123' }) } as unknown as NextRequest;
    expect(getClientIPFromRequest(req2)).toBe('123.123.123.123');
    // ip field fallback
    const req3 = { headers: new Headers(), ip: '8.8.8.8' } as unknown as NextRequest & { ip: string };
    expect(getClientIPFromRequest(req3)).toBe('8.8.8.8');
    // unknown
    const req4 = { headers: new Headers() } as unknown as NextRequest;
    expect(getClientIPFromRequest(req4)).toBe('unknown');
  });

  it('setResponseHeaders sets X-Request-Id and Server-Timing on NextResponse', () => {
    const res = NextResponse.json({ ok: true });
    setResponseHeaders(res, 'rid-123', 42);
    expect(res.headers.get('X-Request-Id')).toBe('rid-123');
    expect(res.headers.get('Server-Timing')).toBe('total;dur=42');
  });

  it('setResponseHeaders sets headers on native Response', () => {
    const res = new Response('ok', { status: 200 });
    setResponseHeaders(res, 'rid-xyz', 5);
    expect(res.headers.get('X-Request-Id')).toBe('rid-xyz');
    expect(res.headers.get('Server-Timing')).toBe('total;dur=5');
  });
});


