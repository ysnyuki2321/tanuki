import { NextResponse } from 'next/server'
import { AdminConfigService } from '@/lib/admin-config'

export async function GET() {
  try {
    const health = await AdminConfigService.getConfigHealth()
    
    return NextResponse.json({
      success: true,
      data: health
    })
  } catch (error) {
    console.error('Failed to check configuration health:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check configuration health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
