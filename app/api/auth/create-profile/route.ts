import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getCurrentUser } from '@/lib/supabase-client'
import { type DbUser } from '@/lib/database-schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, metadata = {} } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Create user profile in database
    const userProfile: Partial<DbUser> = {
      id: userId,
      email,
      full_name: metadata.full_name || null,
      company: metadata.company || null,
      phone: metadata.phone || null,
      role: 'user',
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: null,
      storage_quota: 1024 * 1024 * 1024, // 1GB default
      file_count_limit: 1000,
      avatar_url: null,
      subscription_plan: null,
      subscription_status: null,
      subscription_expires: null,
      timezone: null,
      language: 'en',
      theme: null
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('users')
      .insert([userProfile])
      .select()
      .single()

    if (error) {
      console.error('Failed to create user profile:', error)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: data 
    })

  } catch (error) {
    console.error('Error creating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
