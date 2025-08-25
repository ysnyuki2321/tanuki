"use client"

import { useState, useEffect } from "react"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { FileGrid } from "./file-grid"
import { FileList } from "./file-list"
import { FileManagerToolbar } from "./file-manager-toolbar"
import { FileUploadZone } from "./file-upload-zone"
import { Breadcrumb } from "./breadcrumb"
import { CodeEditorModal } from "@/components/code-editor/code-editor-modal"
import { ZipPreviewModal } from "@/components/zip-preview/zip-preview-modal"
import { FilePreviewModal } from "@/components/file-preview/file-preview-modal"
import { Loader2 } from "lucide-react"

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorFiles, setEditorFiles] = useState<FileItem[]>([])
  const [isZipPreviewOpen, setIsZipPreviewOpen] = useState(false)
  const [zipPreviewFile, setZipPreviewFile] = useState<FileItem | null>(null)
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false)
  const [filePreviewFile, setFilePreviewFile] = useState<FileItem | null>(null)

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

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

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

      <FileManagerToolbar
        selectedCount={selectedFiles.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDeleteSelected={() => {
          selectedFiles.forEach(handleFileDelete)
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
