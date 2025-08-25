import { NextRequest, NextResponse } from 'next/server'
import { AdminConfigService } from '@/lib/admin-config'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const tenantId = searchParams.get('tenantId') || undefined

    // Check if database is configured
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const configs = await AdminConfigService.getConfigs(category, tenantId)
    
    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('Failed to fetch configurations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch configurations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, options } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Configuration key is required' },
        { status: 400 }
      )
    }

    // Check if database is configured
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const config = await AdminConfigService.setConfig(key, value, options)
    
    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Failed to save configuration:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')
    const tenantId = searchParams.get('tenantId') || undefined

    if (!key) {
      return NextResponse.json(
        { error: 'Configuration key is required' },
        { status: 400 }
      )
    }

    // Check if database is configured
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    await AdminConfigService.deleteConfig(key, tenantId)
    
    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete configuration:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
