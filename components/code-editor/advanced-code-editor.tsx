"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CodeEditorService, type EditorFile } from "@/lib/code-editor"
import { FileSystemService, type FileItem } from "@/lib/file-system"
import { 
  Save, 
  X, 
  RotateCcw, 
  Download, 
  Maximize2, 
  Minimize2, 
  FolderTree,
  File,
  FileCode,
  Search,
  Settings,
  Play,
  Bug,
  GitBranch,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown
} from "lucide-react"

import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading editor...</div>
})

interface FileTreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileTreeNode[]
  expanded?: boolean
}

interface AdvancedCodeEditorProps {
  initialFiles?: FileItem[]
  onClose?: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  projectName?: string
}

export function AdvancedCodeEditor({ 
  initialFiles = [], 
  onClose, 
  isFullscreen = false, 
  onToggleFullscreen,
  projectName = "My Project"
}: AdvancedCodeEditorProps) {
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showFileTree, setShowFileTree] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [fontSize, setFontSize] = useState(14)
  const [tabSize, setTabSize] = useState(4)
  const [wordWrap, setWordWrap] = useState(false)
  const [minimap, setMinimap] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [newFileForm, setNewFileForm] = useState({
    name: "",
    type: "file" as "file" | "folder",
    content: ""
  })

  const editorService = CodeEditorService.getInstance()
  const fileService = FileSystemService.getInstance()
  const editorRef = useRef<any>(null)

  useEffect(() => {
    // Initialize file tree and open files
    if (initialFiles.length > 0) {
      buildFileTree(initialFiles)
      const editorFiles: EditorFile[] = initialFiles
        .filter(file => file.type === 'file')
        .slice(0, 3) // Open first 3 files
        .map((file) => ({
          id: file.id,
          name: file.name,
          content: file.content || getDefaultFileContent(file.name),
          language: editorService.detectLanguage(file.name),
          isDirty: false,
          path: file.path,
        }))
      setOpenFiles(editorFiles)
      setActiveFileId(editorFiles[0]?.id || null)
    } else {
      // Create default project structure
      createDefaultProject()
    }
  }, [initialFiles])

  const createDefaultProject = () => {
    const defaultFiles: FileTreeNode[] = [
      {
        id: "1",
        name: "src",
        type: "folder",
        path: "/src",
        expanded: true,
        children: [
          { id: "2", name: "index.ts", type: "file", path: "/src/index.ts" },
          { id: "3", name: "app.ts", type: "file", path: "/src/app.ts" },
          { id: "4", name: "utils.ts", type: "file", path: "/src/utils.ts" }
        ]
      },
      {
        id: "5",
        name: "public",
        type: "folder", 
        path: "/public",
        expanded: false,
        children: [
          { id: "6", name: "index.html", type: "file", path: "/public/index.html" }
        ]
      },
      { id: "7", name: "package.json", type: "file", path: "/package.json" },
      { id: "8", name: "README.md", type: "file", path: "/README.md" },
      { id: "9", name: ".gitignore", type: "file", path: "/.gitignore" }
    ]

    setFileTree(defaultFiles)
    
    // Open main files
    const mainFiles: EditorFile[] = [
      {
        id: "2",
        name: "index.ts",
        content: getDefaultFileContent("index.ts"),
        language: "typescript",
        isDirty: false,
        path: "/src/index.ts"
      },
      {
        id: "7",
        name: "package.json",
        content: getDefaultFileContent("package.json"),
        language: "json",
        isDirty: false,
        path: "/package.json"
      }
    ]
    
    setOpenFiles(mainFiles)
    setActiveFileId(mainFiles[0].id)
  }

  const getDefaultFileContent = (filename: string): string => {
    const templates: Record<string, string> = {
      "index.ts": `// Welcome to Tanuki Code Editor
import { App } from './app';

console.log('Hello, Tanuki!');

const app = new App();
app.start();
`,
      "app.ts": `export class App {
  constructor() {
    console.log('App initialized');
  }

  start() {
    console.log('App started');
  }
}
`,
      "utils.ts": `export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
`,
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tanuki App</title>
</head>
<body>
    <div id="app">
        <h1>Welcome to Tanuki!</h1>
    </div>
    <script src="./dist/index.js"></script>
</body>
</html>
`,
      "package.json": `{
  "name": "tanuki-project",
  "version": "1.0.0",
  "description": "A project created with Tanuki Code Editor",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0"
  }
}
`,
      "README.md": `# ${projectName}

Welcome to your new project created with Tanuki Code Editor!

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Features

- TypeScript support
- Modern development tools
- Built with Tanuki platform

Enjoy coding! 🚀
`,
      ".gitignore": `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`
    }

    return templates[filename] || `// New ${filename} file
// Start coding here...
`
  }

  const buildFileTree = (files: FileItem[]) => {
    // Convert flat file list to tree structure
    const tree: FileTreeNode[] = []
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part)
      let currentLevel = tree
      
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1
        const existing = currentLevel.find(node => node.name === part)
        
        if (existing) {
          if (!isLast && existing.type === 'folder') {
            currentLevel = existing.children || []
          }
        } else {
          const newNode: FileTreeNode = {
            id: file.id,
            name: part,
            type: isLast ? file.type : 'folder',
            path: '/' + pathParts.slice(0, index + 1).join('/'),
            children: isLast ? undefined : [],
            expanded: index === 0
          }
          
          currentLevel.push(newNode)
          if (!isLast) {
            currentLevel = newNode.children || []
          }
        }
      })
    })
    
    setFileTree(tree)
  }

  const activeFile = openFiles.find((file) => file.id === activeFileId)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Configure editor options
    editor.updateOptions({
      fontSize,
      tabSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      roundedSelection: false,
      padding: { top: 10 }
    })

    // Add custom keybindings
    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyS, () => {
      if (activeFileId) {
        handleSaveFile(activeFileId)
      }
    })
  }

  const handleContentChange = (value: string | undefined) => {
    if (!activeFileId || !value) return

    setOpenFiles((prev) => prev.map((file) => 
      file.id === activeFileId 
        ? { ...file, content: value, isDirty: true } 
        : file
    ))

    // Auto-save if enabled
    if (autoSave) {
      setTimeout(() => {
        if (openFiles.find(f => f.id === activeFileId)?.isDirty) {
          handleSaveFile(activeFileId)
        }
      }, 2000)
    }
  }

  const handleSaveFile = async (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId)
    if (!file) return

    try {
      console.log("Saving file:", file.name, file.content)
      setOpenFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, isDirty: false } : f)))
    } catch (error) {
      console.error("Failed to save file:", error)
    }
  }

  const handleSaveAllFiles = async () => {
    const dirtyFiles = openFiles.filter(f => f.isDirty)
    for (const file of dirtyFiles) {
      await handleSaveFile(file.id)
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

  const handleOpenFile = (node: FileTreeNode) => {
    if (node.type === 'folder') {
      toggleFolder(node.id)
      return
    }

    // Check if file is already open
    const existingFile = openFiles.find(f => f.id === node.id)
    if (existingFile) {
      setActiveFileId(node.id)
      return
    }

    // Open new file
    const newFile: EditorFile = {
      id: node.id,
      name: node.name,
      content: getDefaultFileContent(node.name),
      language: editorService.detectLanguage(node.name),
      isDirty: false,
      path: node.path
    }

    setOpenFiles(prev => [...prev, newFile])
    setActiveFileId(node.id)
  }

  const toggleFolder = (nodeId: string) => {
    const toggleInTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded }
        }
        if (node.children) {
          return { ...node, children: toggleInTree(node.children) }
        }
        return node
      })
    }
    setFileTree(toggleInTree(fileTree))
  }

  const handleCreateNewFile = () => {
    if (!newFileForm.name) return

    const newNode: FileTreeNode = {
      id: `new-${Date.now()}`,
      name: newFileForm.name,
      type: newFileForm.type,
      path: `/${newFileForm.name}`,
      children: newFileForm.type === 'folder' ? [] : undefined
    }

    if (newFileForm.type === 'file') {
      const newFile: EditorFile = {
        id: newNode.id,
        name: newNode.name,
        content: newFileForm.content || getDefaultFileContent(newNode.name),
        language: editorService.detectLanguage(newNode.name),
        isDirty: true,
        path: newNode.path
      }
      setOpenFiles(prev => [...prev, newFile])
      setActiveFileId(newNode.id)
    }

    setFileTree(prev => [...prev, newNode])
    setShowNewFileDialog(false)
    setNewFileForm({ name: "", type: "file", content: "" })
  }

  const handleRunCode = () => {
    if (!activeFile) return
    
    // In a real implementation, this would execute the code
    console.log(`Running ${activeFile.name}:`, activeFile.content)
    
    // Show execution result (mock)
    if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
      try {
        // This is just for demo - in real app, use a sandboxed environment
        const result = eval(activeFile.content.replace(/console\.log/g, 'console.info'))
        console.log('Execution result:', result)
      } catch (error) {
        console.error('Execution error:', error)
      }
    }
  }

  const renderFileTree = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: level * 16 }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded ${
            activeFileId === node.id ? 'bg-accent' : ''
          }`}
          onClick={() => handleOpenFile(node)}
        >
          {node.type === 'folder' ? (
            <>
              {node.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <FileCode className="h-4 w-4 text-gray-500" />
            </>
          )}
          <span>{node.name}</span>
          {node.type === 'file' && openFiles.find(f => f.id === node.id)?.isDirty && (
            <div className="w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
        {node.type === 'folder' && node.expanded && node.children && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const filteredTree = searchTerm 
    ? fileTree.filter(node => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : fileTree

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      <Card className={`${isFullscreen ? "h-full rounded-none border-0" : "h-[700px]"}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Tanuki Code Editor</h3>
              {activeFile && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>{editorService.getLanguageIcon(activeFile.language)}</span>
                  {activeFile.language}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFileTree(!showFileTree)}>
                <FolderTree className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? "🌙" : "☀️"}
              </Button>

              {activeFile && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleRunCode}>
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSaveFile(activeFile.id)}>
                    <Save className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={handleSaveAllFiles}>
                Save All
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editor Settings</DialogTitle>
                    <DialogDescription>Customize your coding experience</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12">12px</SelectItem>
                            <SelectItem value="14">14px</SelectItem>
                            <SelectItem value="16">16px</SelectItem>
                            <SelectItem value="18">18px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tabSize">Tab Size</Label>
                        <Select value={tabSize.toString()} onValueChange={(value) => setTabSize(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 spaces</SelectItem>
                            <SelectItem value="4">4 spaces</SelectItem>
                            <SelectItem value="8">8 spaces</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="wordWrap"
                        checked={wordWrap}
                        onChange={(e) => setWordWrap(e.target.checked)}
                      />
                      <Label htmlFor="wordWrap">Word Wrap</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="minimap"
                        checked={minimap}
                        onChange={(e) => setMinimap(e.target.checked)}
                      />
                      <Label htmlFor="minimap">Show Minimap</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoSave"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                      />
                      <Label htmlFor="autoSave">Auto Save</Label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {onToggleFullscreen && (
                <Button variant="ghost" size="sm" onClick={onToggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}

              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex">
          {/* File Explorer Sidebar */}
          {showFileTree && (
            <div className="w-64 border-r bg-muted/30 flex flex-col">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Explorer</h4>
                  <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New File/Folder</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newFileForm.name}
                            onChange={(e) => setNewFileForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="component.tsx"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select 
                            value={newFileForm.type} 
                            onValueChange={(value) => setNewFileForm(prev => ({ ...prev, type: value as "file" | "folder" }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="file">File</SelectItem>
                              <SelectItem value="folder">Folder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateNewFile}>
                          Create
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {renderFileTree(filteredTree)}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {openFiles.length > 0 ? (
              <>
                {/* Tabs */}
                <div className="border-b bg-muted/30">
                  <Tabs value={activeFileId || ""} onValueChange={setActiveFileId} className="w-full">
                    <TabsList className="w-full justify-start h-10 bg-transparent border-0 rounded-none">
                      {openFiles.map((file) => (
                        <TabsTrigger 
                          key={file.id} 
                          value={file.id} 
                          className="relative group data-[state=active]:bg-background border-r h-full rounded-none"
                        >
                          <span className="flex items-center gap-2">
                            <span>{editorService.getLanguageIcon(file.language)}</span>
                            {file.name}
                            {file.isDirty && <span className="w-2 h-2 bg-primary rounded-full" />}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
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
                  </Tabs>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  {activeFile && (
                    <MonacoEditor
                      height="100%"
                      language={activeFile.language}
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      value={activeFile.content}
                      onChange={handleContentChange}
                      onMount={handleEditorDidMount}
                      options={{
                        fontSize,
                        tabSize,
                        wordWrap: wordWrap ? 'on' : 'off',
                        minimap: { enabled: minimap },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        roundedSelection: false,
                        padding: { top: 10 },
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        snippetSuggestions: 'top'
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files open</h3>
                  <p className="text-muted-foreground mb-4">
                    Open a file from the explorer or create a new one to start coding
                  </p>
                  <Button onClick={() => setShowNewFileDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
