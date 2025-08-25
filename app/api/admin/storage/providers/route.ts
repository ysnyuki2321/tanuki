import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'
import { StorageConfigValidatorImpl } from '@/lib/storage/storage-factory'
import type { StorageConfig } from '@/lib/storage/storage-interface'

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

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get storage providers for tenant
    let query = supabase
      .from('storage_providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantId && tenantId !== 'null') {
      query = query.eq('tenant_id', tenantId)
    } else {
      query = query.is('tenant_id', null) // Global providers
    }

    const { data: providers, error } = await query

    if (error) {
      throw error
    }

    // Decrypt sensitive credentials (in production, use proper encryption)
    const providersWithDecryptedCredentials = providers?.map(provider => ({
      ...(provider as any),
      credentials: (provider as any).encrypted_credentials ? 
        JSON.parse((provider as any).encrypted_credentials) : {}
    })) || []

    return NextResponse.json({
      providers: providersWithDecryptedCredentials
    })

  } catch (error) {
    console.error('Error fetching storage providers:', error)
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
      name,
      type,
      bucketName,
      region,
      credentials,
      tenantId,
      isDefault
    } = body

    // Validate required fields
    if (!name || !type || !bucketName) {
      return NextResponse.json(
        { error: 'Name, type, and bucket name are required' },
        { status: 400 }
      )
    }

    // Validate storage configuration
    const config: StorageConfig = {
      provider: type,
      bucketName,
      region,
      credentials
    }

    const validator = new StorageConfigValidatorImpl()
    const validation = await validator.validate(config)

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid storage configuration',
          details: validation.errors
        },
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

    // Check if name already exists for this tenant
    const { data: existingProvider } = await supabase
      .from('storage_providers')
      .select('id')
      .eq('name', name)
      .eq('tenant_id', tenantId || null)
      .single()

    if (existingProvider) {
      return NextResponse.json(
        { error: 'A provider with this name already exists' },
        { status: 409 }
      )
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await (supabase as any)
        .from('storage_providers')
        .update({ is_default: false })
        .eq('tenant_id', tenantId || null)
    }

    // Create storage provider
    const { data: provider, error } = await (supabase as any)
      .from('storage_providers')
      .insert({
        name,
        type,
        bucket_name: bucketName,
        region,
        tenant_id: tenantId || null,
        encrypted_credentials: JSON.stringify(credentials), // In production, use proper encryption
        is_default: isDefault || false,
        is_active: true,
        health_status: 'unknown',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Test connection asynchronously
    testConnectionAsync(provider.id, config)

    return NextResponse.json({
      ...provider,
      credentials // Return unencrypted for immediate use
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating storage provider:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create storage provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Async function to test connection and update health status
async function testConnectionAsync(providerId: string, config: StorageConfig) {
  try {
    const validator = new StorageConfigValidatorImpl()
    const isHealthy = await validator.testConnection(config)
    
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await (supabase as any)
        .from('storage_providers')
        .update({
          health_status: isHealthy ? 'healthy' : 'unhealthy',
          last_health_check: new Date().toISOString()
        })
        .eq('id', providerId)
    }
  } catch (error) {
    console.error('Failed to test storage provider connection:', error)
    
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await (supabase as any)
        .from('storage_providers')
        .update({
          health_status: 'unhealthy',
          last_health_check: new Date().toISOString()
        })
        .eq('id', providerId)
    }
  }
}
