"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { MoreHorizontal, Download, Share, Edit, Trash2, Code, Folder, File, Eye } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface FileListProps {
  files: FileItem[]
  selectedFiles: string[]
  onFileSelect: (fileId: string, isSelected: boolean) => void
  onFileOpen: (file: FileItem) => void
  onFileDelete: (fileId: string) => void
  onFileRename: (fileId: string, newName: string) => void
  onFileShare: (fileId: string) => void
  onFileEdit?: (file: FileItem) => void // Added onFileEdit prop
}

export function FileList({
  files,
  selectedFiles,
  onFileSelect,
  onFileOpen,
  onFileDelete,
  onFileRename,
  onFileShare,
  onFileEdit, // Added onFileEdit prop
}: FileListProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const fileService = FileSystemService.getInstance()

  const handleRename = (file: FileItem) => {
    setEditingFile(file.id)
    setEditName(file.name)
  }

  const handleRenameSubmit = (fileId: string) => {
    if (editName.trim()) {
      onFileRename(fileId, editName.trim())
    }
    setEditingFile(null)
    setEditName("")
  }

  const isEditableFile = (file: FileItem): boolean => {
    if (file.type === "folder") return false
    const editableExtensions = [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "cs",
      "php",
      "rb",
      "go",
      "rs",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "yaml",
      "yml",
      "md",
      "sql",
      "sh",
      "txt",
    ]
    const ext = file.name.split(".").pop()?.toLowerCase()
    return editableExtensions.includes(ext || "")
  }

  const formatFileSize = (bytes: number, decimalPoint = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimalPoint < 0 ? 0 : decimalPoint
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile view - Card layout */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {files.map((file) => (
            <div
              key={file.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedFiles.includes(file.id) ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onClick={() => onFileSelect(file.id, !selectedFiles.includes(file.id))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onChange={(checked) => onFileSelect(file.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {file.type === "folder" ? (
                        <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                      <p className="font-medium truncate">{file.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {file.type !== "folder" && <span>{formatFileSize(file.size)}</span>}
                      <span>{new Date(file.modifiedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onFileOpen(file)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Open
                    </DropdownMenuItem>
                    {isEditableFile(file) && onFileEdit && (
                      <DropdownMenuItem onClick={() => onFileEdit(file)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleRename(file)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFileShare(file.id)}>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFileDelete(file.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view - Table layout */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow
                key={file.id}
                className={`cursor-pointer hover:bg-muted/50 ${
                  selectedFiles.includes(file.id) ? "bg-primary/5" : ""
                }`}
                onClick={() => onFileSelect(file.id, !selectedFiles.includes(file.id))}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onChange={(checked) => onFileSelect(file.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {file.type === "folder" ? (
                      <Folder className="h-4 w-4 text-blue-500" />
                    ) : (
                      <File className="h-4 w-4 text-gray-500" />
                    )}
                    {editingFile === file.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRenameSubmit(file.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(file.id)
                          if (e.key === "Escape") {
                            setEditingFile(null)
                            setEditName("")
                          }
                        }}
                        className="h-6 w-48"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span>{file.name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{file.type === "folder" ? "-" : formatFileSize(file.size)}</TableCell>
                <TableCell>{new Date(file.modifiedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {file.type === "folder" ? "Folder" : "File"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onFileOpen(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      {isEditableFile(file) && onFileEdit && (
                        <DropdownMenuItem onClick={() => onFileEdit(file)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleRename(file)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFileShare(file.id)}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onFileDelete(file.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
