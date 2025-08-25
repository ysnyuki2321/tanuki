"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Trash2,
  Download,
  Share2,
  FolderOpen,
  Copy,
  Archive,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  Package,
  Users,
  Calendar,
  Shield
} from 'lucide-react'
import type { FileItem } from '@/lib/file-system'
import { formatBytes } from '@/lib/utils'
import { toast } from 'sonner'

interface BulkOperationsProps {
  selectedFiles: string[]
  files: FileItem[]
  onClearSelection: () => void
  onBulkDelete: (fileIds: string[]) => Promise<void>
  onBulkMove: (fileIds: string[], targetFolderId: string) => Promise<void>
  onBulkCopy: (fileIds: string[], targetFolderId: string) => Promise<void>
  onBulkShare: (fileIds: string[], shareOptions: any) => Promise<void>
  onBulkTag: (fileIds: string[], tags: string[]) => Promise<void>
  onBulkDownload: (fileIds: string[]) => Promise<void>
  onBulkArchive: (fileIds: string[], archiveName: string) => Promise<void>
  folders?: FileItem[]
}

interface OperationProgress {
  total: number
  completed: number
  current: string
  errors: string[]
}

export function BulkOperations({
  selectedFiles,
  files,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  onBulkCopy,
  onBulkShare,
  onBulkTag,
  onBulkDownload,
  onBulkArchive,
  folders = []
}: BulkOperationsProps) {
  const [isOperationOpen, setIsOperationOpen] = useState(false)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<OperationProgress | null>(null)
  
  // Operation-specific states
  const [targetFolder, setTargetFolder] = useState('')
  const [shareExpiry, setShareExpiry] = useState('')
  const [sharePassword, setSharePassword] = useState('')
  const [sharePermissions, setSharePermissions] = useState(['read'])
  const [tagsInput, setTagsInput] = useState('')
  const [archiveName, setArchiveName] = useState('')
  const [archiveFormat, setArchiveFormat] = useState('zip')

  const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id))
  const totalSize = selectedFileObjects.reduce((sum, file) => sum + (file.size || 0), 0)
  const fileTypes = [...new Set(selectedFileObjects.map(file => file.type))].filter(Boolean)

  const resetOperationState = () => {
    setActiveOperation(null)
    setIsProcessing(false)
    setProgress(null)
    setTargetFolder('')
    setShareExpiry('')
    setSharePassword('')
    setSharePermissions(['read'])
    setTagsInput('')
    setArchiveName('')
    setArchiveFormat('zip')
  }

  const handleOperationStart = (operation: string) => {
    setActiveOperation(operation)
    setIsOperationOpen(true)
  }

  const handleOperationClose = () => {
    if (!isProcessing) {
      setIsOperationOpen(false)
      resetOperationState()
    }
  }

  const executeWithProgress = async (
    operation: () => Promise<void>,
    operationName: string
  ) => {
    setIsProcessing(true)
    setProgress({
      total: selectedFiles.length,
      completed: 0,
      current: 'Starting...',
      errors: []
    })

    try {
      await operation()
      toast.success(`${operationName} completed successfully`)
      setIsOperationOpen(false)
      onClearSelection()
    } catch (error) {
      toast.error(`${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
      setProgress(null)
      resetOperationState()
    }
  }

  const handleBulkDelete = async () => {
    await executeWithProgress(
      () => onBulkDelete(selectedFiles),
      'Bulk delete'
    )
  }

  const handleBulkMove = async () => {
    if (!targetFolder) {
      toast.error('Please select a target folder')
      return
    }
    
    await executeWithProgress(
      () => onBulkMove(selectedFiles, targetFolder),
      'Bulk move'
    )
  }

  const handleBulkCopy = async () => {
    if (!targetFolder) {
      toast.error('Please select a target folder')
      return
    }
    
    await executeWithProgress(
      () => onBulkCopy(selectedFiles, targetFolder),
      'Bulk copy'
    )
  }

  const handleBulkShare = async () => {
    const shareOptions = {
      permissions: sharePermissions,
      expiresAt: shareExpiry ? new Date(shareExpiry) : null,
      password: sharePassword || null
    }
    
    await executeWithProgress(
      () => onBulkShare(selectedFiles, shareOptions),
      'Bulk share'
    )
  }

  const handleBulkTag = async () => {
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
    if (tags.length === 0) {
      toast.error('Please enter at least one tag')
      return
    }
    
    await executeWithProgress(
      () => onBulkTag(selectedFiles, tags),
      'Bulk tagging'
    )
  }

  const handleBulkDownload = async () => {
    await executeWithProgress(
      () => onBulkDownload(selectedFiles),
      'Bulk download'
    )
  }

  const handleBulkArchive = async () => {
    if (!archiveName) {
      toast.error('Please enter an archive name')
      return
    }
    
    await executeWithProgress(
      () => onBulkArchive(selectedFiles, `${archiveName}.${archiveFormat}`),
      'Bulk archive'
    )
  }

  const renderOperationContent = () => {
    switch (activeOperation) {
      case 'delete':
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} will be permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleOperationClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Files
              </Button>
            </div>
          </div>
        )

      case 'move':
      case 'copy':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Folder</Label>
              <Select value={targetFolder} onValueChange={setTargetFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root Folder</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleOperationClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={activeOperation === 'move' ? handleBulkMove : handleBulkCopy} 
                disabled={isProcessing || !targetFolder}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FolderOpen className="w-4 h-4 mr-2" />}
                {activeOperation === 'move' ? 'Move' : 'Copy'} Files
              </Button>
            </div>
          </div>
        )

      case 'share':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Permissions</Label>
                <Select value={sharePermissions[0]} onValueChange={(value) => setSharePermissions([value])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">View Only</SelectItem>
                    <SelectItem value="download">View & Download</SelectItem>
                    <SelectItem value="edit">View, Download & Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expires (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password Protection (Optional)</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleOperationClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleBulkShare} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                Create Share Links
              </Button>
            </div>
          </div>
        )

      case 'tag':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Textarea
                placeholder="work, important, project-a"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Enter tags separated by commas. These will be added to all selected files.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleOperationClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleBulkTag} disabled={isProcessing || !tagsInput.trim()}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                Add Tags
              </Button>
            </div>
          </div>
        )

      case 'archive':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Archive Name</Label>
                <Input
                  placeholder="my-files"
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={archiveFormat} onValueChange={setArchiveFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zip">ZIP</SelectItem>
                    <SelectItem value="tar">TAR</SelectItem>
                    <SelectItem value="7z">7Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                {selectedFiles.length} files ({formatBytes(totalSize)}) will be compressed into a single archive.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleOperationClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleBulkArchive} disabled={isProcessing || !archiveName}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                Create Archive
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (selectedFiles.length === 0) {
    return null
  }

  return (
    <>
      {/* Bulk Operations Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              {totalSize > 0 && (
                <Badge variant="secondary">
                  {formatBytes(totalSize)} total
                </Badge>
              )}
              
              {fileTypes.length > 0 && (
                <div className="flex gap-1">
                  {fileTypes.slice(0, 3).map(type => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                  {fileTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{fileTypes.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('download')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('share')}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('move')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Move
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('copy')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('tag')}
              >
                <Tag className="w-4 h-4 mr-2" />
                Tag
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('archive')}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationStart('delete')}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Download */}
      {activeOperation === 'download' && (
        <Dialog open={true} onOpenChange={() => setActiveOperation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Files
              </DialogTitle>
              <DialogDescription>
                Download {selectedFiles.length} selected file{selectedFiles.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedFiles.length > 1 ? 
                  'Multiple files will be packaged into a ZIP archive for download.' :
                  'The file will be downloaded directly.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveOperation(null)}>
                Cancel
              </Button>
              <Button onClick={handleBulkDownload} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Download {selectedFiles.length > 1 ? 'as ZIP' : 'File'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Operation Modal */}
      <Dialog open={isOperationOpen} onOpenChange={handleOperationClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeOperation === 'delete' && <Trash2 className="w-5 h-5" />}
              {activeOperation === 'move' && <FolderOpen className="w-5 h-5" />}
              {activeOperation === 'copy' && <Copy className="w-5 h-5" />}
              {activeOperation === 'share' && <Share2 className="w-5 h-5" />}
              {activeOperation === 'tag' && <Tag className="w-5 h-5" />}
              {activeOperation === 'archive' && <Archive className="w-5 h-5" />}
              
              {activeOperation === 'delete' && 'Delete Files'}
              {activeOperation === 'move' && 'Move Files'}
              {activeOperation === 'copy' && 'Copy Files'}
              {activeOperation === 'share' && 'Share Files'}
              {activeOperation === 'tag' && 'Add Tags'}
              {activeOperation === 'archive' && 'Create Archive'}
            </DialogTitle>
            <DialogDescription>
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              {totalSize > 0 && ` (${formatBytes(totalSize)} total)`}
            </DialogDescription>
          </DialogHeader>

          {progress ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress.completed}/{progress.total}</span>
                </div>
                <Progress value={(progress.completed / progress.total) * 100} />
                <p className="text-sm text-muted-foreground">{progress.current}</p>
              </div>
              
              {progress.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.errors.length} error{progress.errors.length !== 1 ? 's' : ''} occurred:
                    <ul className="list-disc list-inside mt-1">
                      {progress.errors.slice(0, 3).map((error, index) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                      {progress.errors.length > 3 && (
                        <li className="text-xs">... and {progress.errors.length - 3} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            renderOperationContent()
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BulkOperations
