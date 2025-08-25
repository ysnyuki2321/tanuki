import { NextRequest, NextResponse } from 'next/server'
import { AdminConfigService } from '@/lib/admin-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config } = body

    if (!type || !config) {
      return NextResponse.json(
        { error: 'Test type and config are required' },
        { status: 400 }
      )
    }

    let result: { success: boolean; error?: string }

    switch (type) {
      case 'database':
        result = await AdminConfigService.testDatabaseConnection({
          url: config.url,
          anonKey: config.anonKey,
          serviceKey: config.serviceKey
        })
        break

      case 'email':
        result = await AdminConfigService.testEmailConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          secure: config.secure
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      error: result.error
    })
  } catch (error) {
    console.error('Configuration test failed:', error)
    return NextResponse.json(
      { 
        error: 'Configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
