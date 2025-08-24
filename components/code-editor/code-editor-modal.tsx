"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CodeEditor } from "./code-editor"
import type { FileItem } from "@/lib/file-system"
import { useState } from "react"

interface CodeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  files: FileItem[]
}

export function CodeEditorModal({ isOpen, onClose, files }: CodeEditorModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isFullscreen) {
    return (
      <CodeEditor
        initialFiles={files}
        onClose={onClose}
        isFullscreen={true}
        onToggleFullscreen={handleToggleFullscreen}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[80vh] sm:h-[80vh] p-0">
        <CodeEditor
          initialFiles={files}
          onClose={onClose}
          isFullscreen={false}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </DialogContent>
    </Dialog>
  )
}
