import { getSupabase, getSupabaseAdmin } from './supabase-client'
import { AuthService } from './auth-service'
import type { DbUser } from './database-schema'

export interface UserSearchFilters {
  query: string
  role: string[]
  status: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  storageUsage: {
    min: number | null
    max: number | null
    unit: 'MB' | 'GB' | 'TB'
  }
  sortBy: 'name' | 'email' | 'created' | 'lastLogin' | 'storageUsed'
  sortOrder: 'asc' | 'desc'
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  adminUsers: number
  totalStorageUsed: number
  averageStoragePerUser: number
  newUsersThisMonth: number
  activeUsersThisMonth: number
}

export interface UserActivityLog {
  id: string
  userId: string
  action: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  details?: any
}

export interface PasswordResetRequest {
  userId: string
  newPassword?: string
  sendEmail?: boolean
  temporaryPassword?: boolean
}

export class UserManagementService {
  /**
   * Get all users with optional filtering
   */
  static async getUsers(
    filters?: Partial<UserSearchFilters>,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ users: DbUser[]; total: number }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new Error('Admin database access not configured')
      }

      // Build query
      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.query) {
        query = query.or(`full_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`)
      }

      if (filters?.role && filters.role.length > 0) {
        query = query.in('role', filters.role)
      }

      if (filters?.status && filters.status.length > 0) {
        // Map status to email_verified and other fields
        const statusConditions = filters.status.map(status => {
          switch (status) {
            case 'active': return 'email_verified.eq.true'
            case 'suspended': return 'role.eq.suspended' // You might have a specific suspended role
            case 'pending': return 'email_verified.eq.false'
            default: return null
          }
        }).filter(Boolean)
        
        if (statusConditions.length > 0) {
          query = query.or(statusConditions.join(','))
        }
      }

      if (filters?.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString())
      }

      if (filters?.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString())
      }

      if (filters?.storageUsage?.min !== null || filters?.storageUsage?.max !== null) {
        const { min, max, unit } = filters.storageUsage
        const multiplier = unit === 'TB' ? 1024 * 1024 * 1024 * 1024 : 
                          unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024

        if (min !== null) {
          // This would need a calculated field or view for actual storage usage
          // For now, we'll use storage_quota as a placeholder
        }
        
        if (max !== null) {
          // Similar placeholder logic
        }
      }

      // Apply sorting
      if (filters?.sortBy) {
        const column = filters.sortBy === 'name' ? 'full_name' :
                      filters.sortBy === 'created' ? 'created_at' :
                      filters.sortBy === 'lastLogin' ? 'last_login' :
                      filters.sortBy === 'storageUsed' ? 'storage_quota' : // Placeholder
                      'email'

        query = query.order(column, { 
          ascending: filters.sortOrder === 'asc' 
        })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        users: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Error getting users:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new Error('Admin database access not configured')
      }

      // Get total users
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get active users (email verified)
      const { count: activeUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true)

      // Get admin users
      const { count: adminUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      // Get new users this month
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsersThisMonth } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())

      // Calculate storage stats (placeholder - would need actual file size aggregation)
      const { data: storageData } = await supabaseAdmin
        .from('users')
        .select('storage_quota')

      const totalStorageQuota = storageData?.reduce((sum, user) => 
        sum + (user.storage_quota || 0), 0) || 0

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: (totalUsers || 0) - (activeUsers || 0),
        adminUsers: adminUsers || 0,
        totalStorageUsed: totalStorageQuota * 0.6, // Placeholder - 60% usage
        averageStoragePerUser: totalUsers ? totalStorageQuota / totalUsers : 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeUsersThisMonth: activeUsers || 0, // Placeholder
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  /**
   * Suspend a user account
   */
  static async suspendUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
      }

      // Update user to suspended state
      // Note: Supabase doesn't have built-in user suspension, so we'll use a custom approach
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log the action
      await this.logUserAction(currentUser.id, 'user.suspend', userId, {
        reason,
        suspendedBy: currentUser.id
      })

      return { success: true }
    } catch (error) {
      console.error('Error suspending user:', error)
      return { success: false, error: 'Failed to suspend user' }
    }
  }

  /**
   * Activate a suspended user account
   */
  static async activateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
      }

      // Reactivate user
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role: 'user',
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log the action
      await this.logUserAction(currentUser.id, 'user.activate', userId, {
        activatedBy: currentUser.id
      })

      return { success: true }
    } catch (error) {
      console.error('Error activating user:', error)
      return { success: false, error: 'Failed to activate user' }
    }
  }

  /**
   * Reset user password
   */
  static async resetUserPassword(
    userId: string, 
    options: PasswordResetRequest
  ): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
      }

      let temporaryPassword: string | undefined

      if (options.newPassword) {
        // Set specific password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: options.newPassword
        })

        if (error) {
          return { success: false, error: error.message }
        }
      } else if (options.temporaryPassword) {
        // Generate temporary password
        temporaryPassword = this.generateTemporaryPassword()
        
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: temporaryPassword
        })

        if (error) {
          return { success: false, error: error.message }
        }
      } else if (options.sendEmail) {
        // Send password reset email
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()

        if (!user) {
          return { success: false, error: 'User not found' }
        }

        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: user.email,
        })

        if (error) {
          return { success: false, error: error.message }
        }
      }

      // Log the action
      await this.logUserAction(currentUser.id, 'user.password_reset', userId, {
        resetBy: currentUser.id,
        method: options.newPassword ? 'direct' : 
               options.temporaryPassword ? 'temporary' : 'email'
      })

      return { success: true, temporaryPassword }
    } catch (error) {
      console.error('Error resetting user password:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }

  /**
   * Update user details
   */
  static async updateUser(
    userId: string, 
    updates: Partial<DbUser>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
      }

      // Remove fields that shouldn't be updated directly
      const { id, created_at, ...allowedUpdates } = updates

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          ...allowedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the action
      await this.logUserAction(currentUser.id, 'user.update', userId, {
        updatedBy: currentUser.id,
        updates: Object.keys(allowedUpdates)
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: 'Failed to update user' }
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
      }

      // Don't allow deleting yourself
      if (userId === currentUser.id) {
        return { success: false, error: 'Cannot delete your own account' }
      }

      // Delete from auth system
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) {
        return { success: false, error: authError.message }
      }

      // Delete from users table (cascade will handle related data)
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      // Log the action
      await this.logUserAction(currentUser.id, 'user.delete', userId, {
        deletedBy: currentUser.id
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(
    userId: string, 
    limit: number = 50
  ): Promise<UserActivityLog[]> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return []
      }

      const { data, error } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting user activity logs:', error)
        return []
      }

      return data?.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        timestamp: log.created_at,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        details: log.details
      })) || []
    } catch (error) {
      console.error('Error getting user activity logs:', error)
      return []
    }
  }

  /**
   * Bulk user operations
   */
  static async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<DbUser>
  ): Promise<{ success: boolean; updatedCount: number; errors: string[] }> {
    const results = await Promise.allSettled(
      userIds.map(id => this.updateUser(id, updates))
    )

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : r.value.error)

    return {
      success: successCount > 0,
      updatedCount: successCount,
      errors
    }
  }

  /**
   * Export users data
   */
  static async exportUsers(filters?: Partial<UserSearchFilters>): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { users } = await this.getUsers(filters, 10000, 0) // Large limit for export

      const exportData = users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        emailVerified: user.email_verified,
        storageQuota: user.storage_quota,
        fileCountLimit: user.file_count_limit,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        company: user.company,
        phone: user.phone
      }))

      return { success: true, data: exportData }
    } catch (error) {
      console.error('Error exporting users:', error)
      return { success: false, error: 'Failed to export users' }
    }
  }

  // Private helper methods

  private static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  private static async logUserAction(
    adminId: string,
    action: string,
    targetUserId: string,
    details: any
  ) {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) return

      await supabaseAdmin
        .from('activity_logs')
        .insert({
          user_id: adminId,
          action,
          resource_type: 'user',
          resource_id: targetUserId,
          details
        })
    } catch (error) {
      console.error('Error logging user action:', error)
    }
  }
}

export default UserManagementService
