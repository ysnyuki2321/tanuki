import { supabase, supabaseAdmin, type DbFile } from './supabase'
import { AuthService } from './auth-service'

export interface FileVersion {
  id: string
  file_id: string
  version_number: number
  size: number | null
  storage_path: string | null
  checksum: string | null
  changes_description: string | null
  created_by: string | null
  created_at: string
  file?: DbFile
  creator?: {
    full_name: string | null
    email: string
  }
}

export interface VersionComparison {
  oldVersion: FileVersion
  newVersion: FileVersion
  sizeDifference: number
  timeDifference: number
}

export class FileVersioningService {
  // Create a new version of a file
  static async createVersion(
    fileId: string, 
    newContent: Blob, 
    changesDescription?: string
  ): Promise<{ success: boolean; version?: FileVersion; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get current file
      const { data: currentFile, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !currentFile) {
        return { success: false, error: 'File not found or access denied' }
      }

      // Get current version count
      const { data: versions, error: versionError } = await supabase
        .from('file_versions')
        .select('version_number')
        .eq('file_id', fileId)
        .order('version_number', { ascending: false })
        .limit(1)

      if (versionError) {
        return { success: false, error: 'Failed to get version information' }
      }

      const nextVersionNumber = (versions?.[0]?.version_number || 0) + 1

      // Calculate checksum
      const checksum = await this.calculateChecksum(newContent)

      // Generate storage path for new version
      const fileExt = currentFile.original_name.split('.').pop()
      const versionPath = `${currentFile.path}_v${nextVersionNumber}.${fileExt}`

      // Upload new version to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(versionPath, newContent, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { success: false, error: uploadError.message }
      }

      // Create version record
      const versionData = {
        file_id: fileId,
        version_number: nextVersionNumber,
        size: newContent.size,
        storage_path: uploadData.path,
        checksum,
        changes_description: changesDescription || null,
        created_by: user.id,
      }

      const { data: version, error: versionCreateError } = await supabase
        .from('file_versions')
        .insert(versionData)
        .select()
        .single()

      if (versionCreateError) {
        // Clean up uploaded file
        await supabase.storage.from('files').remove([uploadData.path])
        return { success: false, error: versionCreateError.message }
      }

