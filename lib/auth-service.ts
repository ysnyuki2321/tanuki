import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from './supabase-client'
import type { DbUser } from './database-schema'
import { getConfig, getEnhancedConfig } from './enhanced-config'
import { DemoAuthService } from './demo-auth'
import { RealAdminAuthService } from './real-admin-auth'

// Authentication service with null-safe operations
export class AuthService {
  // Check if auth is properly configured
  static isConfigured(): boolean {
    return isSupabaseConfigured() || DemoAuthService.isDemoMode()
  }

  // Sign up with email verification
  static async signUp(email: string, password: string, metadata?: {
    full_name?: string
    company?: string
    phone?: string
  }) {
    const supabase = getSupabase()
    if (!supabase) {
      // Fallback to demo mode
      return await DemoAuthService.signUp(email, password, metadata)
    }

    const config = getConfig()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`,
          data: {
            full_name: metadata?.full_name || null,
            company: metadata?.company || null,
            phone: metadata?.phone || null,
            role: 'user', // Default role
            tenant_id: null, // Will be set later
            storage_quota: config.default_storage_quota,
            file_count_limit: config.default_file_limit,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Create user profile if signup successful
      if (data.user && !error) {
        await this.createUserProfile(data.user.id, {
          email,
          full_name: metadata?.full_name || null,
          company: metadata?.company || null,
          phone: metadata?.phone || null,
          email_verified: false,
          role: 'user',
          storage_quota: config.default_storage_quota,
          file_count_limit: config.default_file_limit,
        })
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign in with email/password
  static async signIn(email: string, password: string) {
    // Check if this is a real admin login
    if (RealAdminAuthService.isRealAdmin(email)) {
      const result = await RealAdminAuthService.authenticateAdmin(email, password)
      if (result.success && result.session) {
        // Convert admin session to regular auth format
        return {
          success: true,
          user: {
            ...result.session.user,
            role: 'admin',
            tenant_id: null,
            storage_quota: null,
            file_count_limit: null,
            avatar_url: null,
            phone: null,
            company: null,
            email_verified: true,
            subscription_plan: null,
            subscription_status: null,
            subscription_expires: null,
            timezone: null,
            language: null,
            theme: null,
            created_at: result.session.user.created_at,
            updated_at: result.session.user.created_at,
            last_login: result.session.user.last_login
          } as DbUser
        }
      } else {
        return result
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      // Fallback to demo mode for regular users
      return await DemoAuthService.signIn(email, password)
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Update last login
      if (data.user) {
        await this.updateLastLogin(data.user.id)
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign out
  static async signOut() {
    const supabase = getSupabase()
    if (!supabase) {
      await DemoAuthService.signOut()
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoAuthService.resetPassword(email)
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const supabase = getSupabase()
    if (!supabase) {
      // Demo mode doesn't support password update without current password
      return { success: false, error: 'Password update not available in demo mode' }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }

  // Get current session
  static async getSession() {
    const supabase = getSupabase()
    if (!supabase) {
      const demoSession = DemoAuthService.getCurrentSession()
      return { session: demoSession.user ? { user: demoSession.user } : null, user: demoSession.user }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      return { session, user: session?.user || null }
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null, user: null }
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<DbUser | null> {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoAuthService.getCurrentUser() as DbUser | null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Get full user profile from database
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      return profile || null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Create user profile in database
  static async createUserProfile(userId: string, profileData: Partial<DbUser>) {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Create user profile error:', error)
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Create user profile error:', error)
      throw error
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<DbUser>) {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoAuthService.updateProfile(updates)
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  // Update last login timestamp
  static async updateLastLogin(userId: string) {
    const supabase = getSupabase()
    if (!supabase) return

    try {
      await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Update last login error:', error)
    }
  }

  // Verify email manually (admin function)
  static async verifyEmail(userId: string) {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    try {
      // Update email_verified in our users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Update email_confirmed_at in auth.users
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      )

      if (authError) {
        console.warn('Auth email confirmation error:', authError)
      }

      return { success: true }
    } catch (error) {
      console.error('Verify email error:', error)
      throw error
    }
  }

  // OAuth sign in (Google, GitHub)
  static async signInWithOAuth(provider: 'google' | 'github') {
    const supabase = getSupabase()
    if (!supabase) {
      throw new Error('Supabase not configured. Please setup database connection first.')
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { url: data.url }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      throw error
    }
  }

  // Check if user has permission
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    if (!supabase) return false

    try {
      const user = await this.getCurrentUser()
      if (!user) return false

      // Super admin has all permissions
      if (user.role === 'super_admin') return true

      // Admin has most permissions
      if (user.role === 'admin') {
        const adminPermissions = [
          'admin.users.read',
          'admin.users.write',
          'admin.files.read',
          'admin.files.write',
          'admin.system.read',
          'files.read',
          'files.write',
          'files.share',
        ]
        return adminPermissions.includes(permission)
      }

      // Regular user permissions
      if (user.role === 'user') {
        const userPermissions = [
          'files.read',
          'files.write',
          'files.share',
        ]
        return userPermissions.includes(permission)
      }

      return false
    } catch (error) {
      console.error('Check permission error:', error)
      return false
    }
  }

  // Get user by ID (admin function)
  static async getUserById(userId: string): Promise<DbUser | null> {
    if (!supabaseAdmin) return null

    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      return data || null
    } catch (error) {
      console.error('Get user by ID error:', error)
      return null
    }
  }

  // List all users (admin function)
  static async listUsers(limit: number = 50, offset: number = 0): Promise<DbUser[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      const demoUsers = await DemoAuthService.listUsers()
      return demoUsers.slice(offset, offset + limit) as DbUser[]
    }

    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('List users error:', error)
      return []
    }
  }

  // Delete user (admin function)
  static async deleteUser(userId: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    try {
      // Delete user from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) {
        throw new Error(authError.message)
      }

      // Delete user profile from database
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (dbError) {
        throw new Error(dbError.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  }

  // Handle auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = getSupabase()
    if (!supabase) {
      // Demo mode: simulate auth state change subscription
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return supabase.auth.onAuthStateChange(callback)
  }
}

export default AuthService
