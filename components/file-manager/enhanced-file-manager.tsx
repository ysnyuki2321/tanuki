"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Grid3X3, 
  List, 
  Upload, 
  FolderPlus, 
  Loader2, 
  AlertCircle,
  CheckSquare,
  Square,
  Minus
} from 'lucide-react'
import { FileSystemService, type FileItem } from '@/lib/file-system'
import { FileSharingService } from '@/lib/file-sharing-service'
import { FileGrid } from './file-grid'
import { FileList } from './file-list'
import { FileUploadZone } from './file-upload-zone'
import { Breadcrumb } from './breadcrumb'
import { AdvancedSearch, type SearchFilters } from './advanced-search'
import { BulkOperations } from './bulk-operations'
import { AdvancedFilePreview } from '@/components/file-preview/advanced-file-preview'
import { ShareFileModal } from '@/components/file-sharing/share-file-modal'
import { VersionHistoryButton } from '@/components/file-versioning/version-history-button'
import { toast } from 'sonner'

interface EnhancedFileManagerProps {
  initialFolderId?: string
  onSelectionChange?: (selectedFiles: string[]) => void
  multiSelectMode?: boolean
  showBulkOperations?: boolean
  showAdvancedSearch?: boolean
}

export function EnhancedFileManager({
  initialFolderId,
  onSelectionChange,
  multiSelectMode = true,
  showBulkOperations = true,
  showAdvancedSearch = true
}: EnhancedFileManagerProps) {
  // File management state
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FileItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(initialFolderId)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<'none' | 'some' | 'all'>('none')

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Search state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    fileTypes: [],
    sizeRange: { min: null, max: null, unit: 'MB' },
    dateRange: { from: null, to: null },
    isShared: null,
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])

  // Modal state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [shareFile, setShareFile] = useState<FileItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Load files when folder changes
  useEffect(() => {
    loadFiles(currentFolderId)
  }, [currentFolderId])

  // Update selection mode based on selected files
  useEffect(() => {
    const totalSelectableFiles = files.filter(f => f.type !== 'folder').length
    
    if (selectedFiles.length === 0) {
      setSelectionMode('none')
    } else if (selectedFiles.length === totalSelectableFiles && totalSelectableFiles > 0) {
      setSelectionMode('all')
    } else {
      setSelectionMode('some')
    }

    onSelectionChange?.(selectedFiles)
  }, [selectedFiles, files, onSelectionChange])

  // Apply search filters
  useEffect(() => {
    applyFilters()
  }, [files, searchFilters])

  const loadFiles = async (folderId?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fileList = await FileSystemService.getFiles(folderId)
      setFiles(fileList)
      
      // Separate folders for bulk operations
      const folderList = fileList.filter(item => item.type === 'folder')
      setFolders(folderList)
      
      // Clear selection when changing folders
      setSelectedFiles([])
    } catch (err) {
      console.error('Failed to load files:', err)
      setError('Failed to load files')
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...files]

    // Apply search query
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase()
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.type?.toLowerCase().includes(query) ||
        file.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply file type filters
    if (searchFilters.fileTypes.length > 0) {
      filtered = filtered.filter(file => 
        searchFilters.fileTypes.includes(file.type || 'unknown')
      )
    }

    // Apply size filters
    if (searchFilters.sizeRange.min !== null || searchFilters.sizeRange.max !== null) {
      const { min, max, unit } = searchFilters.sizeRange
      const minBytes = min ? min * (unit === 'KB' ? 1024 : unit === 'MB' ? 1024 * 1024 : 1024 * 1024 * 1024) : 0
      const maxBytes = max ? max * (unit === 'KB' ? 1024 : unit === 'MB' ? 1024 * 1024 : 1024 * 1024 * 1024) : Infinity

      filtered = filtered.filter(file => {
        const size = file.size || 0
        return size >= minBytes && size <= maxBytes
      })
    }

    // Apply date filters
    if (searchFilters.dateRange.from || searchFilters.dateRange.to) {
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.modifiedAt || file.createdAt)
        const fromDate = searchFilters.dateRange.from
        const toDate = searchFilters.dateRange.to

        if (fromDate && fileDate < fromDate) return false
        if (toDate && fileDate > toDate) return false
        return true
      })
    }

    // Apply share status filter
    if (searchFilters.isShared !== null) {
      filtered = filtered.filter(file => {
        const isShared = !!(file as any).shareToken || !!(file as any).isShared
        return searchFilters.isShared ? isShared : !isShared
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (searchFilters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'size':
          aValue = a.size || 0
          bValue = b.size || 0
          break
        case 'modified':
          aValue = new Date(a.modifiedAt || a.createdAt)
          bValue = new Date(b.modifiedAt || b.createdAt)
          break
        case 'created':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return searchFilters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return searchFilters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Folders first, then files
    const sortedFiltered = [
      ...filtered.filter(item => item.type === 'folder'),
      ...filtered.filter(item => item.type !== 'folder')
    ]

    setFilteredFiles(sortedFiltered)
  }, [files, searchFilters])

  // Selection handlers
  const handleSelectAll = () => {
    const selectableFiles = filteredFiles.filter(f => f.type !== 'folder').map(f => f.id)
    if (selectionMode === 'all') {
      setSelectedFiles([])
    } else {
      setSelectedFiles(selectableFiles)
    }
  }

  const handleFileSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedFiles(prev => [...prev, fileId])
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    }
  }

  const clearSelection = () => {
    setSelectedFiles([])
  }

  // File operations
  const handleFileOpen = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentFolderId(file.id)
    } else {
      setPreviewFile(file)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      await FileSystemService.deleteFile(fileId)
      await loadFiles(currentFolderId)
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const handleFileShare = (file: FileItem) => {
    setShareFile(file)
  }

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true)
    try {
      await FileSystemService.uploadFiles(files, currentFolderId)
      await loadFiles(currentFolderId)
      toast.success(`${files.length} file(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  // Bulk operations
  const handleBulkDelete = async (fileIds: string[]) => {
    try {
      await Promise.all(fileIds.map(id => FileSystemService.deleteFile(id)))
      await loadFiles(currentFolderId)
      toast.success(`${fileIds.length} files deleted successfully`)
    } catch (error) {
      throw new Error('Failed to delete some files')
    }
  }

  const handleBulkMove = async (fileIds: string[], targetFolderId: string) => {
    try {
      await Promise.all(fileIds.map(id => FileSystemService.moveFile(id, targetFolderId)))
      await loadFiles(currentFolderId)
      toast.success(`${fileIds.length} files moved successfully`)
    } catch (error) {
      throw new Error('Failed to move some files')
    }
  }

  const handleBulkCopy = async (fileIds: string[], targetFolderId: string) => {
    try {
      await Promise.all(fileIds.map(id => FileSystemService.copyFile(id, targetFolderId)))
      await loadFiles(currentFolderId)
      toast.success(`${fileIds.length} files copied successfully`)
    } catch (error) {
      throw new Error('Failed to copy some files')
    }
  }

  const handleBulkShare = async (fileIds: string[], shareOptions: any) => {
    try {
      await Promise.all(
        fileIds.map(id => FileSharingService.createShare(id, shareOptions))
      )
      toast.success(`${fileIds.length} files shared successfully`)
    } catch (error) {
      throw new Error('Failed to share some files')
    }
  }

  const handleBulkTag = async (fileIds: string[], tags: string[]) => {
    try {
      await Promise.all(
        fileIds.map(id => FileSystemService.updateFileTags(id, tags))
      )
      await loadFiles(currentFolderId)
      toast.success(`Tags added to ${fileIds.length} files`)
    } catch (error) {
      throw new Error('Failed to tag some files')
    }
  }

  const handleBulkDownload = async (fileIds: string[]) => {
    try {
      if (fileIds.length === 1) {
        // Single file download
        const file = files.find(f => f.id === fileIds[0])
        if (file) {
          await FileSystemService.downloadFile(file.id)
        }
      } else {
        // Multiple files - create archive
        await FileSystemService.downloadMultipleFiles(fileIds)
      }
      toast.success('Download started')
    } catch (error) {
      throw new Error('Failed to download files')
    }
  }

  const handleBulkArchive = async (fileIds: string[], archiveName: string) => {
    try {
      await FileSystemService.createArchive(fileIds, archiveName, currentFolderId)
      await loadFiles(currentFolderId)
      toast.success(`Archive "${archiveName}" created successfully`)
    } catch (error) {
      throw new Error('Failed to create archive')
    }
  }

  const resetSearch = () => {
    setSearchFilters({
      query: '',
      fileTypes: [],
      sizeRange: { min: null, max: null, unit: 'MB' },
      dateRange: { from: null, to: null },
      isShared: null,
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb currentFolderId={currentFolderId} onNavigate={setCurrentFolderId} />

      {/* Advanced Search */}
      {showAdvancedSearch && (
        <AdvancedSearch
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onReset={resetSearch}
          resultCount={filteredFiles.length}
        />
      )}

      {/* Bulk Operations Bar */}
      {showBulkOperations && selectedFiles.length > 0 && (
        <BulkOperations
          selectedFiles={selectedFiles}
          files={files}
          folders={folders}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkCopy={handleBulkCopy}
          onBulkShare={handleBulkShare}
          onBulkTag={handleBulkTag}
          onBulkDownload={handleBulkDownload}
          onBulkArchive={handleBulkArchive}
        />
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Left side - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>

              <FileUploadZone onFilesUpload={handleFileUpload} disabled={isUploading}>
                <Button variant="outline" size="sm" disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload
                </Button>
              </FileUploadZone>

              {/* Multi-select toggle */}
              {multiSelectMode && filteredFiles.some(f => f.type !== 'folder') && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectionMode === 'all' ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : selectionMode === 'some' ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select All
                  </Button>
                  {selectedFiles.length > 0 && (
                    <Badge variant="secondary">
                      {selectedFiles.length} selected
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Right side - View controls */}
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Display */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading files...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchFilters.query || searchFilters.fileTypes.length > 0 || 
                 searchFilters.sizeRange.min !== null || searchFilters.sizeRange.max !== null ||
                 searchFilters.dateRange.from || searchFilters.dateRange.to ||
                 searchFilters.isShared !== null
                  ? 'No files match your search criteria'
                  : 'This folder is empty'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onFileSelect={multiSelectMode ? handleFileSelect : () => {}}
              onFileOpen={handleFileOpen}
              onFileDelete={handleFileDelete}
              onFileShare={handleFileShare}
              multiSelectMode={multiSelectMode}
            />
          ) : (
            <FileList
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onFileSelect={multiSelectMode ? handleFileSelect : () => {}}
              onFileOpen={handleFileOpen}
              onFileDelete={handleFileDelete}
              onFileShare={handleFileShare}
              multiSelectMode={multiSelectMode}
            />
          )}
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      {previewFile && (
        <AdvancedFilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={(file) => FileSystemService.downloadFile(file.id)}
          onShare={handleFileShare}
          onDelete={(file) => handleFileDelete(file.id)}
        />
      )}

      {/* Share Modal */}
      {shareFile && (
        <ShareFileModal
          file={shareFile}
          trigger={null}
          onShared={() => {
            setShareFile(null)
            loadFiles(currentFolderId)
          }}
        />
      )}
    </div>
  )
}

export default EnhancedFileManager
