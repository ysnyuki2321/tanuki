import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'
import { StorageConfigValidatorImpl } from '@/lib/storage/storage-factory'
import type { StorageConfig } from '@/lib/storage/storage-interface'

export async function GET(
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

    // Decrypt credentials
    const providerWithCredentials = {
      ...provider,
      credentials: provider.encrypted_credentials ? 
        JSON.parse(provider.encrypted_credentials) : {}
    }

    return NextResponse.json(providerWithCredentials)

  } catch (error) {
    console.error('Error fetching storage provider:', error)
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
    const body = await request.json()
    const {
      name,
      bucketName,
      region,
      credentials,
      isActive,
      isDefault
    } = body

    const supabase = getSupabaseAdmin()

    // Check if provider exists
    const { data: existingProvider, error: fetchError } = await supabase
      .from('storage_providers')
      .select('*')
      .eq('id', providerId)
      .single()

    if (fetchError || !existingProvider) {
      return NextResponse.json(
        { error: 'Storage provider not found' },
        { status: 404 }
      )
    }

    // Validate storage configuration if credentials were updated
    if (credentials) {
      const config: StorageConfig = {
        provider: existingProvider.type,
        bucketName: bucketName || existingProvider.bucket_name,
        region: region !== undefined ? region : existingProvider.region,
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
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingProvider.is_default) {
      await supabase
        .from('storage_providers')
        .update({ is_default: false })
        .eq('tenant_id', existingProvider.tenant_id || null)
        .neq('id', providerId)
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (bucketName !== undefined) updateData.bucket_name = bucketName
    if (region !== undefined) updateData.region = region
    if (credentials !== undefined) updateData.encrypted_credentials = JSON.stringify(credentials)
    if (isActive !== undefined) updateData.is_active = isActive
    if (isDefault !== undefined) updateData.is_default = isDefault

    // Update provider
    const { data: updatedProvider, error: updateError } = await supabase
      .from('storage_providers')
      .update(updateData)
      .eq('id', providerId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Test connection if credentials were updated
    if (credentials) {
      const config: StorageConfig = {
        provider: updatedProvider.type,
        bucketName: updatedProvider.bucket_name,
        region: updatedProvider.region,
        credentials
      }
      testConnectionAsync(providerId, config)
    }

    return NextResponse.json({
      ...updatedProvider,
      credentials: credentials || JSON.parse(existingProvider.encrypted_credentials || '{}')
    })

  } catch (error) {
    console.error('Error updating storage provider:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update storage provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if provider exists
    const { data: existingProvider, error: fetchError } = await supabase
      .from('storage_providers')
      .select('*')
      .eq('id', providerId)
      .single()

    if (fetchError || !existingProvider) {
      return NextResponse.json(
        { error: 'Storage provider not found' },
        { status: 404 }
      )
    }

    // Prevent deleting default provider
    if (existingProvider.is_default) {
      return NextResponse.json(
        { 
          error: 'Cannot delete default storage provider',
          details: 'Set another provider as default before deleting this one.'
        },
        { status: 409 }
      )
    }

    // Check if provider is being used by files
    const { data: filesUsingProvider } = await supabase
      .from('files')
      .select('id')
      .eq('storage_provider', existingProvider.name)
      .limit(1)

    if (filesUsingProvider && filesUsingProvider.length > 0) {
      return NextResponse.json(
        { 
          error: 'Storage provider is in use',
          details: 'This provider is being used by existing files and cannot be deleted.'
        },
        { status: 409 }
      )
    }

    // Delete the provider
    const { error: deleteError } = await supabase
      .from('storage_providers')
      .delete()
      .eq('id', providerId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting storage provider:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete storage provider',
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
    await supabase
      .from('storage_providers')
      .update({
        health_status: isHealthy ? 'healthy' : 'unhealthy',
        last_health_check: new Date().toISOString()
      })
      .eq('id', providerId)
  } catch (error) {
    console.error('Failed to test storage provider connection:', error)
    
    const supabase = getSupabaseAdmin()
    await supabase
      .from('storage_providers')
      .update({
        health_status: 'unhealthy',
        last_health_check: new Date().toISOString()
      })
      .eq('id', providerId)
  }
}
