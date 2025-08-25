import { NextRequest, NextResponse } from 'next/server'
import { 
  createRateLimitMiddleware, 
  rateLimitConfigs, 
  createAdaptiveRateLimit 
} from './lib/middleware/rate-limiter'

// Route-specific rate limiting configuration
const routeConfigs = {
  // Authentication routes
  '/api/auth': rateLimitConfigs.auth,
  '/api/register': rateLimitConfigs.auth,
  '/api/login': rateLimitConfigs.auth,
  '/api/forgot-password': rateLimitConfigs.auth,
  '/api/reset-password': rateLimitConfigs.auth,
  
  // File upload routes
  '/api/upload': rateLimitConfigs.upload,
  '/api/files/upload': rateLimitConfigs.upload,
  
  // Admin routes
  '/api/admin': rateLimitConfigs.admin,
  
  // Public API routes
  '/api/public': rateLimitConfigs.public,
  
  // Feature flags (frequent access)
  '/api/feature-flags': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // High limit for feature flag checks
    message: 'Feature flag rate limit exceeded'
  },
  
  // Storage operations
  '/api/storage': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Moderate limit for storage operations
    message: 'Storage operation rate limit exceeded'
  }
}

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// CSP (Content Security Policy) configuration
function getCSPHeader(): string {
  const isDev = process.env.NODE_ENV === 'development'
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'" + (isDev ? " 'unsafe-inline' 'unsafe-eval'" : ""),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' " + (isDev ? "ws: wss:" : "") + " https:",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]
  
  return csp.join('; ')
}

// Security headers
const securityHeaders = {
  // CSP
  'Content-Security-Policy': getCSPHeader(),
  
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Remove server information
  'X-Powered-By': '',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  try {
    // 1. CORS handling
    if (request.method === 'OPTIONS') {
      response = new NextResponse(null, { status: 200 })
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }

    // 2. Rate limiting
    const rateLimitResponse = await handleRateLimit(request, pathname)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // 3. Security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })

    // 4. CORS headers for actual requests
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // 5. Additional security measures
    
    // Remove sensitive headers
    response.headers.delete('Server')
    response.headers.delete('X-Powered-By')
    
    // Add custom security headers
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Return a safe response on error
    response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    // Still apply security headers even on error
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })
    
    return response
  }
}

async function handleRateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  try {
    // Find matching route configuration
    let config = null
    let matchedRoute = ''
    
    // Check for exact matches first
    for (const [route, routeConfig] of Object.entries(routeConfigs)) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        config = routeConfig
        matchedRoute = route
        break
      }
    }
    
    // Apply rate limiting based on route
    if (config) {
      const middleware = createRateLimitMiddleware(config)
      const rateLimitResponse = await middleware(request)
      
      if (rateLimitResponse) {
        // Add additional context to rate limit response
        rateLimitResponse.headers.set('X-RateLimit-Route', matchedRoute)
        return rateLimitResponse
      }
    } else if (pathname.startsWith('/api/')) {
      // Apply adaptive rate limiting for other API routes
      const adaptiveResponse = await createAdaptiveRateLimit(request)
      
      if (adaptiveResponse) {
        adaptiveResponse.headers.set('X-RateLimit-Route', 'adaptive')
        return adaptiveResponse
      }
    }
    
    return null // Allow request to proceed
  } catch (error) {
    console.error('Rate limiting error:', error)
    return null // Allow request on error (fail open)
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
