"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdvancedCodeEditor } from "@/components/code-editor/advanced-code-editor"
import { FileManager } from "@/components/file-manager/file-manager"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Maximize2, FileCode, FolderOpen, Play, Sparkles, Code2, ArrowLeft } from "lucide-react"

export default function EditorPage() {
  const searchParams = useSearchParams()
  const fileId = searchParams.get("file")
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(!!fileId)

  const fileService = FileSystemService.getInstance()

  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        try {
          const allFiles = await fileService.getFiles("/")
          const file = allFiles.find((f) => f.id === fileId)
          if (file) {
            setSelectedFiles([file])
            setShowEditor(true)
            setIsFullscreen(true)
          }
        } catch (error) {
          console.error("Failed to load file:", error)
        }
      }
      setIsLoading(false)
    }

    loadFile()
  }, [fileId])

  const handleFileSelect = (files: FileItem[]) => {
    const codeFiles = files.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      return [
        "js", "jsx", "ts", "tsx", "vue", "svelte",
        "py", "java", "cpp", "c", "cs", "php", "rb", "go", "rs",
        "html", "css", "scss", "sass", "less",
        "json", "xml", "yaml", "yml", "toml",
        "md", "mdx", "txt",
        "sql", "sh", "bash", "zsh",
        "dockerfile", "gitignore", "env"
      ].includes(ext || "")
    })

    if (codeFiles.length > 0) {
      setSelectedFiles(codeFiles)
      setShowEditor(true)
    }
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setIsFullscreen(false)
    // If opened from a direct file link, go back to dashboard
    if (fileId) {
      window.location.href = "/dashboard"
    }
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleStartNewProject = () => {
    setSelectedFiles([])
    setShowEditor(true)
  }

  const handleBackToDashboard = () => {
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

  if (showEditor) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <AdvancedCodeEditor
            initialFiles={selectedFiles}
            onClose={handleCloseEditor}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            projectName="Tanuki Project"
          />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Code2 className="h-8 w-8" />
                Advanced Code Editor
                <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Monaco Powered
                </Badge>
              </h1>
              <p className="text-muted-foreground">Professional code editing with VS Code features, syntax highlighting, and IntelliSense</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleStartNewProject} className="bg-gradient-to-r from-green-500 to-green-600">
              <Play className="h-4 w-4 mr-2" />
              Start New Project
            </Button>
            <Button onClick={() => setIsFullscreen(!isFullscreen)} variant="outline">
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen Mode
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Professional Features
              </CardTitle>
              <CardDescription>Enterprise-grade code editing powered by Monaco Editor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600">✨ Editor Features</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• IntelliSense & Auto-completion</li>
                    <li>• Advanced Syntax Highlighting</li>
                    <li>• Error Detection & Linting</li>
                    <li>• Code Folding & Minimap</li>
                    <li>• Multi-cursor Editing</li>
                    <li>• Find & Replace (Regex)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-600">🚀 Development Tools</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• File Tree Explorer</li>
                    <li>• Multiple Tabs & Split View</li>
                    <li>• Theme Support (Light/Dark)</li>
                    <li>• Auto-save & Live Preview</li>
                    <li>• Code Execution</li>
                    <li>• Git Integration Ready</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-600">🛠️ Supported Languages</h3>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "JavaScript", "TypeScript", "React", "Vue",
                      "Python", "Java", "C++", "C#", "Go", "Rust",
                      "HTML", "CSS", "SCSS", "JSON", "SQL", "Markdown"
                    ].map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Quick Start
                </CardTitle>
                <CardDescription>Jump right into coding with a new project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create a new project with TypeScript, React, or any framework. 
                    Includes file explorer, auto-completion, and real-time error checking.
                  </p>
                  <Button onClick={handleStartNewProject} className="w-full bg-gradient-to-r from-green-500 to-green-600">
                    <Play className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  Open Existing Files
                </CardTitle>
                <CardDescription>Browse and edit your existing codebase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select files from your storage to open in the advanced editor. 
                    Supports all major programming languages and frameworks.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium mb-2">Select files below to get started:</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                File Browser
              </CardTitle>
              <CardDescription>Browse your files and select code files to edit</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <FileManager onFileSelect={handleFileSelect} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
