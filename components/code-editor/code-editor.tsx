"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeEditorService, type EditorFile } from "@/lib/code-editor"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { Save, X, RotateCcw, Download, Maximize2, Minimize2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface CodeEditorProps {
  initialFiles?: FileItem[]
  onClose?: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function CodeEditor({ initialFiles = [], onClose, isFullscreen = false, onToggleFullscreen }: CodeEditorProps) {
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const editorService = CodeEditorService.getInstance()

  useEffect(() => {
    // Load initial files
    if (initialFiles.length > 0) {
      const editorFiles: EditorFile[] = initialFiles.map((file) => ({
        id: file.id,
        name: file.name,
        content: "", // FileItem doesn't have content property, so we start with empty content
        language: editorService.detectLanguage(file.name),
        isDirty: false,
        path: file.path,
      }))
      setOpenFiles(editorFiles)
      setActiveFileId(editorFiles[0]?.id || null)
    }
  }, [initialFiles])

  const activeFile = openFiles.find((file) => file.id === activeFileId)

  const handleContentChange = (content: string) => {
    if (!activeFileId) return

    setOpenFiles((prev) => prev.map((file) => (file.id === activeFileId ? { ...file, content, isDirty: true } : file)))
  }

  const handleSaveFile = async (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId)
    if (!file) return

    try {
      // In a real implementation, save to backend
      console.log("Saving file:", file.name, file.content)

      setOpenFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, isDirty: false } : f)))
    } catch (error) {
      console.error("Failed to save file:", error)
    }
  }

  const handleCloseFile = (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId)
    if (file?.isDirty) {
      const shouldClose = confirm(`${file.name} has unsaved changes. Close anyway?`)
      if (!shouldClose) return
    }

    setOpenFiles((prev) => prev.filter((f) => f.id !== fileId))

    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((f) => f.id !== fileId)
      setActiveFileId(remainingFiles[0]?.id || null)
    }
  }

  const handleFormatCode = () => {
    if (!activeFile) return

    const formatted = editorService.formatCode(activeFile.content, activeFile.language)
    handleContentChange(formatted)
  }

  const handleDownloadFile = () => {
    if (!activeFile) return

    const blob = new Blob([activeFile.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeFile.name
    a.click()
    URL.revokeObjectURL(url)
  }

  if (openFiles.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No files open</p>
            <Button onClick={onClose} variant="outline">
              Back to File Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      <Card className={`${isFullscreen ? "h-full rounded-none border-0" : "h-[600px]"}`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base sm:text-lg">Code Editor</h3>
              {activeFile && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <span>{editorService.getLanguageIcon(activeFile.language)}</span>
                  <span className="hidden sm:inline">{activeFile.language}</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="h-8 w-8 p-0">
                {theme === "light" ? "🌙" : "☀️"}
              </Button>

              {activeFile && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleFormatCode} className="h-8 w-8 p-0" title="Format Code">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownloadFile} className="h-8 w-8 p-0" title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveFile(activeFile.id)}
                    disabled={!activeFile.isDirty}
                    className="h-8 w-8 p-0"
                    title="Save"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </>
              )}

              {onToggleFullscreen && (
                <Button variant="ghost" size="sm" onClick={onToggleFullscreen} className="h-8 w-8 p-0" title="Toggle Fullscreen">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}

              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" title="Close">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1">
          <Tabs value={activeFileId || ""} onValueChange={setActiveFileId} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 overflow-x-auto">
              {openFiles.map((file) => (
                <TabsTrigger key={file.id} value={file.id} className="relative group data-[state=active]:bg-background flex-shrink-0">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">{editorService.getLanguageIcon(file.language)}</span>
                    <span className="truncate max-w-20 sm:max-w-32">{file.name}</span>
                    {file.isDirty && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 sm:ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseFile(file.id)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>

            {openFiles.map((file) => (
              <TabsContent key={file.id} value={file.id} className="flex-1 m-0">
                <div className={`h-full ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
                  <Textarea
                    ref={textareaRef}
                    value={file.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className={`h-full resize-none border-0 rounded-none font-mono text-sm leading-relaxed ${
                      theme === "dark"
                        ? "bg-gray-900 text-gray-100 placeholder:text-gray-400"
                        : "bg-white text-gray-900 placeholder:text-gray-500"
                    }`}
                    placeholder={`Start coding in ${file.name}...`}
                    spellCheck={false}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Syntax highlighting styles */}
      <style jsx global>{`
        .syntax-keyword { color: #0066cc; font-weight: bold; }
        .syntax-string { color: #009900; }
        .syntax-number { color: #cc6600; }
        .syntax-comment { color: #999999; font-style: italic; }
        .syntax-boolean { color: #cc0066; }
        .syntax-type { color: #6600cc; }
        .syntax-property { color: #0066cc; }
        
        .dark .syntax-keyword { color: #66b3ff; }
        .dark .syntax-string { color: #66ff66; }
        .dark .syntax-number { color: #ffcc66; }
        .dark .syntax-comment { color: #cccccc; }
        .dark .syntax-boolean { color: #ff66cc; }
        .dark .syntax-type { color: #cc66ff; }
        .dark .syntax-property { color: #66b3ff; }
      `}</style>
    </div>
  )
}
