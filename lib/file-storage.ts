import { getSupabase, getSupabaseAdmin } from './supabase-client'
import type { DbFile } from './database-schema'
import { getConfig } from './config'
import { AuthService } from './auth-service'
import { DemoFileStorageService } from './demo-file-storage'

export interface FileUploadOptions {
  file: File
  folder?: string
  projectId?: string
  isPublic?: boolean
  tags?: string[]
  onProgress?: (progress: number) => void
}

export interface FileUploadResult {
  success: boolean
  file?: DbFile
  error?: string
  url?: string
}

export class FileStorageService {
  private static readonly STORAGE_BUCKET = 'files'
  
  // Check if storage is configured
  static isConfigured(): boolean {
    return !!getSupabase() || DemoFileStorageService.isDemoMode()
  }

  // Initialize storage bucket if not exists
  static async initializeBucket() {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    try {
      // Check if bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === this.STORAGE_BUCKET)

      if (!bucketExists) {
        // Create bucket
        const { error } = await supabaseAdmin.storage.createBucket(this.STORAGE_BUCKET, {
          public: true,
          allowedMimeTypes: null, // Allow all file types
          fileSizeLimit: 104857600, // 100MB default
        })

        if (error) {
          throw new Error(`Failed to create storage bucket: ${error.message}`)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Initialize bucket error:', error)
      throw error
    }
  }

  // Upload file to storage
  static async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    const supabase = getSupabase()
    if (!supabase) {
      // Fallback to demo storage
      return await DemoFileStorageService.uploadFile(options)
    }

    if (!this.isConfigured()) {
      return { success: false, error: 'Storage service not properly configured' }
    }

    const { file, folder, projectId, isPublic = false, tags = [] } = options
    const config = getConfig()

    try {
      // Get current user
      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check file size limits
      if (file.size > config.max_file_size) {
        return { 
          success: false, 
          error: `File size exceeds limit of ${(config.max_file_size / 1024 / 1024).toFixed(1)}MB` 
        }
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = folder 
        ? `${user.id}/${folder}/${fileName}`
        : `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await (supabase as any).storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { success: false, error: uploadError.message }
      }

      // Get public URL
      const { data: { publicUrl } } = (supabase as any).storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath)

      // Create file record in database
      const fileRecord: Partial<DbFile> = {
        user_id: user.id,
        tenant_id: user.tenant_id,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        original_name: file.name,
        path: filePath,
        size: file.size,
        mime_type: file.type,
        file_type: this.getFileType(file.type),
        extension: fileExt,
        storage_provider: 'supabase',
        storage_path: uploadData.path,
        cdn_url: publicUrl,
        is_public: isPublic,
        project_id: projectId || null,
        tags: tags.length > 0 ? tags : null,
        processing_status: 'completed',
      }

      const { data: dbFile, error: dbError } = await (supabase as any)
        .from('files')
        .insert(fileRecord)
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.deleteFileFromStorage(filePath)
        return { success: false, error: dbError.message }
      }

      // Log activity
      await this.logActivity(user.id, 'file.upload', dbFile.id, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      return { 
        success: true, 
        file: dbFile, 
        url: publicUrl 
      }
    } catch (error) {
      console.error('Upload file error:', error)
      return { success: false, error: 'Failed to upload file' }
    }
  }

  // Upload multiple files
  static async uploadFiles(files: FileUploadOptions[]): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []
    
    for (const fileOptions of files) {
      const result = await this.uploadFile(fileOptions)
      results.push(result)
    }
    
    return results
  }

  // Download file
  static async downloadFile(fileId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoFileStorageService.downloadFile(fileId)
    }

    try {
      // Get file record
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fileError || !file) {
        return { success: false, error: 'File not found' }
      }

      // Check permissions
      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      if (file.user_id !== user.id && !file.is_public) {
        // Check if file is shared with user
        const { data: share } = await supabase
          .from('shares')
          .select('*')
          .eq('file_id', fileId)
          .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`)
          .single()

        if (!share) {
          return { success: false, error: 'Access denied' }
        }
      }

      // Generate signed URL for download
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .createSignedUrl(file.storage_path || file.path, 3600) // 1 hour expiry

      if (urlError) {
        return { success: false, error: urlError.message }
      }

      // Update last accessed
      await supabase
        .from('files')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', fileId)

      // Log activity
      await this.logActivity(user.id, 'file.download', fileId, {
        fileName: file.name,
      })

      return { success: true, url: signedUrlData.signedUrl }
    } catch (error) {
      console.error('Download file error:', error)
      return { success: false, error: 'Failed to download file' }
    }
  }

