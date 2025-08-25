import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // In a real implementation, this would:
    // 1. Connect to Redis to get all active rate limit keys
    // 2. Parse the keys to extract information
    // 3. Get current counts and reset times
    // 4. Return structured data

    // Mock active limits for demonstration
    const activeLimits = [
      {
        key: 'rate_limit:ip:192.168.1.100:/api/auth/login:abc123',
        count: 5,
        limit: 5,
        remaining: 0,
        resetTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        path: '/api/auth/login',
        userInfo: 'IP: 192.168.1.100'
      },
      {
        key: 'rate_limit:user:user123:/api/upload:def456',
        count: 18,
        limit: 20,
        remaining: 2,
        resetTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        path: '/api/upload',
        userInfo: 'User: user123'
      },
      {
        key: 'rate_limit:ip:203.0.113.42:/api/register:ghi789',
        count: 3,
        limit: 5,
        remaining: 2,
        resetTime: new Date(Date.now() + 12 * 60 * 1000), // 12 minutes from now
        path: '/api/register',
        userInfo: 'IP: 203.0.113.42'
      }
    ]

    // Filter out expired limits
    const now = new Date()
    const currentActiveLimits = activeLimits.filter(limit => limit.resetTime > now)

    return NextResponse.json({
      activeLimits: currentActiveLimits
    })

  } catch (error) {
    console.error('Error fetching active rate limits:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
