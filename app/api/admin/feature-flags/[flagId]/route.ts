import { NextRequest, NextResponse } from 'next/server'
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
    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get flag details
    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (error || !flag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    // Get flag values
    const { data: values } = await supabase
      .from('feature_flag_values')
      .select('*')
      .eq('flag_id', flagId)
      .order('environment')

    // Get dependencies
    const { data: dependencies } = await supabase
      .from('feature_flag_dependencies')
      .select(`
        *,
        depends_on_flag:feature_flags!feature_flag_dependencies_depends_on_flag_id_fkey(key, name)
      `)
      .eq('flag_id', flagId)

    // Get evaluation statistics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: evaluations } = await supabase
      .from('feature_flag_evaluations')
      .select('environment, evaluated_value, evaluation_reason, created_at')
      .eq('flag_id', flagId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    return NextResponse.json({
      flag,
      values: values || [],
      dependencies: dependencies || [],
      evaluations: evaluations || []
    })

  } catch (error) {
    console.error('Error fetching feature flag:', error)
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
      name,
      description,
      status,
      isGlobal,
      tenantId,
      tags,
      targetUsers,
      targetSegments,
      rolloutPercentage
    } = body

    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Check if flag exists
    const { data: existingFlag, error: fetchError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (fetchError || !existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    // Update flag
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (isGlobal !== undefined) {
      (updateData as any).is_global = isGlobal
      (updateData as any).tenant_id = isGlobal ? null : (tenantId || (existingFlag as any).tenant_id)
    }
    if (tags !== undefined) (updateData as any).tags = tags
    if (targetUsers !== undefined) (updateData as any).target_users = targetUsers
    if (targetSegments !== undefined) (updateData as any).target_segments = targetSegments
    if (rolloutPercentage !== undefined) (updateData as any).rollout_percentage = rolloutPercentage

    const { data: updatedFlag, error: updateError } = await (supabase as any)
      .from('feature_flags')
      .update(updateData)
      .eq('id', flagId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedFlag)

  } catch (error) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update feature flag',
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
    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Check if flag exists
    const { data: existingFlag, error: fetchError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (fetchError || !existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    // Check if flag has dependencies (other flags depend on this one)
    const { data: dependentFlags } = await supabase
      .from('feature_flag_dependencies')
      .select('flag_id')
      .eq('depends_on_flag_id', flagId)

    if (dependentFlags && dependentFlags.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete flag with dependencies',
          details: 'Other flags depend on this flag. Remove dependencies first.'
        },
        { status: 409 }
      )
    }

    // Archive flag instead of hard delete to preserve audit trail
    const { error: archiveError } = await (supabase as any)
      .from('feature_flags')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', flagId)

    if (archiveError) {
      throw archiveError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting feature flag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete feature flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
