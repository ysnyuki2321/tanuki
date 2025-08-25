import { NextRequest, NextResponse } from 'next/server'
import { featureFlagsService } from '@/lib/feature-flags-service'
import { getSupabaseAdmin, getCurrentUser } from '@/lib/supabase-client'

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

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    // Get all flags for tenant (or global flags if no tenant specified)
    const flags = await featureFlagsService.getTenantFlags(tenantId || undefined)

    // Get flag values for each flag
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    
    const flagValues: Record<string, any[]> = {}

    for (const flag of flags) {
      const { data: values, error } = await supabase
        .from('feature_flag_values')
        .select('*')
        .eq('flag_id', flag.id)
        .order('environment')

      if (!error && values) {
        flagValues[flag.id] = values
      }
    }

    return NextResponse.json({
      flags,
      flagValues
    })

  } catch (error) {
    console.error('Error fetching feature flags:', error)
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
      key,
      name,
      description,
      flagType,
      defaultValue,
      tenantId,
      isGlobal,
      environments
    } = body

    // Validate required fields
    if (!key || !name || !flagType) {
      return NextResponse.json(
        { error: 'Key, name, and flag type are required' },
        { status: 400 }
      )
    }

    // Validate flag key format
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return NextResponse.json(
        { error: 'Flag key can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    // Check if flag key already exists
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    
    const { data: existingFlag } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('key', key)
      .or(`tenant_id.eq.${tenantId || 'null'},is_global.eq.true`)
      .single()

    if (existingFlag) {
      return NextResponse.json(
        { error: 'A flag with this key already exists' },
        { status: 409 }
      )
    }

    // Create the flag
    const flag = await featureFlagsService.createFlag({
      key,
      name,
      description,
      flagType,
      defaultValue,
      tenantId: isGlobal ? undefined : tenantId,
      isGlobal,
      environments: environments || ['development', 'staging', 'production']
    }, user.id)

    // Create default values for each environment
    const defaultEnvironments = environments || ['development', 'staging', 'production']
    for (const environment of defaultEnvironments) {
      await featureFlagsService.updateFlagValue(
        flag.id,
        environment,
        defaultValue,
        {
          enabled: false, // Start disabled by default
          rolloutPercentage: 100,
          tenantId: isGlobal ? undefined : tenantId
        },
        user.id
      )
    }

    return NextResponse.json(flag, { status: 201 })

  } catch (error) {
    console.error('Error creating feature flag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create feature flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
