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
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)
  const [currentPath, setCurrentPath] = useState<string>("/")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorFiles, setEditorFiles] = useState<FileItem[]>([])
  const [isZipPreviewOpen, setIsZipPreviewOpen] = useState(false)
  const [zipPreviewFile, setZipPreviewFile] = useState<FileItem | null>(null)
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<{ type: "video" | "audio" | "image"; src: string; name: string } | null>(null)

  const loadFiles = async (parentId?: string) => {
    setIsLoading(true)
    try {
      const fileList = await FileSystemService.getFiles(parentId ?? currentPath)
      setFiles(fileList)
    } catch (error) {
      console.error("Failed to load files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles(currentParentId)
  }, [currentParentId, currentPath])

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
      setCurrentPath(file.path)
      setSelectedFiles([])
    } else {
      const ext = file.name.split(".").pop()?.toLowerCase()
      const isCode = (e?: string) => !!e && [
        "js","jsx","ts","tsx","py","java","cpp","c","cs","php","rb","go","rs","html","css","scss","json","xml","yaml","yml","md","sql","sh","txt"
      ].includes(e)

      if (ext && ["mp4", "webm", "ogg"].includes(ext)) {
        setMediaPreview({ type: "video", src: "/demo/video", name: file.name })
        setIsMediaPreviewOpen(true)
      } else if (ext && ["mp3", "wav", "ogg"].includes(ext)) {
        setMediaPreview({ type: "audio", src: "/demo/audio", name: file.name })
        setIsMediaPreviewOpen(true)
      } else if (ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        setMediaPreview({ type: "image", src: "/placeholder.jpg", name: file.name })
        setIsMediaPreviewOpen(true)
      } else if (ext === "zip" || ext === "rar" || ext === "7z") {
        handleZipPreview(file)
      } else if (isCode(ext)) {
        handleFileEdit(file)
      } else {
        // Mặc định mở trong editor dạng text
        handleFileEdit(file)
      }
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
      toast({ title: "Link copied", description: "Share URL has been copied to clipboard." })
      loadFiles(currentParentId)
    } catch (error) {
      toast({ title: "Failed to share file", description: String(error), variant: "destructive" as any })
    }
  }

  const getCurrentPath = () => currentPath

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
            setCurrentPath("/")
          } else {
            setCurrentParentId(undefined)
            setCurrentPath(path)
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
        />
      )}

      <CodeEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} files={editorFiles} />

      {zipPreviewFile && (
        <ZipPreviewModal isOpen={isZipPreviewOpen} onClose={() => setIsZipPreviewOpen(false)} file={zipPreviewFile} />
      )}

      <Dialog open={isMediaPreviewOpen} onOpenChange={setIsMediaPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{mediaPreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {mediaPreview?.type === "video" && (
              <div className="aspect-video bg-black/80 rounded-lg flex items-center justify-center text-white text-sm">
                Demo Video Player (add your file to /public/demo/video to play)
              </div>
            )}
            {mediaPreview?.type === "audio" && (
              <div className="p-6 border rounded-lg">
                Demo Music Player (add your file to /public/demo/audio to play)
              </div>
            )}
            {mediaPreview?.type === "image" && (
              <img src={mediaPreview.src} alt={mediaPreview.name} className="w-full h-auto rounded-lg" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
