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
    const { flagKey, context: requestContext } = body

    if (!flagKey || typeof flagKey !== 'string') {
      return NextResponse.json(
        { error: 'Flag key is required and must be a string' },
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

    // Evaluate the flag
    const evaluation = await featureFlagsService.evaluateFlag(flagKey, context)

    return NextResponse.json(evaluation)

  } catch (error) {
    console.error('Feature flag evaluation error:', error)
    
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

    // Get flag key from query params
    const { searchParams } = new URL(request.url)
    const flagKey = searchParams.get('key')
    const environment = searchParams.get('environment') || 'production'

    if (!flagKey) {
      return NextResponse.json(
        { error: 'Flag key is required' },
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

    // Evaluate the flag
    const evaluation = await featureFlagsService.evaluateFlag(flagKey, context)

    return NextResponse.json(evaluation)

  } catch (error) {
    console.error('Feature flag evaluation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
