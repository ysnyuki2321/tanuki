import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'
import { rateLimiter } from '@/lib/middleware/rate-limiter'

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

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000))

    // In a real implementation, these stats would come from:
    // 1. Redis/database logs of rate limit violations
    // 2. Application metrics
    // 3. Web server logs

    // Mock data for demonstration
    const stats = {
      totalRequests: 45234,
      blockedRequests: 892,
      topBlockedIPs: [
        { ip: '192.168.1.100', count: 156 },
        { ip: '10.0.0.45', count: 89 },
        { ip: '203.0.113.42', count: 67 },
        { ip: '198.51.100.23', count: 45 },
        { ip: '172.16.0.78', count: 34 }
      ],
      topBlockedPaths: [
        { path: '/api/auth/login', count: 234 },
        { path: '/api/upload', count: 178 },
        { path: '/api/register', count: 145 },
        { path: '/api/admin/users', count: 89 },
        { path: '/api/files', count: 67 }
      ],
      hourlyStats: generateHourlyStats(hours)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching rate limit stats:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateHourlyStats(hours: number) {
  const stats = []
  const now = new Date()
  
  for (let i = hours - 1; i >= 0; i--) {
    const hour = new Date(now.getTime() - (i * 60 * 60 * 1000))
    const requests = Math.floor(Math.random() * 2000) + 500
    const blocked = Math.floor(requests * (Math.random() * 0.05 + 0.01)) // 1-6% blocked
    
    stats.push({
      hour: hour.toISOString(),
      requests,
      blocked
    })
  }
  
  return stats
}