      // Update main file record
      const { error: updateError } = await supabase
        .from('files')
        .update({
          version_number: nextVersionNumber,
          size: newContent.size,
          storage_path: uploadData.path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId)

      if (updateError) {
        console.warn('Failed to update main file record:', updateError)
      }

      // Log activity
      await this.logVersionActivity(user.id, 'version.create', fileId, {
        versionNumber: nextVersionNumber,
        changesDescription,
      })

      return { success: true, version: version as FileVersion }
    } catch (error) {
      console.error('Error creating version:', error)
      return { success: false, error: 'Failed to create version' }
    }
  }

  // Get all versions of a file
  static async getFileVersions(fileId: string): Promise<FileVersion[]> {
    try {
      if (!supabase) return []

      const user = await AuthService.getCurrentUser()
      if (!user) return []

      // Check if user has access to the file
      const { data: file } = await supabase
        .from('files')
        .select('user_id')
        .eq('id', fileId)
        .single()

      if (!file || file.user_id !== user.id) {
        return []
      }

      const { data: versions, error } = await supabase
        .from('file_versions')
        .select(`
          *,
          creator:users!created_by(full_name, email)
        `)
        .eq('file_id', fileId)
        .order('version_number', { ascending: false })

      if (error) {
        console.error('Error loading versions:', error)
        return []
      }

      return versions as FileVersion[]
    } catch (error) {
      console.error('Error getting file versions:', error)
      return []
    }
  }

  // Restore a file to a specific version
  static async restoreToVersion(
    fileId: string, 
    versionNumber: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get the target version
      const { data: version, error: versionError } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', fileId)
        .eq('version_number', versionNumber)
        .single()

      if (versionError || !version) {
        return { success: false, error: 'Version not found' }
      }

      // Get current file
      const { data: currentFile, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !currentFile) {
        return { success: false, error: 'File not found or access denied' }
      }

      // Download version content
      if (!version.storage_path) {
        return { success: false, error: 'Version storage path not found' }
      }

      const { data: versionData, error: downloadError } = await supabase.storage
        .from('files')
        .download(version.storage_path)

      if (downloadError || !versionData) {
        return { success: false, error: 'Failed to download version content' }
      }

      // Create new version from current state before restoring
      await this.createVersion(
        fileId, 
        versionData, 
        `Restored to version ${versionNumber}`
      )

      // Update main file to point to restored version
      const { error: updateError } = await supabase
        .from('files')
        .update({
          storage_path: version.storage_path,
          size: version.size,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log activity
      await this.logVersionActivity(user.id, 'version.restore', fileId, {
        restoredToVersion: versionNumber,
      })

      return { success: true }
    } catch (error) {
      console.error('Error restoring version:', error)
      return { success: false, error: 'Failed to restore version' }
    }
  }

  // Delete a specific version
  static async deleteVersion(
    fileId: string, 
    versionNumber: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check if user owns the file
      const { data: file } = await supabase
        .from('files')
        .select('user_id')
        .eq('id', fileId)
        .single()

      if (!file || file.user_id !== user.id) {
        return { success: false, error: 'Access denied' }
      }

      // Get the version to delete
      const { data: version, error: versionError } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', fileId)
        .eq('version_number', versionNumber)
        .single()

      if (versionError || !version) {
        return { success: false, error: 'Version not found' }
      }

      // Delete from storage
      if (version.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([version.storage_path])

        if (storageError) {
          console.warn('Failed to delete version from storage:', storageError)
        }
      }

      // Delete version record
      const { error: deleteError } = await supabase
        .from('file_versions')
        .delete()
        .eq('id', version.id)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      // Log activity
      await this.logVersionActivity(user.id, 'version.delete', fileId, {
        deletedVersion: versionNumber,
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting version:', error)
      return { success: false, error: 'Failed to delete version' }
    }
  }

  // Compare two versions
  static async compareVersions(
    fileId: string, 
    version1: number, 
    version2: number
  ): Promise<VersionComparison | null> {
    try {
      if (!supabase) return null

      const user = await AuthService.getCurrentUser()
      if (!user) return null

      // Get both versions
      const { data: versions, error } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', fileId)
        .in('version_number', [version1, version2])

      if (error || !versions || versions.length !== 2) {
        return null
      }

      const v1 = versions.find(v => v.version_number === version1)
      const v2 = versions.find(v => v.version_number === version2)

      if (!v1 || !v2) return null

      const oldVersion = v1.version_number < v2.version_number ? v1 : v2
      const newVersion = v1.version_number < v2.version_number ? v2 : v1

      const sizeDifference = (newVersion.size || 0) - (oldVersion.size || 0)
      const timeDifference = new Date(newVersion.created_at).getTime() - new Date(oldVersion.created_at).getTime()

      return {
        oldVersion: oldVersion as FileVersion,
        newVersion: newVersion as FileVersion,
        sizeDifference,
        timeDifference,
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      return null
    }
  }

  // Get version content for download
  static async downloadVersion(
    fileId: string, 
    versionNumber: number
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check file access
      const { data: file } = await supabase
        .from('files')
        .select('user_id')
        .eq('id', fileId)
        .single()

      if (!file || file.user_id !== user.id) {
        return { success: false, error: 'Access denied' }
      }

      // Get version
      const { data: version, error: versionError } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', fileId)
        .eq('version_number', versionNumber)
        .single()

      if (versionError || !version || !version.storage_path) {
        return { success: false, error: 'Version not found' }
      }

      // Generate signed URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('files')
        .createSignedUrl(version.storage_path, 3600) // 1 hour expiry

      if (urlError) {
        return { success: false, error: urlError.message }
      }

      return { success: true, url: signedUrlData.signedUrl }
    } catch (error) {
      console.error('Error downloading version:', error)
      return { success: false, error: 'Failed to download version' }
    }
  }

  // Calculate file checksum
  private static async calculateChecksum(file: Blob): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const hash = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hash))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.error('Error calculating checksum:', error)
      return ''
    }
  }

  // Log versioning activity
  private static async logVersionActivity(
    userId: string, 
    action: string, 
    fileId: string, 
    details: any
  ) {
    if (!supabase) return

    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: 'file_version',
          resource_id: fileId,
          details,
        })
    } catch (error) {
      console.error('Error logging version activity:', error)
    }
  }

  // Clean up old versions (keep only last N versions)
  static async cleanupOldVersions(
    fileId: string, 
    keepCount: number = 10
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check file access
      const { data: file } = await supabase
        .from('files')
        .select('user_id')
        .eq('id', fileId)
        .single()

      if (!file || file.user_id !== user.id) {
        return { success: false, error: 'Access denied' }
      }

      // Get all versions
      const { data: versions, error: versionsError } = await supabase
        .from('file_versions')
        .select('*')
        .eq('file_id', fileId)
        .order('version_number', { ascending: false })

      if (versionsError) {
        return { success: false, error: versionsError.message }
      }

      if (!versions || versions.length <= keepCount) {
        return { success: true, deletedCount: 0 }
      }

      // Delete old versions
      const versionsToDelete = versions.slice(keepCount)
      const storagePathsToDelete = versionsToDelete
        .map(v => v.storage_path)
        .filter(Boolean) as string[]

      // Delete from storage
      if (storagePathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(storagePathsToDelete)

        if (storageError) {
          console.warn('Failed to delete some versions from storage:', storageError)
        }
      }

      // Delete from database
      const versionIdsToDelete = versionsToDelete.map(v => v.id)
      const { error: deleteError } = await supabase
        .from('file_versions')
        .delete()
        .in('id', versionIdsToDelete)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      return { success: true, deletedCount: versionsToDelete.length }
    } catch (error) {
      console.error('Error cleaning up versions:', error)
      return { success: false, error: 'Failed to cleanup versions' }
    }
  }
}

export default FileVersioningService
