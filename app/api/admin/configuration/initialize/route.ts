import { NextResponse } from 'next/server'
import { AdminConfigService } from '@/lib/admin-config'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export async function POST() {
  try {
    // Check if database is configured
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please configure database connection first.' },
        { status: 503 }
      )
    }

    await AdminConfigService.initializeDefaultConfigs()
    
    return NextResponse.json({
      success: true,
      message: 'Default configurations initialized successfully'
    })
  } catch (error) {
    console.error('Failed to initialize configurations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize configurations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
