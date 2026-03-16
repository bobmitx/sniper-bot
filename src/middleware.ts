import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 200;

function checkRateLimit(clientId: string, pathname: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `${clientId}:${pathname}`;
  const entry = rateLimitStore.get(key);

  // Clean up old entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);
  
  if (!currentEntry) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: DEFAULT_MAX_REQUESTS - 1 };
  }

  if (currentEntry.count >= DEFAULT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  currentEntry.count++;
  return { allowed: true, remaining: DEFAULT_MAX_REQUESTS - currentEntry.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const rateCheck = checkRateLimit(clientId, pathname);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(DEFAULT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(rateCheck.remaining));
    return response;
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: '/api/:path*',
};
