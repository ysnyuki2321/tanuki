import { getSupabase } from './supabase-client'
import { AuthService } from './auth-service'

export interface PreviewOptions {
  maxSize?: number // Maximum file size for preview (bytes)
  quality?: 'low' | 'medium' | 'high'
  width?: number
  height?: number
}

export interface PreviewResult {
  success: boolean
  url?: string
  type?: 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'document' | 'code' | 'archive'
  content?: string // For text files
  metadata?: {
    duration?: number // For video/audio
    pages?: number // For PDF
    dimensions?: { width: number; height: number } // For images
    encoding?: string // For text files
    language?: string // For code files
  }
  error?: string
}

export interface CodeLanguageMapping {
  [extension: string]: string
}

const CODE_LANGUAGES: CodeLanguageMapping = {
  // Web Technologies
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'vue': 'vue',
  'svelte': 'svelte',
  
  // Programming Languages
  'py': 'python',
  'java': 'java',
  'cpp': 'cpp',
  'cxx': 'cpp',
  'cc': 'cpp',
  'c': 'c',
  'h': 'c',
  'hpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'kt': 'kotlin',
  'swift': 'swift',
  'scala': 'scala',
  'r': 'r',
  'jl': 'julia',
  'dart': 'dart',
  
  // Shell & Scripts
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'ps1': 'powershell',
  'bat': 'batch',
  'cmd': 'batch',
  
  // Data & Config
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'ini': 'ini',
  'conf': 'ini',
  'cfg': 'ini',
  
  // Markup & Documentation
  'md': 'markdown',
  'markdown': 'markdown',
  'tex': 'latex',
  'rst': 'rst',
  
  // SQL
  'sql': 'sql',
  'mysql': 'sql',
  'pgsql': 'sql',
  'sqlite': 'sql',
  
  // Other
  'txt': 'plaintext',
  'log': 'log',
  'dockerfile': 'dockerfile',
  'gitignore': 'gitignore',
  'makefile': 'makefile',
  'cmake': 'cmake'
}

const PREVIEWABLE_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
]

const PREVIEWABLE_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv'
]

const PREVIEWABLE_AUDIO_TYPES = [
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/wma'
]

const PREVIEWABLE_TEXT_TYPES = [
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'text/csv',
  'application/json',
  'application/xml',
  'application/javascript'
]

const PREVIEWABLE_DOCUMENT_TYPES = [
  'application/pdf'
]

export class FilePreviewService {
  /**
   * Check if a file can be previewed
   */
  static canPreview(mimeType: string | null, extension: string | null): boolean {
    if (!mimeType && !extension) return false

    // Check by MIME type
    if (mimeType) {
      if (PREVIEWABLE_IMAGE_TYPES.includes(mimeType) ||
          PREVIEWABLE_VIDEO_TYPES.includes(mimeType) ||
          PREVIEWABLE_AUDIO_TYPES.includes(mimeType) ||
          PREVIEWABLE_TEXT_TYPES.includes(mimeType) ||
          PREVIEWABLE_DOCUMENT_TYPES.includes(mimeType)) {
        return true
      }
    }

    // Check by extension for code files
    if (extension) {
      const ext = extension.toLowerCase().replace('.', '')
      if (CODE_LANGUAGES[ext]) {
        return true
      }
    }

    return false
  }

  /**
   * Get preview type from MIME type and extension
   */
  static getPreviewType(mimeType: string | null, extension: string | null): PreviewResult['type'] {
    if (mimeType) {
      if (PREVIEWABLE_IMAGE_TYPES.includes(mimeType)) return 'image'
      if (PREVIEWABLE_VIDEO_TYPES.includes(mimeType)) return 'video'
      if (PREVIEWABLE_AUDIO_TYPES.includes(mimeType)) return 'audio'
      if (mimeType === 'application/pdf') return 'pdf'
      if (PREVIEWABLE_TEXT_TYPES.includes(mimeType)) return 'text'
    }

    if (extension) {
      const ext = extension.toLowerCase().replace('.', '')
      if (CODE_LANGUAGES[ext]) return 'code'
    }

    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return 'archive'

    return 'document'
  }

  /**
   * Get code language from file extension
   */
  static getCodeLanguage(extension: string | null): string {
    if (!extension) return 'plaintext'
    const ext = extension.toLowerCase().replace('.', '')
    return CODE_LANGUAGES[ext] || 'plaintext'
  }

