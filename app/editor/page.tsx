"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdvancedCodeEditor } from "@/components/code-editor/advanced-code-editor"
import { ResponsiveHeader } from "@/components/navigation/responsive-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { 
  Code2, 
  Play, 
  Sparkles, 
  FileCode, 
  Download, 
  Save,
  Settings,
  Zap,
  Monitor,
  Smartphone,
  Palette,
  GitBranch,
  Bug,
  Search,
  Terminal,
  FolderTree,
  Eye
} from "lucide-react"

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

  const handleCloseEditor = () => {
    setShowEditor(false)
    setIsFullscreen(false)
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

  const editorFeatures = [
    {
      title: "IntelliSense & Auto-completion",
      description: "Smart code completion with error detection",
      icon: <Zap className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Advanced Syntax Highlighting",
      description: "Rich syntax highlighting for 50+ languages",
      icon: <Palette className="h-6 w-6 text-green-500" />
    },
    {
      title: "Multi-cursor Editing",
      description: "Edit multiple locations simultaneously",
      icon: <Monitor className="h-6 w-6 text-purple-500" />
    },
    {
      title: "Git Integration",
      description: "Built-in version control support",
      icon: <GitBranch className="h-6 w-6 text-orange-500" />
    },
    {
      title: "Error Detection & Linting",
      description: "Real-time error detection and suggestions",
      icon: <Bug className="h-6 w-6 text-red-500" />
    },
    {
      title: "Code Execution",
      description: "Run code directly in the editor",
      icon: <Play className="h-6 w-6 text-indigo-500" />
    }
  ]

  const developmentTools = [
    {
      title: "File Tree Explorer",
      description: "Navigate project files easily"
    },
    {
      title: "Multiple Tabs & Split View",
      description: "Work with multiple files simultaneously"
    },
    {
      title: "Theme Support (Light/Dark)",
      description: "Customizable editor themes"
    },
    {
      title: "Auto-save & Live Preview",
      description: "Never lose your work"
    },
    {
      title: "Find & Replace (Regex)",
      description: "Powerful search and replace"
    },
    {
      title: "Code Folding & Minimap",
      description: "Navigate large files efficiently"
    }
  ]

  const supportedLanguages = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular",
    "Python", "Java", "C++", "C#", "Go", "Rust", "PHP",
    "HTML", "CSS", "SCSS", "JSON", "XML", "YAML",
    "SQL", "Markdown", "Dockerfile", "Shell"
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Play className="h-4 w-4" />
        <span className="hidden sm:inline">Run</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
    </div>
  )

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
          {!isFullscreen && (
            <ResponsiveHeader 
              title="Code Editor"
              subtitle="Monaco-powered development environment"
              actions={headerActions}
            />
          )}
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
      <div className="min-h-screen bg-background">
        <ResponsiveHeader 
          title="Code Editor"
          subtitle="Professional development environment"
          actions={headerActions}
        />

        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
                <Code2 className="h-10 w-10" />
                Advanced Code Editor
              </h1>
              <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-sm">
                <Sparkles className="h-4 w-4 mr-1" />
                Monaco Powered
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional code editing with VS Code features, syntax highlighting, IntelliSense, and real-time collaboration
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleStartNewProject} 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-3 text-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start New Project
              </Button>
              <Button variant="outline" className="px-8 py-3 text-lg">
                <FileCode className="h-5 w-5 mr-2" />
                Open Existing Files
              </Button>
            </div>
          </div>

          {/* Professional Features */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <FileCode className="h-6 w-6" />
                Professional Features
              </CardTitle>
              <CardDescription className="text-lg">
                Enterprise-grade code editing powered by Monaco Editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editorFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Quick Start
                </CardTitle>
                <CardDescription>Jump right into coding with a new project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a new project with TypeScript, React, or any framework. 
                  Includes file explorer, auto-completion, and real-time error checking.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">TypeScript Project</span>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-green-500" />
                      <span className="font-medium">React Application</span>
                    </div>
                    <Badge variant="outline">Popular</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Python Script</span>
                    </div>
                    <Badge variant="outline">Easy</Badge>
                  </div>
                </div>
                <Button onClick={handleStartNewProject} className="w-full bg-gradient-to-r from-green-500 to-green-600">
                  <Play className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-blue-500" />
                  Open Existing Files
                </CardTitle>
                <CardDescription>Browse and edit your existing codebase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select files from your storage to open in the advanced editor. 
                  Supports all major programming languages and frameworks.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Terminal className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Recent: main.py</p>
                      <p className="text-xs text-muted-foreground">Modified 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileCode className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Recent: index.ts</p>
                      <p className="text-xs text-muted-foreground">Modified 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileCode className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Recent: config.json</p>
                      <p className="text-xs text-muted-foreground">Modified 3 days ago</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Browse All Files
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Development Tools & Language Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  Development Tools
                </CardTitle>
                <CardDescription>
                  Powerful tools for modern development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {developmentTools.map((tool, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{tool.title}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-green-500" />
                  Supported Languages
                </CardTitle>
                <CardDescription>
                  50+ programming languages supported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {supportedLanguages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>Auto-detection:</strong> The editor automatically detects file types and provides appropriate syntax highlighting, IntelliSense, and error checking for your code.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Notice */}
          <Card className="lg:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                For the best coding experience, we recommend using the editor on a desktop or tablet with a keyboard. 
                However, you can still view and make quick edits on mobile devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View Mode Only
                </Button>
                <Button size="sm" onClick={handleStartNewProject} className="gap-2">
                  <Code2 className="h-4 w-4" />
                  Try Mobile Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
