import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, clearAll } = body

    if (!key && !clearAll) {
      return NextResponse.json(
        { error: 'Either key or clearAll must be specified' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Connect to Redis
    // 2. Delete the specific key or pattern of keys
    // 3. Log the admin action for audit purposes

    try {
      // Attempt to clear from Redis if available
      const Redis = await import('ioredis')
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
      
      if (redisUrl) {
        let redis
        
        if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
          redis = new Redis.default(redisUrl)
        } else {
          const { Redis: UpstashRedis } = await import('@upstash/redis')
          redis = UpstashRedis.fromEnv()
        }

        if (clearAll) {
          // Clear all rate limit keys
          const pattern = 'rate_limit:*'
          
          if ('keys' in redis) {
            // Standard Redis
            const keys = await (redis as any).keys(pattern)
            if (keys.length > 0) {
              await (redis as any).del(...keys)
            }
          } else {
            // Upstash Redis (doesn't support keys command)
            console.warn('Cannot clear all keys with Upstash Redis - keys command not supported')
            return NextResponse.json({
              success: false,
              message: 'Clear all not supported with current Redis configuration'
            }, { status: 400 })
          }
        } else {
          // Clear specific key
          await (redis as any).del(key)
        }

        // Close connection if it's a standard Redis client
        if ('disconnect' in redis) {
          (redis as any).disconnect()
        }

        return NextResponse.json({
          success: true,
          message: clearAll ? 'All rate limits cleared' : `Rate limit cleared for key: ${key}`
        })
      } else {
        // No Redis configured, just return success
        return NextResponse.json({
          success: true,
          message: 'No Redis configured - using in-memory rate limiting'
        })
      }
    } catch (redisError) {
      console.error('Redis operation failed:', redisError)
      
      // Fallback - still return success as we might be using in-memory rate limiting
      return NextResponse.json({
        success: true,
        message: 'Rate limit clear attempted (Redis unavailable)'
      })
    }

  } catch (error) {
    console.error('Error clearing rate limits:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear rate limits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
