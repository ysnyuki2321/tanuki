"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  Eye,
  X,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import type { DbFile } from '@/lib/database-schema'
import { FileStorageService } from '@/lib/file-storage'
import { DemoFileStorageService } from '@/lib/demo-file-storage'
import { isSupabaseConfigured } from '@/lib/supabase-client'
import { toast } from 'sonner'

interface FilePreviewProps {
  file: DbFile | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (file: DbFile) => void
  onShare?: (file: DbFile) => void
  onEdit?: (file: DbFile) => void
  onDelete?: (file: DbFile) => void
}

export function EnhancedFilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onEdit,
  onDelete
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [textContent, setTextContent] = useState<string | null>(null)
  
  // Load preview URL when file changes
  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewUrl(null)
      setTextContent(null)
      setError(null)
      return
    }

    loadPreview()
  }, [file, isOpen])

  const loadPreview = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if using demo mode
      const isDemoMode = !isSupabaseConfigured()
      
      if (isDemoMode) {
        // Get demo preview URL
        const url = DemoFileStorageService.getPreviewUrl(file.id)
        if (url) {
          setPreviewUrl(url)
          
          // Load text content for text files
          if (file.file_type === 'text' && file.size && file.size < 1024 * 1024) { // Max 1MB for text preview
            try {
              const response = await fetch(url)
              const text = await response.text()
              setTextContent(text)
            } catch (error) {
              console.warn('Failed to load text content:', error)
            }
          }
        } else {
          setError('Preview not available in demo mode')
        }
      } else {
        // Get real file download URL
        const result = await FileStorageService.downloadFile(file.id)
        if (result.success && result.url) {
          setPreviewUrl(result.url)
        } else {
          setError(result.error || 'Failed to load preview')
        }
      }
    } catch (error) {
      console.error('Preview load error:', error)
      setError('Failed to load file preview')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      case 'document': return <FileText className="w-5 h-5" />
      case 'archive': return <Archive className="w-5 h-5" />
      case 'text': return <Code className="w-5 h-5" />
      default: return <File className="w-5 h-5" />
    }
  }

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading preview...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Eye className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadPreview}>
            Try Again
          </Button>
        </div>
      )
    }

    if (!previewUrl || !file) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Eye className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Preview not available</p>
        </div>
      )
    }

    switch (file.file_type) {
      case 'image':
        return (
          <div className="relative">
            <div className="flex items-center justify-center mb-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.max(0.25, imageZoom - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm">{Math.round(imageZoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.min(4, imageZoom + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageRotation((imageRotation + 90) % 360)}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt={file.original_name}
                className="max-w-full max-h-96 object-contain transition-transform"
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`
                }}
              />
            </div>
          </div>
        )

      case 'video':
        return (
          <div className="flex justify-center">
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-96"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support video playback.
            </video>
          </div>
        )

      case 'audio':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Music className="w-16 h-16 text-muted-foreground" />
            <audio
              src={previewUrl}
              controls
              className="w-full max-w-md"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            {textContent ? (
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {textContent}
                </pre>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-96">
                <Code className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Text file preview</p>
                <Button onClick={() => onDownload?.(file)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        )

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Document preview</p>
            <p className="text-sm text-muted-foreground mb-4">
              {file.original_name}
            </p>
            <Button onClick={() => onDownload?.(file)}>
              <Download className="w-4 h-4 mr-2" />
              Download to view
            </Button>
          </div>
        )

      case 'archive':
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <Archive className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Archive file</p>
            <p className="text-sm text-muted-foreground mb-4">
              {file.original_name}
            </p>
            <Button onClick={() => onDownload?.(file)}>
              <Download className="w-4 h-4 mr-2" />
              Download to extract
            </Button>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <File className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">File preview not available</p>
            <p className="text-sm text-muted-foreground mb-4">
              {file.original_name}
            </p>
            <Button onClick={() => onDownload?.(file)}>
              <Download className="w-4 h-4 mr-2" />
              Download file
            </Button>
          </div>
        )
    }
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(file.file_type)}
              <div>
                <DialogTitle className="text-left">{file.original_name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{file.file_type || 'unknown'}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  {file.is_public && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Preview Area */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-6">
                {renderPreview()}
              </CardContent>
            </Card>
          </div>

          {/* File Info Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">File Information</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-mono">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{file.mime_type || 'unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(file.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  {file.last_accessed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last accessed:</span>
                      <span>{format(new Date(file.last_accessed), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>

                {file.tags && file.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onDownload?.(file)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onShare?.(file)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>

                  {file.file_type === 'text' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onEdit?.(file)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => onDelete?.(file)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedFilePreview
