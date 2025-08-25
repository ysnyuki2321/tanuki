import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'
import { StorageConfigValidatorImpl } from '@/lib/storage/storage-factory'
import type { StorageConfig } from '@/lib/storage/storage-interface'

export async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
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

    const { providerId } = params
    const supabase = getSupabaseAdmin()

    // Get storage provider
    const { data: provider, error } = await supabase
      .from('storage_providers')
      .select('*')
      .eq('id', providerId)
      .single()

    if (error || !provider) {
      return NextResponse.json(
        { error: 'Storage provider not found' },
        { status: 404 }
      )
    }

    // Parse credentials
    const credentials = provider.encrypted_credentials ? 
      JSON.parse(provider.encrypted_credentials) : {}

    // Create storage config for testing
    const config: StorageConfig = {
      provider: provider.type,
      bucketName: provider.bucket_name,
      region: provider.region,
      credentials
    }

    // Test connection
    const validator = new StorageConfigValidatorImpl()
    const startTime = Date.now()
    
    try {
      const isHealthy = await validator.testConnection(config)
      const responseTime = Date.now() - startTime

      // Update health status in database
      await supabase
        .from('storage_providers')
        .update({
          health_status: isHealthy ? 'healthy' : 'unhealthy',
          last_health_check: new Date().toISOString(),
          response_time_ms: responseTime
        })
        .eq('id', providerId)

      return NextResponse.json({
        success: isHealthy,
        responseTime,
        message: isHealthy ? 'Connection successful' : 'Connection failed',
        timestamp: new Date().toISOString()
      })

    } catch (testError) {
      const responseTime = Date.now() - startTime

      // Update health status as unhealthy
      await supabase
        .from('storage_providers')
        .update({
          health_status: 'unhealthy',
          last_health_check: new Date().toISOString(),
          response_time_ms: responseTime
        })
        .eq('id', providerId)

      return NextResponse.json({
        success: false,
        responseTime,
        message: `Connection failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error testing storage provider connection:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
