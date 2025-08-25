import { NextRequest, NextResponse } from 'next/server'
import { featureFlagsService } from '@/lib/feature-flags-service'
import { getCurrentUser } from '@/lib/supabase-client'
import type { FeatureFlagContext } from '@/lib/feature-flags-schema'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { flagKeys, context: requestContext } = body

    if (!flagKeys || !Array.isArray(flagKeys)) {
      return NextResponse.json(
        { error: 'Flag keys must be an array' },
        { status: 400 }
      )
    }

    if (flagKeys.length === 0) {
      return NextResponse.json({})
    }

    // Validate flag keys
    const invalidKeys = flagKeys.filter(key => typeof key !== 'string' || key.length === 0)
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid flag keys: ${invalidKeys.join(', ')}` },
        { status: 400 }
      )
    }

    // Limit batch size to prevent abuse
    if (flagKeys.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 flags can be evaluated in a single batch' },
        { status: 400 }
      )
    }

    // Build evaluation context
    const context: FeatureFlagContext = {
      userId: user.id,
      tenantId: user.tenant_id || undefined,
      environment: requestContext?.environment || 'production',
      userProperties: {
        email: user.email,
        plan: user.subscription_plan,
        role: user.role,
        company: user.company,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        ...requestContext?.userProperties
      },
      customProperties: requestContext?.customProperties || {}
    }

    // Evaluate all flags
    const evaluations = await featureFlagsService.evaluateFlags(flagKeys, context)

    return NextResponse.json(evaluations)

  } catch (error) {
    console.error('Batch feature flag evaluation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get flag keys from query params
    const { searchParams } = new URL(request.url)
    const keysParam = searchParams.get('keys')
    const environment = searchParams.get('environment') || 'production'

    if (!keysParam) {
      return NextResponse.json(
        { error: 'Flag keys are required' },
        { status: 400 }
      )
    }

    // Parse comma-separated keys
    const flagKeys = keysParam.split(',').map(key => key.trim()).filter(Boolean)

    if (flagKeys.length === 0) {
      return NextResponse.json({})
    }

    // Limit batch size
    if (flagKeys.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 flags can be evaluated in a single batch' },
        { status: 400 }
      )
    }

    // Build evaluation context
    const context: FeatureFlagContext = {
      userId: user.id,
      tenantId: user.tenant_id || undefined,
      environment,
      userProperties: {
        email: user.email,
        plan: user.subscription_plan,
        role: user.role,
        company: user.company,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      customProperties: {}
    }

    // Evaluate all flags
    const evaluations = await featureFlagsService.evaluateFlags(flagKeys, context)

    return NextResponse.json(evaluations)

  } catch (error) {
    console.error('Batch feature flag evaluation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
