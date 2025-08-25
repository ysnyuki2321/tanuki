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
import { MoreHorizontal, Download, Share, Edit, Trash2, Code, Eye } from "lucide-react"
import { useState } from "react"

interface FileListProps {
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
}

export function FileList({
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

  return (
    <div className="border rounded-lg">
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
            <TableRow key={file.id} className="group">
              <TableCell>
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={(checked) => onFileSelect(file.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onFileOpen(file)}>
                  <span className="text-lg">{fileService.getFileIcon(file)}</span>
                  {editingFile === file.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameSubmit(file.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(file.id)
                        if (e.key === "Escape") setEditingFile(null)
                      }}
                      className="bg-transparent border-b border-primary outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium flex items-center gap-2">
                      {file.name}
                      {isEditableFile(file) && <Code className="w-3 h-3 text-primary" />}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{file.size ? fileService.formatFileSize(file.size) : "-"}</TableCell>
              <TableCell>{file.modifiedAt.toLocaleDateString()}</TableCell>
              <TableCell>{file.isShared ? <span className="text-primary text-sm">Shared</span> : "-"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onFileOpen(file)}>
                      <Download className="mr-2 h-4 w-4" />
                      {file.type === "folder" ? "Open" : "Download"}
                    </DropdownMenuItem>
                    {isEditableFile(file) && onFileEdit && (
                      <DropdownMenuItem onClick={() => onFileEdit(file)}>
                        <Code className="mr-2 h-4 w-4" />
                        Edit Code
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleRename(file)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFileShare(file.id)}>
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFileDelete(file.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
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
  )
}
