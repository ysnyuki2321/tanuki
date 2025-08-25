"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  Copy,
  Code,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RefreshCw,
  Search,
  Settings
} from 'lucide-react'
import { FilePreviewService, type PreviewResult } from '@/lib/file-preview-service'
import type { DbFile } from '@/lib/database-schema'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

interface AdvancedFilePreviewProps {
  file: DbFile | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (file: DbFile) => void
  onShare?: (file: DbFile) => void
  onEdit?: (file: DbFile) => void
  onDelete?: (file: DbFile) => void
  onVersionHistory?: (file: DbFile) => void
}

export function AdvancedFilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onVersionHistory
}: AdvancedFilePreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Image/Video controls
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // PDF controls
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfScale, setPdfScale] = useState(1)

  // Code/Text controls
  const [textSearch, setTextSearch] = useState('')
  const [highlightedText, setHighlightedText] = useState('')
  const [lineNumbers, setLineNumbers] = useState(true)
  const [wordWrap, setWordWrap] = useState(true)
  const [activeTab, setActiveTab] = useState('preview')

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewData(null)
      setError(null)
      resetControls()
      return
    }

    loadPreview()
  }, [file, isOpen])

  const resetControls = () => {
    setZoom(1)
    setRotation(0)
    setIsPlaying(false)
    setIsMuted(false)
    setVolume(1)
    setCurrentPage(1)
    setPdfScale(1)
    setTextSearch('')
    setHighlightedText('')
    setActiveTab('preview')
  }

  const loadPreview = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await FilePreviewService.generatePreview(file.id, {
        maxSize: 100 * 1024 * 1024, // 100MB
        quality: 'high'
      })

      if (result.success) {
        setPreviewData(result)
      } else {
        setError(result.error || 'Failed to load preview')
      }
    } catch (err) {
      console.error('Preview load error:', err)
      setError('Failed to load file preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoomIn = () => setZoom(Math.min(5, zoom + 0.25))
  const handleZoomOut = () => setZoom(Math.max(0.1, zoom - 0.25))
  const handleRotate = () => setRotation((rotation + 90) % 360)
  const handleResetView = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleCopyContent = () => {
    if (previewData?.content) {
      navigator.clipboard.writeText(previewData.content)
      toast.success('Content copied to clipboard')
    }
  }

  const handleTextSearch = (searchTerm: string) => {
    setTextSearch(searchTerm)
    if (searchTerm && previewData?.content) {
      const regex = new RegExp(searchTerm, 'gi')
      const highlighted = previewData.content.replace(regex, (match) => `<mark>${match}</mark>`)
      setHighlightedText(highlighted)
    } else {
      setHighlightedText('')
    }
  }

  const getFileTypeIcon = (type: PreviewResult['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      case 'text':
      case 'code': return <Code className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'archive': return <Archive className="w-5 h-5" />
      default: return <File className="w-5 h-5" />
    }
  }

  const renderImagePreview = () => {
    if (!previewData?.url) return null

    return (
      <div className="space-y-4">
        {/* Image Controls */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>

        {/* Image Display */}
        <div className="flex justify-center overflow-auto">
          <img
            src={previewData.url}
            alt={file?.original_name}
            className="max-w-none transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: isFullscreen ? '90vh' : '60vh'
            }}
            onError={() => setError('Failed to load image')}
          />
        </div>

        {/* Image Metadata */}
        {previewData.metadata?.dimensions && (
          <div className="text-center text-sm text-muted-foreground">
            {previewData.metadata.dimensions.width} × {previewData.metadata.dimensions.height} pixels
          </div>
        )}
      </div>
    )
  }

  const renderVideoPreview = () => {
    if (!previewData?.url) return null

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <video
            ref={videoRef}
            src={previewData.url}
            controls
            className="max-w-full max-h-[60vh]"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={(e) => {
              const video = e.target as HTMLVideoElement
              setVolume(video.volume)
              setIsMuted(video.muted)
            }}
          >
            Your browser does not support video playback.
          </video>
        </div>
        
        {previewData.metadata?.duration && (
          <div className="text-center text-sm text-muted-foreground">
            Duration: {Math.round(previewData.metadata.duration)}s
          </div>
        )}
      </div>
    )
  }

  const renderAudioPreview = () => {
    if (!previewData?.url) return null

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Music className="w-16 h-16 text-muted-foreground" />
          <audio
            ref={audioRef}
            src={previewData.url}
            controls
            className="w-full max-w-md"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support audio playback.
          </audio>
        </div>

        {previewData.metadata?.duration && (
          <div className="text-center text-sm text-muted-foreground">
            Duration: {Math.round(previewData.metadata.duration)}s
          </div>
        )}
      </div>
    )
  }

  const renderTextPreview = () => {
    if (!previewData?.content) return null

    const content = highlightedText || previewData.content
    const isCode = previewData.type === 'code'

    return (
      <div className="space-y-4">
        {/* Text Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search in text..."
              value={textSearch}
              onChange={(e) => handleTextSearch(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
          </div>

          {isCode && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lineNumbers}
                  onChange={(e) => setLineNumbers(e.target.checked)}
                />
                Line numbers
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wordWrap}
                  onChange={(e) => setWordWrap(e.target.checked)}
                />
                Word wrap
              </label>
            </>
          )}

          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>

        {/* Language Badge for Code */}
        {isCode && previewData.metadata?.language && (
          <Badge variant="secondary">
            {previewData.metadata.language}
          </Badge>
        )}

        {/* Text Content */}
        <ScrollArea className="h-[60vh] w-full border rounded-md p-4">
          <pre 
            className={`text-sm font-mono whitespace-pre-wrap ${
              wordWrap ? 'break-words' : ''
            } ${lineNumbers && isCode ? 'pl-12' : ''}`}
            style={{
              counterReset: lineNumbers ? 'line-number' : 'none'
            }}
          >
            {highlightedText ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              content
            )}
          </pre>
        </ScrollArea>

        {/* Text Metadata */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Characters: {previewData.content.length.toLocaleString()}</div>
          <div>Lines: {previewData.content.split('\n').length.toLocaleString()}</div>
          {previewData.metadata?.encoding && (
            <div>Encoding: {previewData.metadata.encoding}</div>
          )}
        </div>
      </div>
    )
  }

  const renderPDFPreview = () => {
    if (!previewData?.url) return null

    return (
      <div className="space-y-4">
        {/* PDF Controls */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} {previewData.metadata?.pages && `of ${previewData.metadata.pages}`}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!!previewData.metadata?.pages && currentPage >= previewData.metadata.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="outline" size="sm" onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(pdfScale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setPdfScale(Math.min(3, pdfScale + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="flex justify-center">
          <embed
            src={`${previewData.url}#page=${currentPage}&zoom=${Math.round(pdfScale * 100)}`}
            type="application/pdf"
            className="w-full h-[60vh] border rounded"
          />
        </div>

        {/* Fallback for browsers that don't support PDF embed */}
        <div className="text-center">
          <Button onClick={() => onDownload?.(file!)}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    )
  }

  const renderArchivePreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Archive className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Archive file</p>
        <p className="text-sm text-muted-foreground mb-4">
          {file?.original_name}
        </p>
        <div className="space-y-2">
          <Button onClick={() => onDownload?.(file!)}>
            <Download className="w-4 h-4 mr-2" />
            Download Archive
          </Button>
          {/* In the future, could integrate ZIP preview functionality */}
        </div>
      </div>
    )
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    if (!previewData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Eye className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Preview not available</p>
        </div>
      )
    }

    switch (previewData.type) {
      case 'image': return renderImagePreview()
      case 'video': return renderVideoPreview()
      case 'audio': return renderAudioPreview()
      case 'text':
      case 'code': return renderTextPreview()
      case 'pdf': return renderPDFPreview()
      case 'archive': return renderArchivePreview()
      default: return renderArchivePreview()
    }
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previewData && getFileTypeIcon(previewData.type)}
              <div>
                <DialogTitle className="text-left">{file.original_name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{previewData?.type || file.file_type || 'unknown'}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {file.size ? formatBytes(file.size) : 'Unknown size'}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1">
            <Card className="h-full">
              <CardContent className="p-6">
                {renderPreview()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="flex-1">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">File Information</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-mono break-all">{file.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <p>{file.size ? formatBytes(file.size) : 'Unknown size'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p>{file.mime_type || 'unknown'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Extension:</span>
                    <p>{file.extension || 'none'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{new Date(file.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <p>{new Date(file.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                {previewData?.metadata && Object.keys(previewData.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Preview Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {previewData.metadata.dimensions && (
                          <div>
                            <span className="text-muted-foreground">Dimensions:</span>
                            <p>{previewData.metadata.dimensions.width} × {previewData.metadata.dimensions.height}</p>
                          </div>
                        )}
                        {previewData.metadata.duration && (
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p>{Math.round(previewData.metadata.duration)}s</p>
                          </div>
                        )}
                        {previewData.metadata.pages && (
                          <div>
                            <span className="text-muted-foreground">Pages:</span>
                            <p>{previewData.metadata.pages}</p>
                          </div>
                        )}
                        {previewData.metadata.language && (
                          <div>
                            <span className="text-muted-foreground">Language:</span>
                            <p>{previewData.metadata.language}</p>
                          </div>
                        )}
                        {previewData.metadata.encoding && (
                          <div>
                            <span className="text-muted-foreground">Encoding:</span>
                            <p>{previewData.metadata.encoding}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="flex-1">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">File Actions</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => onDownload?.(file)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => onShare?.(file)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>

                  {(previewData?.type === 'text' || previewData?.type === 'code') && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => onEdit?.(file)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => onVersionHistory?.(file)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Version History
                  </Button>

                  <Button
                    variant="destructive"
                    className="justify-start sm:col-span-2"
                    onClick={() => onDelete?.(file)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AdvancedFilePreview
