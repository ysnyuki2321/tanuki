"use client"

import { useState, useEffect } from "react"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { FileGrid } from "./file-grid"
import { FileList } from "./file-list"
import { FileManagerToolbar } from "./file-manager-toolbar"
import { FileUploadZone } from "./file-upload-zone"
import { Breadcrumb } from "./breadcrumb"
import { AdvancedSearch, type SearchFilters } from "./advanced-search"
import { CodeEditorModal } from "@/components/code-editor/code-editor-modal"
import { ZipPreviewModal } from "@/components/zip-preview/zip-preview-modal"
import { FilePreviewModal } from "@/components/file-preview/file-preview-modal"
import { FileHistoryModal } from "@/components/file-history/file-history-modal"
import { Loader2 } from "lucide-react"

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    fileTypes: [],
    sizeRange: { min: null, max: null, unit: "MB" },
    dateRange: { from: null, to: null },
    isShared: null,
    sortBy: "name",
    sortOrder: "asc"
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorFiles, setEditorFiles] = useState<FileItem[]>([])
  const [isZipPreviewOpen, setIsZipPreviewOpen] = useState(false)
  const [zipPreviewFile, setZipPreviewFile] = useState<FileItem | null>(null)
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false)
  const [filePreviewFile, setFilePreviewFile] = useState<FileItem | null>(null)
  const [isFileHistoryOpen, setIsFileHistoryOpen] = useState(false)
  const [fileHistoryFile, setFileHistoryFile] = useState<FileItem | null>(null)

  const loadFiles = async (parentId?: string) => {
    setIsLoading(true)
    try {
      const fileList = await FileSystemService.getFiles(parentId)
      setFiles(fileList)
    } catch (error) {
      console.error("Failed to load files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles(currentParentId)
  }, [currentParentId])

  const handleFileSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedFiles((prev) => [...prev, fileId])
    } else {
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
    }
  }

  const handleFileOpen = (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentParentId(file.id)
      setSelectedFiles([])
    } else {
      console.log("Opening file:", file.name)
    }
  }

  const handleFileEdit = (file: FileItem) => {
    setEditorFiles([file])
    setIsEditorOpen(true)
  }

  const handleZipPreview = (file: FileItem) => {
    setZipPreviewFile(file)
    setIsZipPreviewOpen(true)
  }

  const handleFilePreview = (file: FileItem) => {
    setFilePreviewFile(file)
    setIsFilePreviewOpen(true)
  }

  const handleFileUpload = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      try {
        await FileSystemService.uploadFile(file, currentParentId)
      } catch (error) {
        console.error("Failed to upload file:", error)
      }
    }
    loadFiles(currentParentId)
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      await FileSystemService.deleteFile(fileId)
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
      loadFiles(currentParentId)
    } catch (error) {
      console.error("Failed to delete file:", error)
    }
  }

  const handleFileRename = async (fileId: string, newName: string) => {
    try {
      await FileSystemService.renameFile(fileId, newName)
      loadFiles(currentParentId)
    } catch (error) {
      console.error("Failed to rename file:", error)
    }
  }

  const handleFileShare = async (fileId: string) => {
    try {
      const shareId = await FileSystemService.shareFile(fileId)
      const shareUrl = `${window.location.origin}/share/${shareId}`
      navigator.clipboard.writeText(shareUrl)
      // Show success message
      console.log(`[v0] File shared! URL copied to clipboard: ${shareUrl}`)
      loadFiles(currentParentId)
    } catch (error) {
      console.error("Failed to share file:", error)
    }
  }

  const getCurrentPath = () => {
    if (!currentParentId) return "/"
    const currentFolder = files.find((f) => f.id === currentParentId)
    return currentFolder?.path || "/"
  }

  const filterAndSortFiles = (files: FileItem[], filters: SearchFilters): FileItem[] => {
    let filtered = [...files]

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      )
    }

    // File type filter
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(file => {
        if (file.type === "folder") return false

        const extension = file.name.split('.').pop()?.toLowerCase() || ""

        return filters.fileTypes.some(typeFilter => {
          switch (typeFilter) {
            case "image":
              return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension)
            case "document":
              return ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(extension)
            case "video":
              return ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"].includes(extension)
            case "audio":
              return ["mp3", "wav", "flac", "aac", "ogg", "wma"].includes(extension)
            case "archive":
              return ["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)
            case "code":
              return ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "html", "css", "scss", "php", "rb", "go", "rs"].includes(extension)
            case "database":
              return ["sql", "db", "sqlite", "mdb"].includes(extension)
            default:
              return false
          }
        })
      })
    }

    // File size filter
    if (filters.sizeRange.min !== null || filters.sizeRange.max !== null) {
      filtered = filtered.filter(file => {
        if (file.type === "folder") return true

        let sizeInBytes = file.size
        const { min, max, unit } = filters.sizeRange

        // Convert filter values to bytes
        const multiplier = unit === "KB" ? 1024 : unit === "MB" ? 1024 * 1024 : 1024 * 1024 * 1024
        const minBytes = min !== null ? min * multiplier : 0
        const maxBytes = max !== null ? max * multiplier : Infinity

        return sizeInBytes >= minBytes && sizeInBytes <= maxBytes
      })
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.modifiedAt)
        const fromDate = filters.dateRange.from
        const toDate = filters.dateRange.to

        if (fromDate && fileDate < fromDate) return false
        if (toDate && fileDate > toDate) return false

        return true
      })
    }

    // Share status filter
    if (filters.isShared !== null) {
      filtered = filtered.filter(file => !!file.isShared === filters.isShared)
    }

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "size":
          aValue = a.size
          bValue = b.size
          break
        case "modified":
          aValue = new Date(a.modifiedAt)
          bValue = new Date(b.modifiedAt)
          break
        case "created":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      // Folders first
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }

  const filteredFiles = filterAndSortFiles(files, searchFilters)

  const resetSearchFilters = () => {
    setSearchFilters({
      query: "",
      fileTypes: [],
      sizeRange: { min: null, max: null, unit: "MB" },
      dateRange: { from: null, to: null },
      isShared: null,
      sortBy: "name",
      sortOrder: "asc"
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        currentPath={getCurrentPath()}
        onPathChange={(path) => {
          if (path === "/") {
            setCurrentParentId(undefined)
          }
        }}
      />

      <AdvancedSearch
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onReset={resetSearchFilters}
        resultCount={filteredFiles.length}
      />

      <FileManagerToolbar
        selectedCount={selectedFiles.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDeleteSelected={() => {
          selectedFiles.forEach(handleFileDelete)
        }}
        onNewFolder={() => {
          // TODO: Implement new folder creation
          console.log("Create new folder")
        }}
      />

      <FileUploadZone onFilesUploaded={handleFileUpload} />

      {viewMode === "grid" ? (
        <FileGrid
          files={filteredFiles}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileOpen={handleFileOpen}
          onFileDelete={handleFileDelete}
          onFileRename={handleFileRename}
          onFileShare={handleFileShare}
          onFileEdit={handleFileEdit}
          onZipPreview={handleZipPreview}
          onFilePreview={handleFilePreview}
        />
      ) : (
        <FileList
          files={filteredFiles}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileOpen={handleFileOpen}
          onFileDelete={handleFileDelete}
          onFileRename={handleFileRename}
          onFileShare={handleFileShare}
          onFileEdit={handleFileEdit}
          onZipPreview={handleZipPreview}
          onFilePreview={handleFilePreview}
        />
      )}

      <CodeEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} files={editorFiles} />

      {zipPreviewFile && (
        <ZipPreviewModal isOpen={isZipPreviewOpen} onClose={() => setIsZipPreviewOpen(false)} file={zipPreviewFile} />
      )}

      {filePreviewFile && (
        <FilePreviewModal
          isOpen={isFilePreviewOpen}
          onClose={() => setIsFilePreviewOpen(false)}
          file={filePreviewFile}
          onEdit={handleFileEdit}
          onShare={(file) => handleFileShare(file.id)}
          onDownload={(file) => {
            const blob = new Blob([file.content || ''], { type: file.mimeType || 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.click()
            URL.revokeObjectURL(url)
          }}
        />
      )}
    </div>
  )
}
