import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseAdmin } from '@/lib/supabase-client'

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
    const supabase = getSupabaseAdmin()

    // Get the target provider
    const { data: targetProvider, error: fetchError } = await supabase
      .from('storage_providers')
      .select('*')
      .eq('id', providerId)
      .single()

    if (fetchError || !targetProvider) {
      return NextResponse.json(
        { error: 'Storage provider not found' },
        { status: 404 }
      )
    }

    // Check if provider is active
    if (!targetProvider.is_active) {
      return NextResponse.json(
        { 
          error: 'Cannot set inactive provider as default',
          details: 'Activate the provider before setting it as default.'
        },
        { status: 400 }
      )
    }

    // Check health status
    if (targetProvider.health_status === 'unhealthy') {
      return NextResponse.json(
        { 
          error: 'Cannot set unhealthy provider as default',
          details: 'Ensure the provider connection is healthy before setting as default.'
        },
        { status: 400 }
      )
    }

    // Start a transaction to update default status
    const { error: resetError } = await supabase
      .from('storage_providers')
      .update({ is_default: false })
      .eq('tenant_id', targetProvider.tenant_id || null)

    if (resetError) {
      throw resetError
    }

    // Set the target provider as default
    const { data: updatedProvider, error: updateError } = await supabase
      .from('storage_providers')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Update application configuration to use new default provider
    // This would typically update a configuration cache or restart services
    await updateStorageManagerConfiguration(targetProvider.tenant_id)

    return NextResponse.json({
      success: true,
      provider: {
        ...updatedProvider,
        credentials: JSON.parse(updatedProvider.encrypted_credentials || '{}')
      },
      message: `"${updatedProvider.name}" is now the default storage provider`
    })

  } catch (error) {
    console.error('Error setting default storage provider:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set default storage provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Function to update storage manager configuration
async function updateStorageManagerConfiguration(tenantId: string | null) {
  try {
    // In a real implementation, you would:
    // 1. Update storage manager configuration
    // 2. Refresh provider connections
    // 3. Notify other services about the change
    // 4. Update any cached configurations
    
    console.log(`Storage configuration updated for tenant: ${tenantId || 'global'}`)
    
    // Example: Send notification to storage service
    // await fetch('/api/internal/storage/refresh-config', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tenantId })
    // })
    
  } catch (error) {
    console.error('Failed to update storage manager configuration:', error)
    // Don't throw here as the database update was successful
  }
}
