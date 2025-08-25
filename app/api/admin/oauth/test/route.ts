import { NextRequest, NextResponse } from 'next/server'
import { AdminConfigService } from '@/lib/admin-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, config } = body

    if (!provider || !config) {
      return NextResponse.json(
        { error: 'Provider and config are required' },
        { status: 400 }
      )
    }

    // Validate required OAuth config fields
    const requiredFields = {
      google: ['oauth_google_client_id', 'oauth_google_client_secret'],
      github: ['oauth_github_client_id', 'oauth_github_client_secret']
    }

    const required = requiredFields[provider as keyof typeof requiredFields]
    if (!required) {
      return NextResponse.json(
        { error: 'Invalid OAuth provider' },
        { status: 400 }
      )
    }

    // Check if all required fields are present
    const missing = required.filter(field => !config[field])
    if (missing.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missing.join(', ')}`,
          success: false 
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would test the OAuth configuration
    // by making a test request to the provider's API endpoints
    
    // For now, we'll just validate that the configuration looks correct
    const clientId = config[`oauth_${provider}_client_id`]
    const clientSecret = config[`oauth_${provider}_client_secret`]

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          error: 'Client ID and secret are required',
          success: false 
        }
      )
    }

    // Basic validation for client ID format
    if (clientId.length < 10) {
      return NextResponse.json(
        { 
          error: 'Client ID appears to be invalid (too short)',
          success: false 
        }
      )
    }

    if (clientSecret.length < 10) {
      return NextResponse.json(
        { 
          error: 'Client secret appears to be invalid (too short)',
          success: false 
        }
      )
    }

    // Test passed
    return NextResponse.json({
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth configuration appears valid`
    })

  } catch (error) {
    console.error('OAuth configuration test failed:', error)
    return NextResponse.json(
      { 
        error: 'OAuth configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}
