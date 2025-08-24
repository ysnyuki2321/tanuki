"use client"

import { useState, useEffect, useCallback } from "react"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  Download, 
  Share2, 
  Eye, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  Folder, 
  File,
  Trash2, 
  Edit, 
  Copy, 
  Move, 
  Star, 
  Clock,
  Users,
  Shield,
  Link,
  X,
  Check,
  AlertTriangle,
  Loader2,
  FolderPlus,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ExternalLink
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatBytes } from "@/lib/utils"

interface UploadProgress {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

interface FileShare {
  id: string
  fileId: string
  shareUrl: string
  password?: string
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  permissions: {
    canView: boolean
    canDownload: boolean
    canShare: boolean
  }
  createdAt: string
}

interface AdvancedFileManagerProps {
  onFileSelect?: (files: FileItem[]) => void
  allowMultipleSelection?: boolean
  showUpload?: boolean
  showShare?: boolean
  showPreview?: boolean
}

export function AdvancedFileManager({ 
  onFileSelect, 
  allowMultipleSelection = true,
  showUpload = true,
  showShare = true,
  showPreview = true
}: AdvancedFileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState("/")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "size" | "modified">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Upload states
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  
  // Preview states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  
  // Share states
  const [shareFile, setShareFile] = useState<FileItem | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareSettings, setShareSettings] = useState({
    password: "",
    expiresAt: "",
    maxDownloads: "",
    allowDownload: true,
    allowShare: false
  })
  
  // New folder state
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const fileService = FileSystemService.getInstance()

