"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileItem } from "@/lib/file-system"
import { 
  Download, 
  Share2, 
  Edit3, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  FileCode,
  Archive,
  X
} from "lucide-react"
import { useState } from "react"

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: FileItem
  onEdit?: (file: FileItem) => void
  onShare?: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
}

export function FilePreviewModal({ 
  isOpen, 
  onClose, 
  file, 
  onEdit, 
  onShare, 
  onDownload 
}: FilePreviewModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="w-8 h-8 text-muted-foreground" />
    
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Play className="w-8 h-8 text-red-500" />
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript')) 
      return <FileCode className="w-8 h-8 text-green-500" />
    if (mimeType.includes('zip') || mimeType.includes('archive')) 
      return <Archive className="w-8 h-8 text-orange-500" />
    
    return <FileText className="w-8 h-8 text-muted-foreground" />
  }

  const renderFilePreview = () => {
    if (!file.mimeType) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {getFileIcon(file.mimeType)}
          <p className="text-muted-foreground mt-4">Preview not available</p>
        </div>
      )
    }

    // Image preview
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
          {isImageLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <img
            src={`/api/files/${file.id}/preview`}
            alt={file.name}
            className={`max-h-96 max-w-full object-contain rounded ${isImageLoading ? 'hidden' : ''}`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
      )
    }

    // Video preview
    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="bg-muted/30 rounded-lg p-4">
          <video
            controls
            className="w-full max-h-96 rounded"
            src={`/api/files/${file.id}/preview`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Audio preview
    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <audio
            controls
            className="w-full"
            src={`/api/files/${file.id}/preview`}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    // Text/Code preview
    if (
      file.mimeType.includes('text') || 
      file.mimeType.includes('json') || 
      file.mimeType.includes('javascript') ||
      file.mimeType.includes('markdown') ||
      file.content
    ) {
      return (
        <div className="bg-muted/30 rounded-lg p-4">
          <ScrollArea className="h-96">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {file.content || 'Content preview not available'}
            </pre>
          </ScrollArea>
        </div>
      )
    }

    // PDF preview placeholder
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">PDF Preview</p>
          <p className="text-sm text-muted-foreground mt-2">
            PDF preview would be implemented with a PDF viewer library
          </p>
        </div>
      )
    }

    // Default preview
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg">
        {getFileIcon(file.mimeType)}
        <p className="text-muted-foreground mt-4">Preview not available for this file type</p>
        <Badge variant="outline" className="mt-2">
          {file.mimeType}
        </Badge>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(file.mimeType)}
              <div>
                <DialogTitle className="text-xl">{file.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {formatFileSize(file.size)}
                  </Badge>
                  {file.mimeType && (
                    <Badge variant="outline">
                      {file.mimeType}
                    </Badge>
                  )}
                  {file.isShared && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Shared
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(file)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onShare && (
                <Button variant="outline" size="sm" onClick={() => onShare(file)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {renderFilePreview()}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>Created: {new Date(file.createdAt).toLocaleString()}</p>
          <p>Modified: {new Date(file.modifiedAt).toLocaleString()}</p>
          <p>Path: {file.path}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
