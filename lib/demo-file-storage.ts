// Demo file storage service - works without external dependencies
// Uses browser File API and localStorage for demo purposes

import type { DbFile } from './database-schema'

interface DemoFile extends Omit<DbFile, 'id' | 'created_at' | 'updated_at'> {
  id: string
  created_at: string
  updated_at: string
  file_data?: string // Base64 encoded file data for demo
}

interface FileUploadOptions {
  file: File
  folder?: string
  projectId?: string
  isPublic?: boolean
  tags?: string[]
  onProgress?: (progress: number) => void
}

interface FileUploadResult {
  success: boolean
  file?: DemoFile
  error?: string
  url?: string
}

export class DemoFileStorageService {
  private static readonly STORAGE_KEY = 'tanuki_demo_files'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB demo limit

  // Get demo files from localStorage
  static getDemoFiles(): DemoFile[] {
    if (typeof window === 'undefined') return []

    try {
      const files = localStorage.getItem(this.STORAGE_KEY)
      return files ? JSON.parse(files) : []
    } catch {
      return []
    }
  }

  // Save demo files to localStorage
  static saveDemoFiles(files: DemoFile[]) {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.warn('Failed to save demo files:', error)
    }
  }

  // Upload file (store in localStorage)
  static async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    const { file, folder, projectId, isPublic = false, tags = [], onProgress } = options

    try {
      // Simulate progress
      onProgress?.(10)

      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size exceeds demo limit of ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`
        }
      }

      onProgress?.(30)

      // Get current user (demo)
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' }
      }

      onProgress?.(50)

      // Convert file to base64 for demo storage
      const fileData = await this.fileToBase64(file)
      
      onProgress?.(80)

      // Create file record
      const demoFile: DemoFile = {
        id: `demo-file-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        user_id: currentUser.id,
        tenant_id: currentUser.tenant_id,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        original_name: file.name,
        path: folder ? `${folder}/${file.name}` : file.name,
        size: file.size,
        mime_type: file.type,
        file_type: this.getFileType(file.type),
        extension: file.name.split('.').pop() || null,
        storage_provider: 'demo',
        storage_path: null,
        cdn_url: null,
        processing_status: 'completed',
        compression_status: null,
        virus_scan_status: 'clean',
        is_public: isPublic,
        share_token: null,
        expires_at: null,
        folder_id: null,
        project_id: projectId || null,
        tags: tags.length > 0 ? tags : null,
        version_number: 1,
        parent_version_id: null,
        is_deleted: false,
        deleted_at: null,
        last_accessed: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_data: fileData
      }

      // Save file
      const files = this.getDemoFiles()
      files.push(demoFile)
      this.saveDemoFiles(files)

      onProgress?.(100)

      return {
        success: true,
        file: demoFile,
        url: this.createFileUrl(demoFile.id)
      }
    } catch (error) {
      console.error('Upload error:', error)
      return { success: false, error: 'Failed to upload file' }
    }
  }

  // Download file (return blob URL)
  static async downloadFile(fileId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const files = this.getDemoFiles()
      const file = files.find(f => f.id === fileId && !f.is_deleted)

      if (!file) {
        return { success: false, error: 'File not found' }
      }

      // Check permissions
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' }
      }

      if (file.user_id !== currentUser.id && !file.is_public) {
        return { success: false, error: 'Access denied' }
      }

      // Create blob URL from base64 data
      if (file.file_data) {
        const blob = this.base64ToBlob(file.file_data, file.mime_type || 'application/octet-stream')
        const url = URL.createObjectURL(blob)

        // Update last accessed
        const updatedFiles = files.map(f => 
          f.id === fileId 
            ? { ...f, last_accessed: new Date().toISOString() }
            : f
        )
        this.saveDemoFiles(updatedFiles)

        return { success: true, url }
      }

      return { success: false, error: 'File data not available' }
    } catch (error) {
      console.error('Download error:', error)
      return { success: false, error: 'Failed to download file' }
    }
  }

  // Delete file
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' }
      }

      const files = this.getDemoFiles()
      const file = files.find(f => f.id === fileId)

      if (!file) {
        return { success: false, error: 'File not found' }
      }

      if (file.user_id !== currentUser.id) {
        return { success: false, error: 'Access denied' }
      }

      // Soft delete
      const updatedFiles = files.map(f => 
        f.id === fileId 
          ? { ...f, is_deleted: true, deleted_at: new Date().toISOString() }
          : f
      )

      this.saveDemoFiles(updatedFiles)
      return { success: true }
    } catch (error) {
      console.error('Delete error:', error)
      return { success: false, error: 'Failed to delete file' }
    }
  }

  // List user files
  static async listFiles(options: {
    userId?: string
    folderId?: string
    projectId?: string
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<DemoFile[]> {
    const { userId, folderId, projectId, limit = 50, offset = 0, search } = options

    try {
      let files = this.getDemoFiles().filter(f => !f.is_deleted)

      // Apply filters
      if (userId) {
        files = files.filter(f => f.user_id === userId)
      }

      if (folderId) {
        files = files.filter(f => f.folder_id === folderId)
      }

      if (projectId) {
        files = files.filter(f => f.project_id === projectId)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        files = files.filter(f => 
          f.name.toLowerCase().includes(searchLower) ||
          f.original_name.toLowerCase().includes(searchLower)
        )
      }

      // Sort by created date (newest first)
      files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Apply pagination
      return files.slice(offset, offset + limit)
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }

  // Get storage usage
  static async getStorageUsage(userId: string): Promise<{ used: number; quota: number; fileCount: number }> {
    try {
      const files = this.getDemoFiles().filter(f => f.user_id === userId && !f.is_deleted)
      const used = files.reduce((total, file) => total + (file.size || 0), 0)
      const fileCount = files.length

      return {
        used,
        quota: 1073741824, // 1GB demo quota
        fileCount
      }
    } catch (error) {
      console.error('Storage usage error:', error)
      return { used: 0, quota: 1073741824, fileCount: 0 }
    }
  }

  // Helper methods
  private static async getCurrentUser() {
    // Get current user from demo auth
    const { DemoAuthService } = await import('./demo-auth')
    return await DemoAuthService.getCurrentUser()
  }

  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('text/')) return 'text'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
    return 'other'
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:mime;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  private static createFileUrl(fileId: string): string {
    return `demo://file/${fileId}`
  }

  // Clear all demo files
  static clearDemoFiles(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear demo files:', error)
    }
  }

  // Get demo file preview URL
  static getPreviewUrl(fileId: string): string | null {
    const files = this.getDemoFiles()
    const file = files.find(f => f.id === fileId)
    
    if (!file || !file.file_data) return null

    try {
      const blob = this.base64ToBlob(file.file_data, file.mime_type || 'application/octet-stream')
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }
}

export default DemoFileStorageService