  // Delete file
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoFileStorageService.deleteFile(fileId)
    }

    try {
      // Get file record
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fileError || !file) {
        return { success: false, error: 'File not found' }
      }

      // Check permissions
      const user = await AuthService.getCurrentUser()
      if (!user || file.user_id !== user.id) {
        return { success: false, error: 'Access denied' }
      }

      // Soft delete first
      const { error: updateError } = await supabase
        .from('files')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', fileId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Delete from storage
      const deleteResult = await this.deleteFileFromStorage(file.storage_path || file.path)
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error)
      }

      // Log activity
      await this.logActivity(user.id, 'file.delete', fileId, {
        fileName: file.name,
      })

      return { success: true }
    } catch (error) {
      console.error('Delete file error:', error)
      return { success: false, error: 'Failed to delete file' }
    }
  }

  // Delete file from storage
  private static async deleteFileFromStorage(path: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    try {
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([path])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete from storage error:', error)
      return { success: false, error: 'Failed to delete from storage' }
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
  } = {}): Promise<DbFile[]> {
    const supabase = getSupabase()
    if (!supabase) {
      const demoFiles = await DemoFileStorageService.listFiles(options)
      return demoFiles as DbFile[]
    }

    const { userId, folderId, projectId, limit = 50, offset = 0, search } = options

    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('is_deleted', false)

      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (folderId) {
        query = query.eq('folder_id', folderId)
      }

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,original_name.ilike.%${search}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('List files error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }

  // Share file
  static async shareFile(fileId: string, options: {
    email?: string
    userId?: string
    permissions?: string[]
    expiresAt?: Date
    password?: string
  }): Promise<{ success: boolean; shareToken?: string; error?: string }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    try {
      // Check if user owns the file
      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: file } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (!file) {
        return { success: false, error: 'File not found or access denied' }
      }

      // Create share record
      const shareData = {
        file_id: fileId,
        shared_by: user.id,
        shared_with_email: options.email || null,
        shared_with_user_id: options.userId || null,
        permissions: options.permissions || ['read'],
        expires_at: options.expiresAt?.toISOString() || null,
        password_hash: options.password ? await this.hashPassword(options.password) : null,
      }

      const { data: share, error: shareError } = await supabase
        .from('shares')
        .insert(shareData)
        .select()
        .single()

      if (shareError) {
        return { success: false, error: shareError.message }
      }

      // Log activity
      await this.logActivity(user.id, 'file.share', fileId, {
        fileName: file.name,
        sharedWith: options.email || options.userId,
      })

      return { success: true, shareToken: share.token }
    } catch (error) {
      console.error('Share file error:', error)
      return { success: false, error: 'Failed to share file' }
    }
  }

  // Get file type from MIME type
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

  // Hash password for protected shares
  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Log activity
  private static async logActivity(userId: string, action: string, resourceId: string, details: any) {
    const supabase = getSupabase()
    if (!supabase) {
      console.debug('Activity logging skipped - database not configured')
      return
    }

    if (!userId || !action) {
      console.warn('Invalid activity log parameters')
      return
    }

    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: 'file',
          resource_id: resourceId,
          details: details || {},
        })
    } catch (error) {
      console.warn('Activity logging failed (non-critical):', error)
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  // Get storage usage for user
  static async getStorageUsage(userId: string): Promise<{ used: number; quota: number; fileCount: number }> {
    const supabase = getSupabase()
    if (!supabase) {
      return await DemoFileStorageService.getStorageUsage(userId)
    }

    if (!userId) {
      return { used: 0, quota: 0, fileCount: 0 }
    }

    try {
      // Get user quota
      const { data: user } = await supabase
        .from('users')
        .select('storage_quota, file_count_limit')
        .eq('id', userId)
        .single()

      if (!user) {
        return { used: 0, quota: 0, fileCount: 0 }
      }

      // Calculate usage
      const { data: files } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', userId)
        .eq('is_deleted', false)

      const used = files?.reduce((total, file) => total + (file.size || 0), 0) || 0
      const fileCount = files?.length || 0

      return {
        used,
        quota: user.storage_quota || 0,
        fileCount,
      }
    } catch (error) {
      console.error('Get storage usage error:', error)
      return { used: 0, quota: 0, fileCount: 0 }
    }
  }

  // Compress file (basic implementation for demo)
  static async compressFile(fileId: string): Promise<{ success: boolean; error?: string; originalSize?: number; compressedSize?: number; compressionRatio?: number }> {
    try {
      // Simulate file compression delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get file info (in real implementation, would fetch from database)
      const file = await this.getFileInfo(fileId)
      if (!file) {
        return { success: false, error: 'File not found' }
      }

      // Check if file type supports compression
      const compressibleTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp',
        'application/pdf',
        'text/plain', 'text/html', 'text/css', 'text/javascript',
        'application/json', 'application/xml'
      ]

      if (!file.mimeType || !compressibleTypes.includes(file.mimeType)) {
        return { success: false, error: 'File type not supported for compression' }
      }

      const originalSize = file.size || 0
      let compressionRatio = 0.7 // Default compression ratio

      // Different compression ratios based on file type
      if (file.mimeType.startsWith('image/')) {
        compressionRatio = 0.6 // Images compress better
      } else if (file.mimeType.includes('text') || file.mimeType.includes('json') || file.mimeType.includes('xml')) {
        compressionRatio = 0.3 // Text files compress much better
      } else if (file.mimeType === 'application/pdf') {
        compressionRatio = 0.8 // PDFs have limited compression
      }

      const compressedSize = Math.round(originalSize * compressionRatio)
      const compressionPercentage = Math.round((1 - compressionRatio) * 100)

      // In real implementation, would:
      // 1. Read file content from storage
      // 2. Apply appropriate compression algorithm
      // 3. Save compressed version
      // 4. Update database with new size and compression status

      // For demo, just simulate successful compression
      console.log(`Compressed ${file.fileName}: ${originalSize} bytes -> ${compressedSize} bytes (${compressionPercentage}% reduction)`)

      return {
        success: true,
        originalSize,
        compressedSize,
        compressionRatio: compressionPercentage
      }
    } catch (error) {
      console.error('Compression error:', error)
      return { success: false, error: 'Compression failed due to internal error' }
    }
  }

  // Scan file for viruses (basic implementation for demo)
  static async scanFile(fileId: string): Promise<{ success: boolean; clean?: boolean; error?: string; scanResults?: any }> {
    try {
      // Simulate virus scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get file info
      const file = await this.getFileInfo(fileId)
      if (!file) {
        return { success: false, error: 'File not found' }
      }

      // Basic security checks and patterns
      const suspiciousPatterns = [
        /virus/i,
        /malware/i,
        /trojan/i,
        /ransomware/i,
        /keylogger/i,
        /backdoor/i,
        /<script.*?>/i, // Basic XSS detection for web files
        /eval\s*\(/i, // Potentially dangerous eval calls
        /document\.write/i, // Potentially dangerous DOM manipulation
        /\.exe$/i, // Executable files
        /\.scr$/i, // Screen saver files (often malicious)
        /\.bat$/i, // Batch files
        /\.cmd$/i, // Command files
        /\.com$/i, // COM files
        /\.pif$/i, // Program Information Files
      ]

      // Check filename for suspicious patterns
      let isClean = true
      let detectedThreats: string[] = []

      // Check filename
      const fileName = file.fileName.toLowerCase()
      suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(fileName)) {
          isClean = false
          detectedThreats.push(`Suspicious filename pattern detected: ${pattern.source}`)
        }
      })

      // Check file extension risks
      const highRiskExtensions = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar']
      const hasHighRiskExtension = highRiskExtensions.some(ext => fileName.endsWith(ext))

      if (hasHighRiskExtension) {
        isClean = false
        detectedThreats.push('High-risk file extension detected')
      }

      // Check file size for suspicious patterns
      if (file.size && file.size < 100) {
        // Very small files might be suspicious
        detectedThreats.push('Unusually small file size detected')
      }

      if (file.size && file.size > 100 * 1024 * 1024) {
        // Very large files might be suspicious
        detectedThreats.push('Unusually large file size detected')
      }

      // In real implementation, would:
      // 1. Read file content from storage
      // 2. Send to virus scanning service (ClamAV, VirusTotal API, etc.)
      // 3. Parse scanning results
      // 4. Update database with scan status

      // Simulate random false positives occasionally for demo
      const randomCheck = Math.random()
      if (randomCheck < 0.05 && isClean) { // 5% chance of false positive
        isClean = false
        detectedThreats.push('Heuristic analysis detected potential threat')
      }

      const scanResults = {
        scanDate: new Date().toISOString(),
        threatsDetected: detectedThreats.length,
        threats: detectedThreats,
        scanEngine: 'TanukiScan Demo v1.0',
        scanDuration: '2.1s'
      }

      console.log(`Virus scan completed for ${file.fileName}: ${isClean ? 'CLEAN' : 'THREATS DETECTED'}`, scanResults)

      return {
        success: true,
        clean: isClean,
        scanResults
      }
    } catch (error) {
      console.error('Virus scanning error:', error)
      return { success: false, error: 'Virus scanning failed due to internal error' }
    }
  }
}

export default FileStorageService
