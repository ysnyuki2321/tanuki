import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
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

    const { ruleId } = params
    const supabase = getSupabaseAdmin()

    const { data: rule, error } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (error || !rule) {
      return NextResponse.json(
        { error: 'Rate limit rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)

  } catch (error) {
    console.error('Error fetching rate limit rule:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
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

    const { ruleId } = params
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

    const supabase = getSupabaseAdmin()

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rate limit rule not found' },
        { status: 404 }
      )
    }

    // Validate values if provided
    if (windowMs !== undefined && (windowMs < 1000 || windowMs > 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Window must be between 1 second and 24 hours' },
        { status: 400 }
      )
    }

    if (maxRequests !== undefined && (maxRequests < 1 || maxRequests > 10000)) {
      return NextResponse.json(
        { error: 'Max requests must be between 1 and 10000' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (path !== undefined) updateData.path = path
    if (method !== undefined) updateData.method = method
    if (windowMs !== undefined) updateData.window_ms = windowMs
    if (maxRequests !== undefined) updateData.max_requests = maxRequests
    if (userTier !== undefined) updateData.user_tier = userTier
    if (description !== undefined) updateData.description = description
    if (enabled !== undefined) updateData.enabled = enabled

    // Update rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('rate_limit_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedRule)

  } catch (error) {
    console.error('Error updating rate limit rule:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update rate limit rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
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

    const { ruleId } = params
    const supabase = getSupabaseAdmin()

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rate limit rule not found' },
        { status: 404 }
      )
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from('rate_limit_rules')
      .delete()
      .eq('id', ruleId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting rate limit rule:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete rate limit rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
