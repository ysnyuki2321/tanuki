import { getSupabase, getSupabaseAdmin } from './supabase-client'
import { AuthService } from './auth-service'
import type { DbFile, DbShare } from './database-schema'

export interface ShareOptions {
  permissions: string[]
  expiresAt?: Date | null
  password?: string
  maxDownloads?: number
  email?: string
  allowPreview?: boolean
}

export interface ShareLinkInfo {
  share: DbShare
  file: DbFile
  isValid: boolean
  requiresPassword: boolean
  isExpired: boolean
  downloadLimitReached: boolean
  errorMessage?: string
}

export interface ShareStats {
  totalShares: number
  activeShares: number
  expiredShares: number
  totalDownloads: number
  topSharedFiles: Array<{
    file: DbFile
    shareCount: number
    downloadCount: number
  }>
}

export class FileSharingService {
  /**
   * Create a share link for a file
   */
  static async createShare(
    fileId: string,
    options: ShareOptions
  ): Promise<{ success: boolean; shareToken?: string; shareUrl?: string; error?: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify file ownership
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !file) {
        return { success: false, error: 'File not found or access denied' }
      }

      // Hash password if provided
      let passwordHash = null
      if (options.password) {
        passwordHash = await this.hashPassword(options.password)
      }

      // Generate unique share token
      const shareToken = await this.generateShareToken()

      // Create share record
      const shareData = {
        file_id: fileId,
        shared_by: user.id,
        shared_with_email: options.email || null,
        token: shareToken,
        permissions: options.permissions,
        password_hash: passwordHash,
        expires_at: options.expiresAt ? options.expiresAt.toISOString() : null,
        max_downloads: options.maxDownloads || null,
        download_count: 0,
        is_active: true
      }

      const { data: share, error: shareError } = await (supabase as any)
        .from('shares')
        .insert(shareData)
        .select()
        .single()

      if (shareError) {
        return { success: false, error: shareError.message }
      }

      // Update file share token for quick access
      await (supabase as any)
        .from('files')
        .update({ share_token: shareToken })
        .eq('id', fileId)

      // Log activity
      await this.logActivity(user.id, 'share.create', fileId, {
        shareToken,
        permissions: options.permissions,
        expiresAt: options.expiresAt
      })

