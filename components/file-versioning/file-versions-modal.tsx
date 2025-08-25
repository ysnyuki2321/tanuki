"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  History,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  GitCompare,
  MoreVertical,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X
} from 'lucide-react'
import { FileVersioningService, type FileVersion } from '@/lib/file-versioning'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

interface FileVersionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
  onVersionRestored?: () => void
}

export function FileVersionsModal({
  open,
  onOpenChange,
  fileId,
  fileName,
  onVersionRestored
}: FileVersionsModalProps) {
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<number[]>([])
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null)
  const [changesDescription, setChangesDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, fileId])

  const loadVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const fileVersions = await FileVersioningService.getFileVersions(fileId)
      setVersions(fileVersions)
    } catch (err) {
      setError('Failed to load file versions')
      console.error('Error loading versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!newVersionFile) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const result = await FileVersioningService.createVersion(
        fileId,
        newVersionFile,
        changesDescription || undefined
      )

      if (result.success) {
        toast.success('New version created successfully')
        setShowCreateVersion(false)
        setNewVersionFile(null)
        setChangesDescription('')
        await loadVersions()
        onVersionRestored?.()
      } else {
        toast.error(result.error || 'Failed to create version')
      }
    } catch (err) {
      toast.error('Failed to create version')
      console.error('Error creating version:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleRestoreVersion = async (versionNumber: number) => {
    setActionLoading(`restore-${versionNumber}`)
    try {
      const result = await FileVersioningService.restoreToVersion(fileId, versionNumber)

      if (result.success) {
        toast.success(`Restored to version ${versionNumber}`)
        await loadVersions()
        onVersionRestored?.()
      } else {
        toast.error(result.error || 'Failed to restore version')
      }
    } catch (err) {
      toast.error('Failed to restore version')
      console.error('Error restoring version:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteVersion = async (versionNumber: number) => {
    setActionLoading(`delete-${versionNumber}`)
    try {
      const result = await FileVersioningService.deleteVersion(fileId, versionNumber)

      if (result.success) {
        toast.success(`Version ${versionNumber} deleted`)
        await loadVersions()
      } else {
        toast.error(result.error || 'Failed to delete version')
      }
    } catch (err) {
      toast.error('Failed to delete version')
      console.error('Error deleting version:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadVersion = async (versionNumber: number) => {
    setActionLoading(`download-${versionNumber}`)
    try {
      const result = await FileVersioningService.downloadVersion(fileId, versionNumber)

      if (result.success && result.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = result.url
        link.download = `${fileName}_v${versionNumber}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Download started')
      } else {
        toast.error(result.error || 'Failed to download version')
      }
    } catch (err) {
      toast.error('Failed to download version')
      console.error('Error downloading version:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare')
      return
    }

    setActionLoading('compare')
    try {
      const [v1, v2] = selectedVersions
      const comparison = await FileVersioningService.compareVersions(fileId, v1, v2)

      if (comparison) {
        const sizeDiff = comparison.sizeDifference
        const timeDiff = formatDistanceToNow(new Date(comparison.oldVersion.created_at))
        
        toast.success(
          `Comparison: Size difference: ${sizeDiff > 0 ? '+' : ''}${formatBytes(Math.abs(sizeDiff))}, ` +
          `Time difference: ${timeDiff}`
        )
      } else {
        toast.error('Failed to compare versions')
      }
    } catch (err) {
      toast.error('Failed to compare versions')
      console.error('Error comparing versions:', err)
    } finally {
      setActionLoading(null)
      setCompareMode(false)
      setSelectedVersions([])
    }
  }

  const toggleVersionSelection = (versionNumber: number) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionNumber)) {
        return prev.filter(v => v !== versionNumber)
      } else if (prev.length < 2) {
        return [...prev, versionNumber]
      } else {
        return [prev[1], versionNumber] // Replace oldest selection
      }
    })
  }

  const getCurrentVersion = () => {
    return versions.find(v => v.version_number === Math.max(...versions.map(v => v.version_number)))
  }

  const currentVersion = getCurrentVersion()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History - {fileName}
          </DialogTitle>
          <DialogDescription>
            Manage and track different versions of your file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateVersion(!showCreateVersion)}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Version
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode)
                  setSelectedVersions([])
                }}
                className="gap-2"
              >
                <GitCompare className="w-4 h-4" />
                {compareMode ? 'Cancel Compare' : 'Compare Versions'}
              </Button>
              
              {compareMode && selectedVersions.length === 2 && (
                <Button
                  size="sm"
                  onClick={handleCompareVersions}
                  disabled={actionLoading === 'compare'}
                  className="gap-2"
                >
                  {actionLoading === 'compare' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GitCompare className="w-4 h-4" />
                  )}
                  Compare Selected
                </Button>
              )}
            </div>
            
            <Badge variant="secondary">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Create Version Form */}
          {showCreateVersion && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Create New Version</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateVersion(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="version-file">Upload File</Label>
                  <Input
                    id="version-file"
                    type="file"
                    onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="changes-desc">Changes Description (Optional)</Label>
                  <Textarea
                    id="changes-desc"
                    placeholder="Describe what changed in this version..."
                    value={changesDescription}
                    onChange={(e) => setChangesDescription(e.target.value)}
                    disabled={uploading}
                    rows={3}
                  />
                </div>
                
                <Button
                  onClick={handleCreateVersion}
                  disabled={!newVersionFile || uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Version...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Create Version
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No versions found</p>
                    <p className="text-sm">Create a new version to get started</p>
                  </div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 space-y-3 transition-colors ${
                        compareMode && selectedVersions.includes(version.version_number)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      } ${
                        version.version_number === currentVersion?.version_number
                          ? 'border-green-500 bg-green-50'
                          : ''
                      }`}
                      onClick={() => compareMode && toggleVersionSelection(version.version_number)}
                      style={{ cursor: compareMode ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Version {version.version_number}
                            </Badge>
                            {version.version_number === currentVersion?.version_number && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Current
                              </Badge>
                            )}
                            {compareMode && selectedVersions.includes(version.version_number) && (
                              <Badge variant="default">
                                Selected
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(version.created_at))} ago
                            </div>
                            
                            {version.creator && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {version.creator.full_name || version.creator.email}
                              </div>
                            )}
                            
                            {version.size && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {formatBytes(version.size)}
                              </div>
                            )}
                          </div>
                          
                          {version.changes_description && (
                            <p className="text-sm bg-muted p-2 rounded">
                              {version.changes_description}
                            </p>
                          )}
                        </div>
                        
                        {!compareMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDownloadVersion(version.version_number)}
                                disabled={actionLoading === `download-${version.version_number}`}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              
                              {version.version_number !== currentVersion?.version_number && (
                                <DropdownMenuItem
                                  onClick={() => handleRestoreVersion(version.version_number)}
                                  disabled={actionLoading === `restore-${version.version_number}`}
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Restore to This Version
                                </DropdownMenuItem>
                              )}
                              
                              <Separator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteVersion(version.version_number)}
                                disabled={
                                  actionLoading === `delete-${version.version_number}` ||
                                  version.version_number === currentVersion?.version_number
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Version
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {(actionLoading === `restore-${version.version_number}` ||
                        actionLoading === `delete-${version.version_number}` ||
                        actionLoading === `download-${version.version_number}`) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Compare Mode Instructions */}
          {compareMode && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p>
                <strong>Compare Mode:</strong> Click on versions to select them for comparison. 
                Select exactly 2 versions to compare.
              </p>
              {selectedVersions.length > 0 && (
                <p className="mt-1">
                  Selected: {selectedVersions.join(', ')} 
                  ({selectedVersions.length}/2)
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FileVersionsModal
