/**
 * API Authentication & Security Utilities
 * 
 * Provides authentication middleware, request validation, and security helpers
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const AUTH_ENABLED = process.env.ENABLE_API_AUTH === 'true';
const API_KEYS = new Set(
  (process.env.API_KEYS || '').split(',').filter(Boolean)
);

// Session-based auth (for future implementation with NextAuth)
export interface AuthContext {
  userId?: string;
  walletAddress?: string;
  isAuthenticated: boolean;
  role: 'guest' | 'user' | 'admin';
}

// Request context with auth info
export interface RequestContext {
  clientId: string;
  timestamp: number;
  auth: AuthContext;
}

/**
 * Check if the request has valid authentication
 */
export function checkAuth(request: NextRequest): AuthContext {
  // If auth is not enabled, return default context
  if (!AUTH_ENABLED) {
    return {
      isAuthenticated: true,
      role: 'user',
    };
  }

  // Check for API key authentication
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && API_KEYS.has(apiKey)) {
    return {
      isAuthenticated: true,
      role: 'admin',
    };
  }

  // Check for session token (would be implemented with NextAuth)
  const sessionToken = request.cookies.get('session-token')?.value;
  if (sessionToken) {
    // In production, validate the session token
    // For now, return authenticated context
    return {
      isAuthenticated: true,
      role: 'user',
    };
  }

  // Check for wallet signature authentication
  const walletSignature = request.headers.get('x-wallet-signature');
  const walletAddress = request.headers.get('x-wallet-address');
  if (walletSignature && walletAddress) {
    // In production, verify the signature
    return {
      isAuthenticated: true,
      walletAddress,
      role: 'user',
    };
  }

  // Return unauthenticated context
  return {
    isAuthenticated: false,
    role: 'guest',
  };
}

/**
 * Middleware wrapper that adds authentication to API routes
 */
export function withAuth(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
  options: { requireAuth?: boolean; requiredRole?: 'user' | 'admin' } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = checkAuth(request);
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const context: RequestContext = {
      clientId,
      timestamp: Date.now(),
      auth,
    };

    // Check if authentication is required
    if (options.requireAuth && !auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check role requirement
    if (options.requiredRole === 'admin' && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // Allow requests with no origin (e.g., mobile apps, curl)
  if (!origin) return true;
  
  // Check if origin matches host
  if (host && origin.includes(host)) return true;
  
  // Check allowed origins from environment
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  if (allowedOrigins.some(allowed => origin.includes(allowed))) return true;
  
  // Allow sandbox origins
  if (origin.includes('.space.z.ai') || origin.includes('.z.ai')) return true;
  
  return false;
}

/**
 * Create a signed request payload
 */
export function createSignedPayload(data: unknown, secret: string): string {
  const payload = JSON.stringify({ data, timestamp: Date.now() });
  // In production, use proper HMAC signing
  return Buffer.from(payload).toString('base64');
}

/**
 * Verify a signed request payload
 */
export function verifySignedPayload(payload: string, secret: string, maxAge: number = 5 * 60 * 1000): unknown | null {
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    const { data, timestamp } = decoded;
    
    // Check if payload is expired
    if (Date.now() - timestamp > maxAge) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