      const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`

      return {
        success: true,
        shareToken,
        shareUrl
      }
    } catch (error) {
      console.error('Error creating share:', error)
      return { success: false, error: 'Failed to create share' }
    }
  }

  /**
   * Get share information by token
   */
  static async getShareInfo(token: string): Promise<ShareLinkInfo | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data: share, error } = await supabase
        .from('shares')
        .select(`
          *,
          file:files(*)
        `)
        .eq('token', token)
        .single()

      if (error || !share || !(share as any).file) {
        return null
      }

      const now = new Date()
      const isExpired = (share as any).expires_at ? new Date((share as any).expires_at) < now : false
      const downloadLimitReached = (share as any).max_downloads ? (share as any).download_count >= (share as any).max_downloads : false
      const requiresPassword = !!(share as any).password_hash
      
      const isValid = (share as any).is_active && !isExpired && !downloadLimitReached

      let errorMessage = undefined
      if (!(share as any).is_active) {
        errorMessage = 'This share link has been deactivated'
      } else if (isExpired) {
        errorMessage = 'This share link has expired'
      } else if (downloadLimitReached) {
        errorMessage = 'Download limit has been reached for this file'
      }

      return {
        share: share as DbShare,
        file: (share as any).file as DbFile,
        isValid,
        requiresPassword,
        isExpired,
        downloadLimitReached,
        errorMessage
      }
    } catch (error) {
      console.error('Error getting share info:', error)
      return null
    }
  }

  /**
   * Verify share password
   */
  static async verifySharePassword(token: string, password: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { data: share } = await supabase
        .from('shares')
        .select('password_hash')
        .eq('token', token)
        .single()

      if (!(share as any)?.password_hash) return true // No password required

      return await this.verifyPassword(password, (share as any).password_hash)
    } catch (error) {
      console.error('Error verifying share password:', error)
      return false
    }
  }

  /**
   * Download shared file
   */
  static async downloadSharedFile(
    token: string, 
    password?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const shareInfo = await this.getShareInfo(token)
      if (!shareInfo) {
        return { success: false, error: 'Share not found' }
      }

      if (!shareInfo.isValid) {
        return { success: false, error: shareInfo.errorMessage || 'Share is not valid' }
      }

      // Check password if required
      if (shareInfo.requiresPassword) {
        if (!password) {
          return { success: false, error: 'Password required' }
        }
        
        const passwordValid = await this.verifySharePassword(token, password)
        if (!passwordValid) {
          return { success: false, error: 'Invalid password' }
        }
      }

      // Check download permission
      if (!shareInfo.share.permissions.includes('download')) {
        return { success: false, error: 'Download not permitted' }
      }

      // Generate signed URL for download
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('files')
        .createSignedUrl(shareInfo.file.storage_path!, 3600) // 1 hour expiry

      if (urlError) {
        return { success: false, error: urlError.message }
      }

      // Increment download count
      await supabase
        .from('shares')
        .update({ 
          download_count: shareInfo.share.download_count + 1 
        })
        .eq('token', token)

      // Log download
      await this.logActivity(null, 'share.download', shareInfo.file.id, {
        shareToken: token,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      })

      return { success: true, url: signedUrlData.signedUrl }
    } catch (error) {
      console.error('Error downloading shared file:', error)
      return { success: false, error: 'Failed to download file' }
    }
  }

  /**
   * Get user's shares
   */
  static async getUserShares(userId?: string): Promise<DbShare[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const user = userId ? { id: userId } : await AuthService.getCurrentUser()
      if (!user) return []

      const { data: shares, error } = await supabase
        .from('shares')
        .select(`
          *,
          file:files(id, name, original_name, size, created_at)
        `)
        .eq('shared_by', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading user shares:', error)
        return []
      }

      return shares as DbShare[]
    } catch (error) {
      console.error('Error getting user shares:', error)
      return []
    }
  }

  /**
   * Update share settings
   */
  static async updateShare(
    shareId: string,
    updates: Partial<ShareOptions>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const updateData: any = {}

      if (updates.permissions) {
        updateData.permissions = updates.permissions
      }

      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt ? updates.expiresAt.toISOString() : null
      }

      if (updates.maxDownloads !== undefined) {
        updateData.max_downloads = updates.maxDownloads
      }

      if (updates.password !== undefined) {
        updateData.password_hash = updates.password ? await this.hashPassword(updates.password) : null
      }

      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('shares')
        .update(updateData)
        .eq('id', shareId)
        .eq('shared_by', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating share:', error)
      return { success: false, error: 'Failed to update share' }
    }
  }

  /**
   * Delete/deactivate share
   */
  static async deleteShare(shareId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('shares')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', shareId)
        .eq('shared_by', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting share:', error)
      return { success: false, error: 'Failed to delete share' }
    }
  }

  /**
   * Get sharing statistics
   */
  static async getShareStats(userId?: string): Promise<ShareStats> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return {
          totalShares: 0,
          activeShares: 0,
          expiredShares: 0,
          totalDownloads: 0,
          topSharedFiles: []
        }
      }

      const user = userId ? { id: userId } : await AuthService.getCurrentUser()
      if (!user) {
        return {
          totalShares: 0,
          activeShares: 0,
          expiredShares: 0,
          totalDownloads: 0,
          topSharedFiles: []
        }
      }

      // Get basic stats
      const { data: shares } = await supabase
        .from('shares')
        .select('*, file:files(id, name, original_name)')
        .eq('shared_by', user.id)

      if (!shares) {
        return {
          totalShares: 0,
          activeShares: 0,
          expiredShares: 0,
          totalDownloads: 0,
          topSharedFiles: []
        }
      }

      const now = new Date()
      const activeShares = shares.filter(s => 
        s.is_active && 
        (!s.expires_at || new Date(s.expires_at) > now) &&
        (!s.max_downloads || s.download_count < s.max_downloads)
      ).length

      const expiredShares = shares.filter(s => 
        s.expires_at && new Date(s.expires_at) <= now
      ).length

      const totalDownloads = shares.reduce((sum, s) => sum + (s.download_count || 0), 0)

      // Calculate top shared files
      const fileStats = new Map()
      shares.forEach(share => {
        if (share.file) {
          const fileId = share.file.id
          if (!fileStats.has(fileId)) {
            fileStats.set(fileId, {
              file: share.file,
              shareCount: 0,
              downloadCount: 0
            })
          }
          const stats = fileStats.get(fileId)
          stats.shareCount++
          stats.downloadCount += share.download_count || 0
        }
      })

      const topSharedFiles = Array.from(fileStats.values())
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 10)

      return {
        totalShares: shares.length,
        activeShares,
        expiredShares,
        totalDownloads,
        topSharedFiles
      }
    } catch (error) {
      console.error('Error getting share stats:', error)
      return {
        totalShares: 0,
        activeShares: 0,
        expiredShares: 0,
        totalDownloads: 0,
        topSharedFiles: []
      }
    }
  }

  /**
   * Clean up expired shares
   */
  static async cleanupExpiredShares(): Promise<{ success: boolean; cleanedCount?: number; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return { success: false, error: 'Admin database access not configured' }
      }

      const now = new Date().toISOString()

      const { data: expiredShares, error: selectError } = await supabaseAdmin
        .from('shares')
        .select('id')
        .lt('expires_at', now)
        .eq('is_active', true)

      if (selectError) {
        return { success: false, error: selectError.message }
      }

      if (!expiredShares || expiredShares.length === 0) {
        return { success: true, cleanedCount: 0 }
      }

      const { error: updateError } = await supabaseAdmin
        .from('shares')
        .update({ is_active: false })
        .lt('expires_at', now)
        .eq('is_active', true)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true, cleanedCount: expiredShares.length }
    } catch (error) {
      console.error('Error cleaning up expired shares:', error)
      return { success: false, error: 'Failed to cleanup expired shares' }
    }
  }

  // Private helper methods

  private static async generateShareToken(): Promise<string> {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
  }

  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }

  private static async logActivity(
    userId: string | null,
    action: string,
    fileId: string,
    details: any
  ) {
    try {
      const supabase = getSupabase()
      if (!supabase || !userId) return

      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: 'file_share',
          resource_id: fileId,
          details,
          ip_address: null, // Could be captured from request
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }
}

export default FileSharingService
