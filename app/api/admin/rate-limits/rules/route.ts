import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'

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

    const supabase = getSupabaseAdmin()

    // Get all rate limit rules
    const { data: rules, error } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      rules: rules || []
    })

  } catch (error) {
    console.error('Error fetching rate limit rules:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    const {
      name,
      path,
      method,
      windowMs,
      maxRequests,
      userTier,
      description,
      enabled
    } = body

    // Validate required fields
    if (!name || !path || !windowMs || !maxRequests) {
      return NextResponse.json(
        { error: 'Name, path, window, and max requests are required' },
        { status: 400 }
      )
    }

    // Validate values
    if (windowMs < 1000 || windowMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Window must be between 1 second and 24 hours' },
        { status: 400 }
      )
    }

    if (maxRequests < 1 || maxRequests > 10000) {
      return NextResponse.json(
        { error: 'Max requests must be between 1 and 10000' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if a rule with the same path and method already exists
    const { data: existingRule } = await supabase
      .from('rate_limit_rules')
      .select('id')
      .eq('path', path)
      .eq('method', method || 'ALL')
      .eq('user_tier', userTier || 'all')
      .single()

    if (existingRule) {
      return NextResponse.json(
        { error: 'A rule with this path, method, and user tier already exists' },
        { status: 409 }
      )
    }

    // Create rate limit rule
    const { data: rule, error } = await supabase
      .from('rate_limit_rules')
      .insert({
        name,
        path,
        method: method || 'ALL',
        window_ms: windowMs,
        max_requests: maxRequests,
        user_tier: userTier || 'all',
        description: description || null,
        enabled: enabled !== false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(rule, { status: 201 })

  } catch (error) {
    console.error('Error creating rate limit rule:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create rate limit rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
