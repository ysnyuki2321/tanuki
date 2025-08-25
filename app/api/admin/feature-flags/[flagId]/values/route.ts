import { NextRequest, NextResponse } from 'next/server'
import { featureFlagsService } from '@/lib/feature-flags-service'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')

    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    let query = supabase
      .from('feature_flag_values')
      .select('*')
      .eq('flag_id', flagId)

    if (environment) {
      query = query.eq('environment', environment)
    }

    const { data: values, error } = await query.order('environment')

    if (error) {
      throw error
    }

    return NextResponse.json(values || [])

  } catch (error) {
    console.error('Error fetching flag values:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    const body = await request.json()
    const {
      environment,
      value,
      enabled,
      rolloutPercentage,
      conditions,
      tenantId
    } = body

    // Validate required fields
    if (!environment) {
      return NextResponse.json(
        { error: 'Environment is required' },
        { status: 400 }
      )
    }

    // Validate rollout percentage
    if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return NextResponse.json(
        { error: 'Rollout percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Check if flag exists
    const { data: flag, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (flagError || !flag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      flag_id: flagId,
      environment,
      created_by: user.id,
      updated_at: new Date().toISOString()
    }

    if (value !== undefined) updateData.value = value
    if (enabled !== undefined) updateData.enabled = enabled
    if (rolloutPercentage !== undefined) updateData.rollout_percentage = rolloutPercentage
    if (conditions !== undefined) updateData.conditions = conditions
    if (tenantId !== undefined) updateData.tenant_id = tenantId

    // Use the service to update flag value
    const flagValue = await featureFlagsService.updateFlagValue(
      flagId,
      environment,
      value !== undefined ? value : (flag as any).default_value,
      {
        enabled: enabled !== undefined ? enabled : true,
        rolloutPercentage: rolloutPercentage !== undefined ? rolloutPercentage : 100,
        conditions,
        tenantId
      },
      user.id
    )

    return NextResponse.json(flagValue)

  } catch (error) {
    console.error('Error updating flag value:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update flag value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    const body = await request.json()
    const {
      environment,
      value,
      enabled = true,
      rolloutPercentage = 100,
      conditions,
      tenantId
    } = body

    // Validate required fields
    if (!environment || value === undefined) {
      return NextResponse.json(
        { error: 'Environment and value are required' },
        { status: 400 }
      )
    }

    // Validate rollout percentage
    if (rolloutPercentage < 0 || rolloutPercentage > 100) {
      return NextResponse.json(
        { error: 'Rollout percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Check if flag exists
    const { data: flag, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (flagError || !flag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    // Check if value already exists for this environment
    const { data: existingValue } = await (supabase as any)
      .from('feature_flag_values')
      .select('id')
      .eq('flag_id', flagId)
      .eq('environment', environment)
      .eq('tenant_id', tenantId || '')
      .single()

    if (existingValue) {
      return NextResponse.json(
        { error: 'Flag value already exists for this environment' },
        { status: 409 }
      )
    }

    // Create new flag value
    const flagValue = await featureFlagsService.updateFlagValue(
      flagId,
      environment,
      value,
      {
        enabled,
        rolloutPercentage,
        conditions,
        tenantId
      },
      user.id
    )

    return NextResponse.json(flagValue, { status: 201 })

  } catch (error) {
    console.error('Error creating flag value:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create flag value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    // Authenticate admin user
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')
    const tenantId = searchParams.get('tenantId')

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Delete flag value
    const { error } = await (supabase as any)
      .from('feature_flag_values')
      .delete()
      .eq('flag_id', flagId)
      .eq('environment', environment)
      .eq('tenant_id', tenantId || '')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting flag value:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete flag value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