  useEffect(() => {
    loadFiles()
  }, [currentPath])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const fileList = await fileService.getFiles(currentPath === "/" ? undefined : currentPath)
      setFiles(fileList)
    } catch (error) {
      console.error("Failed to load files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = useCallback(async (uploadFiles: File[]) => {
    const uploads: UploadProgress[] = uploadFiles.map(file => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'uploading'
    }))
    
    setUploadProgress(prev => [...prev, ...uploads])

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i]
      const uploadId = uploads[i].id

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadProgress(prev => 
            prev.map(up => 
              up.id === uploadId 
                ? { ...up, progress }
                : up
            )
          )
        }

        await fileService.uploadFile(file, currentPath === "/" ? undefined : currentPath)
        
        setUploadProgress(prev => 
          prev.map(up => 
            up.id === uploadId 
              ? { ...up, status: 'completed' }
              : up
          )
        )
      } catch (error) {
        setUploadProgress(prev => 
          prev.map(up => 
            up.id === uploadId 
              ? { ...up, status: 'error', error: 'Upload failed' }
              : up
          )
        )
      }
    }

    // Clean up completed uploads after 3 seconds
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(up => up.status === 'uploading'))
    }, 3000)

    loadFiles()
  }, [currentPath])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="h-8 w-8 text-blue-500" />
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-8 w-8 text-green-500" />
    }
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) {
      return <Video className="h-8 w-8 text-red-500" />
    }
    if (['mp3', 'wav', 'flac', 'm4a'].includes(ext || '')) {
      return <Music className="h-8 w-8 text-purple-500" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive className="h-8 w-8 text-orange-500" />
    }
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext || '')) {
      return <Code className="h-8 w-8 text-indigo-500" />
    }
    
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const handleFileSelect = (fileId: string) => {
    if (allowMultipleSelection) {
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      )
    } else {
      setSelectedFiles([fileId])
    }
  }

  const handleFileOpen = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path)
      setSelectedFiles([])
    } else if (showPreview) {
      setPreviewFile(file)
      setShowPreviewDialog(true)
    }
  }

  const handleFileShare = (file: FileItem) => {
    setShareFile(file)
    setShowShareDialog(true)
  }

  const createShareLink = async () => {
    if (!shareFile) return

    try {
      const shareId = await fileService.shareFile(shareFile.id)
      const shareUrl = `${window.location.origin}/share/${shareId}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      console.log('Share link created and copied to clipboard:', shareUrl)
      setShowShareDialog(false)
      loadFiles() // Refresh to show updated share status
    } catch (error) {
      console.error('Failed to create share link:', error)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const newFolder: FileItem = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        type: 'folder',
        size: 0,
        modifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        path: currentPath === "/" ? `/${newFolderName}` : `${currentPath}/${newFolderName}`,
        parentId: currentPath === "/" ? undefined : currentPath
      }

      // In a real implementation, this would call an API
      console.log('Creating folder:', newFolder)
      
      setNewFolderName("")
      setShowNewFolderDialog(false)
      loadFiles()
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const filteredAndSortedFiles = files
    .filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'modified':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id))

  const renderFilePreview = () => {
    if (!previewFile) return null

    const ext = previewFile.name.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return (
        <div className="max-w-full max-h-96 overflow-hidden rounded-lg">
          <img 
            src={`/api/files/${previewFile.id}/preview`} 
            alt={previewFile.name}
            className="w-full h-auto object-contain"
            onError={(e) => {
              // Fallback for missing image
              e.currentTarget.src = '/placeholder.svg'
            }}
          />
        </div>
      )
    }
    
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) {
      return (
        <video controls className="max-w-full max-h-96 rounded-lg">
          <source src={`/api/files/${previewFile.id}/stream`} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      )
    }
    
    if (['mp3', 'wav', 'flac', 'm4a'].includes(ext || '')) {
      return (
        <audio controls className="w-full">
          <source src={`/api/files/${previewFile.id}/stream`} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      )
    }
    
    if (['txt', 'md', 'json', 'js', 'ts', 'css', 'html'].includes(ext || '')) {
      return (
        <div className="bg-muted p-4 rounded-lg max-h-96 overflow-auto">
          <pre className="text-sm">
            {/* In a real implementation, fetch file content */}
            Loading file content...
          </pre>
        </div>
      )
    }
    
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Preview not available for this file type</p>
        <Button className="mt-4" onClick={() => {
          // In a real implementation, trigger download
          console.log('Downloading file:', previewFile.name)
        }}>
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="space-y-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced File Manager</h3>
          <p className="text-sm text-muted-foreground">
            {currentPath} • {files.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showUpload && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Upload files to {currentPath}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          handleFileUpload(files)
                          setShowUploadDialog(false)
                        }
                      }}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose Files
                      </Button>
                    </label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder in {currentPath}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder()
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploading Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadProgress.map((upload) => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{upload.name}</span>
                    <div className="flex items-center gap-2">
                      {upload.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {upload.status === 'completed' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {upload.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{upload.progress}%</span>
                    </div>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  {upload.error && (
                    <p className="text-xs text-red-500">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="modified">Modified</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedFiles.length > 0 && (
            <Badge variant="secondary">
              {selectedFiles.length} selected
            </Badge>
          )}
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-blue-500">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* File Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" 
          : "space-y-2"
        }>
          {filteredAndSortedFiles.map((file) => (
            <Card 
              key={file.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
              } ${viewMode === 'list' ? 'p-3' : ''}`}
              onClick={() => handleFileSelect(file.id)}
              onDoubleClick={() => handleFileOpen(file)}
            >
              {viewMode === 'grid' ? (
                <CardContent className="p-4 text-center">
                  <div className="mb-3">
                    {getFileIcon(file)}
                  </div>
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === 'folder' ? 'Folder' : formatBytes(file.size)}
                  </p>
                  {file.isShared && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  
                  <div className="flex justify-center gap-1 mt-3">
                    {showPreview && file.type === 'file' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                          setShowPreviewDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {showShare && file.type === 'file' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileShare(file)
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.type === 'folder' ? 'Folder' : formatBytes(file.size)} • 
                        Modified {new Date(file.modifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.isShared && (
                      <Badge variant="outline" className="text-xs">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    
                    <div className="flex gap-1">
                      {showPreview && file.type === 'file' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewFile(file)
                            setShowPreviewDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {showShare && file.type === 'file' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFileShare(file)
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(previewFile)}
              {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              {previewFile && `${formatBytes(previewFile.size)} • Modified ${new Date(previewFile.modifiedAt).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {renderFilePreview()}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Download file
              console.log('Downloading file:', previewFile?.name)
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share File
            </DialogTitle>
            <DialogDescription>
              Create a share link for {shareFile?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="link" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Share Link</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4">
              {shareFile?.isShared ? (
                <div className="space-y-4">
                  <div>
                    <Label>Share URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}/share/${shareFile.shareId}`}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/share/${shareFile.shareId}`)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.open(`${window.location.origin}/share/${shareFile.shareId}`, '_blank')
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Link is active</p>
                      <p className="text-sm text-muted-foreground">Anyone with the link can access this file</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Revoke share link
                        console.log('Revoking share link')
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Share Link</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a secure link that others can use to access this file
                  </p>
                  <Button onClick={createShareLink}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create Share Link
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password Protection</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Optional password"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expires">Expiration Date</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={shareSettings.expiresAt}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="downloads">Maximum Downloads</Label>
                  <Input
                    id="downloads"
                    type="number"
                    placeholder="Unlimited"
                    value={shareSettings.maxDownloads}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, maxDownloads: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-download">Allow Downloads</Label>
                    <Switch
                      id="allow-download"
                      checked={shareSettings.allowDownload}
                      onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, allowDownload: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-share">Allow Re-sharing</Label>
                    <Switch
                      id="allow-share"
                      checked={shareSettings.allowShare}
                      onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, allowShare: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createShareLink}>
              Create Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Callback for selected files */}
      {onFileSelect && selectedFileObjects.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button onClick={() => onFileSelect(selectedFileObjects)}>
            Open Selected ({selectedFileObjects.length})
          </Button>
        </div>
      )}
    </div>
  )
}