  /**
   * Generate preview for a file
   */
  static async generatePreview(
    fileId: string,
    options: PreviewOptions = {}
  ): Promise<PreviewResult> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get file metadata
      const { data: file, error: fileError } = await (supabase as any)
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !file) {
        return { success: false, error: 'File not found or access denied' }
      }

      // Check if file can be previewed
      if (!this.canPreview(file.mime_type, file.extension)) {
        return { success: false, error: 'File type not supported for preview' }
      }

      // Check file size limits
      const maxSize = options.maxSize || 50 * 1024 * 1024 // 50MB default
      if (file.size && file.size > maxSize) {
        return { success: false, error: 'File too large for preview' }
      }

      const previewType = this.getPreviewType(file.mime_type, file.extension)

      // Generate signed URL for access
      const { data: signedUrlData, error: urlError } = await (supabase as any).storage
        .from('files')
        .createSignedUrl(file.storage_path!, 3600) // 1 hour expiry

      if (urlError) {
        return { success: false, error: urlError.message }
      }

      const result: PreviewResult = {
        success: true,
        url: signedUrlData.signedUrl,
        type: previewType,
        metadata: {}
      }

      // Add specific handling for different preview types
      switch (previewType) {
        case 'text':
        case 'code':
          // Load text content for small files
          if (file.size && file.size < 1024 * 1024) { // Max 1MB for text
            try {
              const response = await fetch(signedUrlData.signedUrl)
              const content = await response.text()
              result.content = content
              
              if (previewType === 'code') {
                result.metadata!.language = this.getCodeLanguage(file.extension)
              }
              
              // Detect encoding
              result.metadata!.encoding = this.detectTextEncoding(content)
            } catch (error) {
              console.warn('Failed to load text content:', error)
            }
          }
          break

        case 'image':
          // For images, we could extract dimensions and other metadata
          result.metadata!.dimensions = await this.getImageDimensions(signedUrlData.signedUrl)
          break

        case 'pdf':
          // For PDFs, we could extract page count and other metadata
          result.metadata!.pages = await this.getPDFPageCount(signedUrlData.signedUrl)
          break

        case 'video':
        case 'audio':
          // For media files, we could extract duration and other metadata
          result.metadata!.duration = await this.getMediaDuration(signedUrlData.signedUrl)
          break
      }

      // Log preview activity
      await this.logPreviewActivity(user.id, fileId, previewType || 'unknown')

      return result
    } catch (error) {
      console.error('Error generating preview:', error)
      return { success: false, error: 'Failed to generate preview' }
    }
  }

  /**
   * Generate thumbnail for images
   */
  static async generateThumbnail(
    fileId: string,
    width: number = 200,
    height: number = 200
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }

      const user = await AuthService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get file metadata
      const { data: file, error: fileError } = await (supabase as any)
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !file) {
        return { success: false, error: 'File not found' }
      }

      // Check if it's an image
      if (!file.mime_type?.startsWith('image/')) {
        return { success: false, error: 'Not an image file' }
      }

      // In a real implementation, you would generate a thumbnail
      // For now, return the original image URL with transform parameters
      const { data: signedUrlData, error: urlError } = await (supabase as any).storage
        .from('files')
        .createSignedUrl(file.storage_path!, 3600, {
          transform: {
            width,
            height,
            resize: 'cover'
          }
        })

      if (urlError) {
        return { success: false, error: urlError.message }
      }

      return { success: true, url: signedUrlData.signedUrl }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return { success: false, error: 'Failed to generate thumbnail' }
    }
  }

  /**
   * Get text content for text files
   */
  static async getTextContent(fileId: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const previewResult = await this.generatePreview(fileId, { maxSize: 5 * 1024 * 1024 }) // 5MB limit
      
      if (!previewResult.success) {
        return { success: false, error: previewResult.error }
      }

      if (previewResult.content) {
        return { success: true, content: previewResult.content }
      }

      // If content wasn't loaded in preview, try to fetch it
      if (previewResult.url) {
        try {
          const response = await fetch(previewResult.url)
          const content = await response.text()
          return { success: true, content }
        } catch (error) {
          return { success: false, error: 'Failed to fetch text content' }
        }
      }

      return { success: false, error: 'No text content available' }
    } catch (error) {
      console.error('Error getting text content:', error)
      return { success: false, error: 'Failed to get text content' }
    }
  }

  // Private helper methods

  private static async getImageDimensions(url: string): Promise<{ width: number; height: number } | undefined> {
    try {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => resolve(undefined)
        img.src = url
      })
    } catch (error) {
      return undefined
    }
  }

  private static async getPDFPageCount(url: string): Promise<number | undefined> {
    try {
      // In a real implementation, you would use PDF.js or similar to extract page count
      // For now, return undefined
      return undefined
    } catch (error) {
      return undefined
    }
  }

  private static async getMediaDuration(url: string): Promise<number | undefined> {
    try {
      return new Promise((resolve) => {
        const media = document.createElement('video')
        media.onloadedmetadata = () => {
          resolve(media.duration)
        }
        media.onerror = () => resolve(undefined)
        media.src = url
        media.load()
      })
    } catch (error) {
      return undefined
    }
  }

  private static detectTextEncoding(content: string): string {
    try {
      // Simple encoding detection
      if (content.includes('\uFFFD')) return 'binary'
      if (content.match(/[\u0080-\uFFFF]/)) return 'utf-8'
      return 'ascii'
    } catch (error) {
      return 'unknown'
    }
  }

  private static async logPreviewActivity(userId: string, fileId: string, previewType: string) {
    try {
      const supabase = getSupabase()
      if (!supabase) return

      await (supabase as any)
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'file.preview',
          resource_type: 'file',
          resource_id: fileId,
          details: {
            previewType
          }
        })
    } catch (error) {
      console.error('Error logging preview activity:', error)
    }
  }
}

export default FilePreviewService
