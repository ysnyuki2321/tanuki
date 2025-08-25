"use client"
import type { FileItem } from "@/lib/file-system"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  MoreVertical,
  File,
  Folder,
  ImageIcon,
  FileText,
  Code,
  Database,
  Archive,
  Music,
  Video,
  Download,
  Share,
  Edit,
  Trash2,
  Eye,
  Clock,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface FileGridProps {
  files: FileItem[]
  selectedFiles: string[]
  onFileSelect: (fileId: string, isSelected: boolean) => void
  onFileOpen: (file: FileItem) => void
  onFileDelete: (fileId: string) => void
  onFileRename: (fileId: string, newName: string) => void
  onFileShare: (fileId: string) => void
  onFileEdit?: (file: FileItem) => void
  onZipPreview?: (file: FileItem) => void
  onFilePreview?: (file: FileItem) => void
  onFileHistory?: (file: FileItem) => void
}

export function FileGrid({
  files,
  selectedFiles,
  onFileSelect,
  onFileOpen,
  onFileDelete,
  onFileRename,
  onFileShare,
  onFileEdit,
  onZipPreview,
  onFilePreview,
  onFileHistory,
}: FileGridProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") return <Folder className="h-8 w-8 text-blue-500" />

    const extension = file.name.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <ImageIcon className="h-8 w-8 text-green-500" />
      case "txt":
      case "md":
      case "doc":
      case "docx":
        return <FileText className="h-8 w-8 text-blue-500" />
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "py":
      case "java":
      case "cpp":
      case "html":
      case "css":
        return <Code className="h-8 w-8 text-purple-500" />
      case "sql":
      case "db":
        return <Database className="h-8 w-8 text-orange-500" />
      case "zip":
      case "rar":
      case "7z":
        return <Archive className="h-8 w-8 text-yellow-500" />
      case "mp3":
      case "wav":
      case "flac":
        return <Music className="h-8 w-8 text-pink-500" />
      case "mp4":
      case "avi":
      case "mkv":
        return <Video className="h-8 w-8 text-red-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const handleRename = (fileId: string, newName: string) => {
    onFileRename(fileId, newName)
    setEditingFile(null)
    setEditingName("")
  }

  const startRename = (file: FileItem) => {
    setEditingFile(file.id)
    setEditingName(file.name)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isCodeFile = (file: FileItem) => {
    const codeExtensions = ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css", "sql", "json", "xml"]
    const extension = file.name.split(".").pop()?.toLowerCase()
    return codeExtensions.includes(extension || "")
  }

  const isZipFile = (file: FileItem) => {
    const zipExtensions = ["zip", "rar", "7z", "tar", "gz"]
    const extension = file.name.split(".").pop()?.toLowerCase()
    return zipExtensions.includes(extension || "")
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {files.map((file) => (
        <Card
          key={file.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedFiles.includes(file.id) ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onFileSelect(file.id, !selectedFiles.includes(file.id))}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              {getFileIcon(file)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFileOpen(file)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  {onFilePreview && file.type === "file" && (
                    <DropdownMenuItem onClick={() => onFilePreview(file)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  {isCodeFile(file) && onFileEdit && (
                    <DropdownMenuItem onClick={() => onFileEdit(file)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Code
                    </DropdownMenuItem>
                  )}
                  {isZipFile(file) && onZipPreview && (
                    <DropdownMenuItem onClick={() => onZipPreview(file)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Preview Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => startRename(file)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFileShare(file.id)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  {onFileHistory && file.type === "file" && (
                    <DropdownMenuItem onClick={() => onFileHistory(file)}>
                      <Clock className="h-4 w-4 mr-2" />
                      History
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFileDelete(file.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-center w-full">
              {editingFile === file.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRename(file.id, editingName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(file.id, editingName)
                    if (e.key === "Escape") {
                      setEditingFile(null)
                      setEditingName("")
                    }
                  }}
                  className="text-xs h-6"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-xs font-medium truncate" title={file.name}>
                  {file.name}
                </p>
              )}

              {file.type !== "folder" && <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>}

              <p className="text-xs text-muted-foreground">{new Date(file.modifiedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
