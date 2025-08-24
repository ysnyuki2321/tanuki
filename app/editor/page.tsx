"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FileSystemService, type FileItem } from "@/lib/file-system"

export default function EditorPage() {
  const searchParams = useSearchParams()
  const fileId = searchParams.get("file")
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fileService = FileSystemService.getInstance()

  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        try {
          const allFiles = await fileService.getFiles("/")
          const file = allFiles.find((f) => f.id === fileId)
          if (file) {
            setFiles([file])
          }
        } catch (error) {
          console.error("Failed to load file:", error)
        }
      }
      setIsLoading(false)
    }

    loadFile()
  }, [fileId])

  const handleClose = () => {
    window.location.href = "/dashboard"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <CodeEditor initialFiles={files} onClose={handleClose} isFullscreen={true} onToggleFullscreen={() => {}} />
      </div>
    </ProtectedRoute>
  )
}
