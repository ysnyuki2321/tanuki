"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Save, 
  Download, 
  X, 
  Plus, 
  FileText, 
  Palette,
  Settings,
  Search,
  Replace,
  Loader2,
  Code,
  Eye,
  EyeOff
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import type { DbFile } from '@/lib/database-schema'
import { FileStorageService } from '@/lib/file-storage'
import { DemoFileStorageService } from '@/lib/demo-file-storage'
import { isSupabaseConfigured } from '@/lib/supabase-client'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="ml-2">Loading editor...</span>
    </div>
  )
})

interface CodeFile {
  id: string
  name: string
  content: string
  language: string
  saved: boolean
  original?: DbFile
}

interface CodeEditorProps {
  isOpen: boolean
  onClose: () => void
  initialFile?: DbFile
}

// Language mappings for file extensions
const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    sh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    dockerfile: 'dockerfile',
    txt: 'plaintext'
  }
  return languageMap[ext || ''] || 'plaintext'
}

export function EnhancedCodeEditor({ isOpen, onClose, initialFile }: CodeEditorProps) {
  const [files, setFiles] = useState<CodeFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const editorRef = useRef<any>(null)

  // Load initial file
  useEffect(() => {
    if (initialFile && isOpen) {
      loadFile(initialFile)
    }
  }, [initialFile, isOpen])

  const loadFile = async (file: DbFile) => {
    setIsLoading(true)
    try {
      let content = ''
      
      // Check if using demo mode
      const isDemoMode = !isSupabaseConfigured()
      
      if (isDemoMode) {
        // Get demo preview URL and fetch content
        const url = DemoFileStorageService.getPreviewUrl(file.id)
        if (url) {
          const response = await fetch(url)
          content = await response.text()
        }
      } else {
        // Get real file content
        const result = await FileStorageService.downloadFile(file.id)
        if (result.success && result.url) {
          const response = await fetch(result.url)
          content = await response.text()
        }
      }

      const newFile: CodeFile = {
        id: file.id,
        name: file.original_name,
        content,
        language: getLanguageFromExtension(file.original_name),
        saved: true,
        original: file
      }

      setFiles(prev => {
        const existing = prev.findIndex(f => f.id === file.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = newFile
          return updated
        } else {
          return [...prev, newFile]
        }
      })
      
      setActiveFileId(file.id)
      toast.success('File loaded successfully')
    } catch (error) {
      console.error('Failed to load file:', error)
      toast.error('Failed to load file')
    } finally {
      setIsLoading(false)
    }
  }

  const createNewFile = () => {
    const newFile: CodeFile = {
      id: `new-${Date.now()}`,
      name: 'untitled.txt',
      content: '',
      language: 'plaintext',
      saved: false
    }

    setFiles(prev => [...prev, newFile])
    setActiveFileId(newFile.id)
  }

  const closeFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file && !file.saved) {
      if (!confirm(`"${file.name}" has unsaved changes. Close anyway?`)) {
        return
      }
    }

    setFiles(prev => prev.filter(f => f.id !== fileId))
    
    if (activeFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
  }

  const saveFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return

    try {
      if (file.original) {
        // Update existing file
        // In real implementation, this would update the file content
        toast.success('File saved (demo mode)')
      } else {
        // Create new file
        const blob = new Blob([file.content], { type: 'text/plain' })
        const fileObject = new File([blob], file.name, { type: 'text/plain' })
        
        const isDemoMode = !isSupabaseConfigured()
        
        if (isDemoMode) {
          const result = await DemoFileStorageService.uploadFile({
            file: fileObject,
            onProgress: () => {}
          })
          
          if (result.success) {
            toast.success('File saved successfully')
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, saved: true } : f
            ))
          } else {
            toast.error(result.error || 'Failed to save file')
          }
        } else {
          const result = await FileStorageService.uploadFile({
            file: fileObject,
            onProgress: () => {}
          })
          
          if (result.success) {
            toast.success('File saved successfully')
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, saved: true } : f
            ))
          } else {
            toast.error(result.error || 'Failed to save file')
          }
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save file')
    }
  }

  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return

    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('File downloaded')
  }

  const handleEditorChange = useCallback((value: string | undefined, fileId: string) => {
    if (value === undefined) return

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, content: value, saved: false }
        : f
    ))
  }, [])

  const handleSearch = () => {
    if (!editorRef.current || !searchQuery) return
    
    editorRef.current.getAction('actions.find').run()
  }

  const handleReplace = () => {
    if (!editorRef.current || !searchQuery) return
    
    editorRef.current.getAction('editor.action.startFindReplaceAction').run()
  }

  const activeFile = files.find(f => f.id === activeFileId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Code Editor
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
              >
                <Palette className="w-4 h-4 mr-2" />
                {theme === 'vs-dark' ? 'Light' : 'Dark'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? <EyeOff className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-8rem)]">
          {/* File Tabs */}
          <div className="flex items-center gap-2 border-b pb-2 mb-4">
            <div className="flex-1 flex items-center gap-1 overflow-x-auto">
              {files.map((file) => (
                <Button
                  key={file.id}
                  variant={activeFileId === file.id ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 min-w-0"
                  onClick={() => setActiveFileId(file.id)}
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  {!file.saved && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-4 w-4 ml-1 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeFile(file.id)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={createNewFile}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Search/Replace Bar */}
          {showSearch && (
            <div className="flex items-center gap-2 p-2 border rounded-md mb-4">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Input
                placeholder="Replace..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReplace}>
                <Replace className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 border rounded-md overflow-hidden">
            {activeFile ? (
              <MonacoEditor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                theme={theme}
                onChange={(value) => handleEditorChange(value, activeFile.id)}
                onMount={(editor) => {
                  editorRef.current = editor
                }}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  folding: true,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  tabSize: 2,
                  insertSpaces: true
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Code className="w-16 h-16 mb-4" />
                <p className="text-lg mb-2">No file open</p>
                <p className="text-sm mb-4">Create a new file or open an existing one to start coding</p>
                <Button onClick={createNewFile}>
                  <Plus className="w-4 h-4 mr-2" />
                  New File
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          {activeFile && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{activeFile.language}</Badge>
                <span className="text-sm text-muted-foreground">
                  {activeFile.content.length} characters
                </span>
                <span className="text-sm text-muted-foreground">
                  {activeFile.content.split('\n').length} lines
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(activeFile.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => saveFile(activeFile.id)}
                  disabled={activeFile.saved || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {activeFile.saved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedCodeEditor
