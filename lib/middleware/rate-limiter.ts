import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'

// Rate limiter configuration interface
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
  message?: string // Custom error message
  statusCode?: number // HTTP status code for rate limit exceeded
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (request: NextRequest) => Promise<string> // Custom key generator
  skip?: (request: NextRequest) => Promise<boolean> // Skip rate limiting for certain requests
  onLimitReached?: (request: NextRequest, key: string) => Promise<void> // Callback when limit is reached
}

// Default configurations for different endpoint types
export const rateLimitConfigs = {
  // Authentication endpoints (stricter limits)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    statusCode: 429
  },

  // API endpoints (general usage)
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Rate limit exceeded, please slow down',
    statusCode: 429
  },

  // File upload endpoints (moderate limits)
  upload: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute
    message: 'Upload rate limit exceeded, please wait before uploading more files',
    statusCode: 429
  },

  // Admin endpoints (relaxed for authenticated admins)
  admin: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    message: 'Admin rate limit exceeded',
    statusCode: 429
  },

  // Public endpoints (very strict)
  public: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Public API rate limit exceeded',
    statusCode: 429
  },

  // Premium users (higher limits)
  premium: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute
    message: 'Premium rate limit exceeded',
    statusCode: 429
  }
}

// Redis client interface (to avoid requiring Redis as dependency until needed)
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { PX?: number; EX?: number }): Promise<string | null>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  del(key: string): Promise<number>
  pipeline(): RedisPipeline
}

interface RedisPipeline {
  incr(key: string): RedisPipeline
  expire(key: string, seconds: number): RedisPipeline
  exec(): Promise<Array<[Error | null, any]>>
}

// Rate limiter class
export class RateLimiter {
  private redis: RedisClient | null = null
  private initialized = false
  private fallbackStore = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    if (this.initialized) return

    try {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (!redisUrl) {
        console.warn('No Redis URL configured, using in-memory fallback for rate limiting')
        this.initialized = true
        return
      }

      // Validate Redis URL format
      if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://') && !redisUrl.startsWith('https://')) {
        console.warn('Invalid Redis URL format, using in-memory fallback for rate limiting')
        this.initialized = true
        return
      }

      if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
        // Standard Redis connection
        const Redis = await import('ioredis')
        this.redis = new Redis.default(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000
        }) as any

        // Test connection
        await this.redis.ping()
        console.log('Redis rate limiter initialized with ioredis')
      } else if (redisUrl.startsWith('https://') && upstashToken) {
        // Upstash Redis REST API
        const { Redis: UpstashRedis } = await import('@upstash/redis')
        this.redis = new UpstashRedis({
          url: redisUrl,
          token: upstashToken
        }) as any

        // Test connection
        await this.redis.ping()
        console.log('Redis rate limiter initialized with Upstash')
      } else {
        console.warn('Redis configuration incomplete, using in-memory fallback for rate limiting')
      }

      this.initialized = true
    } catch (error) {
      console.warn('Failed to initialize Redis for rate limiting, using in-memory fallback:', error)
      this.redis = null
      this.initialized = true
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeRedis()
    }
  }

  // Generate rate limit key
  private async generateKey(request: NextRequest, config: RateLimitConfig): Promise<string> {
    if (config.keyGenerator) {
      return config.keyGenerator(request)
    }

    // Default key generation strategy
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = new URL(request.url).pathname
    
    // Try to get user ID for authenticated requests
    try {
      const user = await getCurrentUser()
      if (user) {
        return `rate_limit:user:${user.id}:${path}`
      }
    } catch {
      // Not authenticated, use IP-based limiting
    }

    // Fallback to IP + path + user agent hash
    const hash = this.simpleHash(userAgent)
    return `rate_limit:ip:${ip}:${path}:${hash}`
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return 'unknown'
  }

  // Simple hash function
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Check rate limit using Redis
  private async checkRateLimitRedis(key: string, config: RateLimitConfig): Promise<{
    allowed: boolean
    count: number
    remaining: number
    resetTime: number
  }> {
    await this.ensureInitialized()

    if (!this.redis) {
      return this.checkRateLimitFallback(key, config)
    }

    try {
      const windowSeconds = Math.ceil(config.windowMs / 1000)
      const now = Date.now()
      const resetTime = now + config.windowMs

      // Check if redis connection is still alive
      if (typeof this.redis.ping === 'function') {
        await Promise.race([
          this.redis.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 1000))
        ])
      }

      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, windowSeconds)

      const results = await Promise.race([
        pipeline.exec(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Redis operation timeout')), 3000))
      ])

      if (!results || results.length < 2) {
        throw new Error('Redis pipeline failed - invalid results')
      }

      const [incrResult, expireResult] = results

      if (incrResult[0]) {
        throw incrResult[0]
      }

      const count = incrResult[1] as number
      if (typeof count !== 'number' || isNaN(count)) {
        throw new Error('Invalid count returned from Redis')
      }

      const remaining = Math.max(0, config.max - count)
      const allowed = count <= config.max

      return {
        allowed,
        count,
        remaining,
        resetTime
      }
    } catch (error) {
      console.warn('Redis rate limit check failed, falling back to in-memory:', error)
      // Disable Redis for this instance if it's consistently failing
      this.redis = null
      return this.checkRateLimitFallback(key, config)
    }
  }

  // Fallback rate limiting using in-memory store
  private checkRateLimitFallback(key: string, config: RateLimitConfig): {
    allowed: boolean
    count: number
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const resetTime = now + config.windowMs
    
    const existing = this.fallbackStore.get(key)
    
    if (!existing || now > existing.resetTime) {
      // New window or expired window
      this.fallbackStore.set(key, { count: 1, resetTime })
      return {
        allowed: true,
        count: 1,
        remaining: config.max - 1,
        resetTime
      }
    }

    // Increment count
    existing.count++
    this.fallbackStore.set(key, existing)

    const remaining = Math.max(0, config.max - existing.count)
    const allowed = existing.count <= config.max

    return {
      allowed,
      count: existing.count,
      remaining,
      resetTime: existing.resetTime
    }
  }

  // Main rate limiting function
  async checkRateLimit(request: NextRequest, config: RateLimitConfig): Promise<{
    allowed: boolean
    count: number
    remaining: number
    resetTime: number
    retryAfter: number
  }> {
    // Check if request should be skipped
    if (config.skip && await config.skip(request)) {
      return {
        allowed: true,
        count: 0,
        remaining: config.max,
        resetTime: Date.now() + config.windowMs,
        retryAfter: 0
      }
    }

    const key = await this.generateKey(request, config)
    const result = await this.checkRateLimitRedis(key, config)
    
    const retryAfter = result.allowed ? 0 : Math.ceil((result.resetTime - Date.now()) / 1000)

    // Call callback if limit is reached
    if (!result.allowed && config.onLimitReached) {
      try {
        await config.onLimitReached(request, key)
      } catch (error) {
        console.error('Rate limit callback failed:', error)
      }
    }

    return {
      ...result,
      retryAfter
    }
  }

  // Cleanup fallback store periodically
  cleanupFallbackStore(): void {
    const now = Date.now()
    for (const [key, value] of this.fallbackStore.entries()) {
      if (now > value.resetTime) {
        this.fallbackStore.delete(key)
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Cleanup fallback store every 5 minutes
setInterval(() => {
  rateLimiter.cleanupFallbackStore()
}, 5 * 60 * 1000)

export { rateLimiter }

// Middleware factory function
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await rateLimiter.checkRateLimit(request, config)
    
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter: result.retryAfter
        },
        { status: config.statusCode || 429 }
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', config.max.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
      response.headers.set('Retry-After', result.retryAfter.toString())

      return response
    }

    return null // Allow request to proceed
  }
}

// Pre-configured middleware functions
export const authRateLimit = createRateLimitMiddleware(rateLimitConfigs.auth)
export const apiRateLimit = createRateLimitMiddleware(rateLimitConfigs.api)
export const uploadRateLimit = createRateLimitMiddleware(rateLimitConfigs.upload)
export const adminRateLimit = createRateLimitMiddleware(rateLimitConfigs.admin)
export const publicRateLimit = createRateLimitMiddleware(rateLimitConfigs.public)

// Advanced rate limiting with user-based tiers
export async function createAdaptiveRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    const user = await getCurrentUser()
    
    let config = rateLimitConfigs.public // Default for unauthenticated users
    
    if (user) {
      // Determine user tier
      const plan = user.subscription_plan?.toLowerCase()
      
      if (user.role === 'admin') {
        config = rateLimitConfigs.admin
      } else if (plan === 'premium' || plan === 'enterprise') {
        config = rateLimitConfigs.premium
      } else {
        config = rateLimitConfigs.api
      }
    }

    const middleware = createRateLimitMiddleware(config)
    return middleware(request)
  } catch (error) {
    console.error('Adaptive rate limit error:', error)
    // Fallback to public rate limit on error
    return publicRateLimit(request)
  }
}
