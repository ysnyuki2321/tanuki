'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FileStorageService } from '@/lib/file-storage';
import { type DbFile } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Download, 
  Upload, 
  FileText, 
  Folder,
  Settings,
  Play,
  Terminal,
  Eye,
  EyeOff,
  RotateCcw,
  Copy,
  Search,
  Replace,
  Zap,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface OpenFile {
  id: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  file?: DbFile;
}

interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  tabSize: number;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', ext: '.js' },
  { value: 'typescript', label: 'TypeScript', ext: '.ts' },
  { value: 'python', label: 'Python', ext: '.py' },
  { value: 'java', label: 'Java', ext: '.java' },
  { value: 'csharp', label: 'C#', ext: '.cs' },
  { value: 'cpp', label: 'C++', ext: '.cpp' },
  { value: 'html', label: 'HTML', ext: '.html' },
  { value: 'css', label: 'CSS', ext: '.css' },
  { value: 'json', label: 'JSON', ext: '.json' },
  { value: 'xml', label: 'XML', ext: '.xml' },
  { value: 'sql', label: 'SQL', ext: '.sql' },
  { value: 'php', label: 'PHP', ext: '.php' },
  { value: 'ruby', label: 'Ruby', ext: '.rb' },
  { value: 'go', label: 'Go', ext: '.go' },
  { value: 'rust', label: 'Rust', ext: '.rs' },
  { value: 'markdown', label: 'Markdown', ext: '.md' },
  { value: 'yaml', label: 'YAML', ext: '.yml' },
  { value: 'shell', label: 'Shell', ext: '.sh' },
];

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: false,
  tabSize: 2,
};

export function RealCodeEditor() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [recentFiles, setRecentFiles] = useState<DbFile[]>([]);
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load recent code files
  useEffect(() => {
    if (user) {
      loadRecentFiles();
    }
  }, [user]);

  // Auto-save functionality
  useEffect(() => {
    if (settings.autoSave && activeFileId) {
      const activeFile = openFiles.find(f => f.id === activeFileId);
      if (activeFile?.isDirty) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          handleSaveFile();
        }, 2000); // Auto-save after 2 seconds of inactivity
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [openFiles, activeFileId, settings.autoSave]);

  const loadRecentFiles = async () => {
    if (!user) return;

    try {
      const files = await FileStorageService.listFiles({
        userId: user.id,
        limit: 10,
      });
      
      // Filter for code files
      const codeFiles = files.filter(file => {
        const supportedExts = SUPPORTED_LANGUAGES.map(lang => lang.ext);
        return supportedExts.some(ext => file.original_name.endsWith(ext));
      });
      
      setRecentFiles(codeFiles);
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  };

  const detectLanguage = (filename: string): string => {
    const ext = filename.substring(filename.lastIndexOf('.'));
    const language = SUPPORTED_LANGUAGES.find(lang => lang.ext === ext);
    return language?.value || 'plaintext';
  };

  const createNewFile = (language: string = 'javascript') => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.value === language);
    const newFile: OpenFile = {
      id: `new-${Date.now()}`,
      name: `untitled${langInfo?.ext || '.txt'}`,
      content: '',
      language,
      isDirty: false,
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const openFile = async (file: DbFile) => {
    setIsLoading(true);
    try {
      // Check if file is already open
      const existingFile = openFiles.find(f => f.file?.id === file.id);
      if (existingFile) {
        setActiveFileId(existingFile.id);
        return;
      }

      // Download file content
      const result = await FileStorageService.downloadFile(file.id);
      if (!result.success || !result.url) {
        toast.error('Failed to load file content');
        return;
      }

      // Fetch content from URL
      const response = await fetch(result.url);
      const content = await response.text();

      const openFile: OpenFile = {
        id: file.id,
        name: file.original_name,
        content,
        language: detectLanguage(file.original_name),
        isDirty: false,
        file,
      };

      setOpenFiles(prev => [...prev, openFile]);
      setActiveFileId(file.id);
      toast.success('File opened successfully');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFileId || !value) return;

    setOpenFiles(prev => prev.map(file => 
      file.id === activeFileId 
        ? { ...file, content: value, isDirty: true }
        : file
    ));
  };

  const handleSaveFile = async () => {
    if (!activeFileId || !user) return;

    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    setIsSaving(true);
    try {
      // Create blob from content
      const blob = new Blob([activeFile.content], { type: 'text/plain' });
      const file = new File([blob], activeFile.name, { type: 'text/plain' });

      // Upload file
      const result = await FileStorageService.uploadFile({
        file,
        isPublic: false,
      });

      if (result.success && result.file) {
        // Update the open file with saved state
        setOpenFiles(prev => prev.map(f => 
          f.id === activeFileId 
            ? { ...f, isDirty: false, file: result.file, id: result.file!.id }
            : f
        ));

        // Update active file ID if it was a new file
        if (activeFileId.startsWith('new-')) {
          setActiveFileId(result.file.id);
        }

        await loadRecentFiles();
        toast.success('File saved successfully');
      } else {
        toast.error(result.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseFile = (fileId: string) => {
    const file = openFiles.find(f => f.id === fileId);
    if (file?.isDirty) {
      if (!window.confirm('File has unsaved changes. Are you sure you want to close it?')) {
        return;
      }
    }

    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter(f => f.id !== fileId);
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const handleDownloadFile = () => {
    if (!activeFileId) return;

    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await file.text();
      const openFile: OpenFile = {
        id: `uploaded-${Date.now()}`,
        name: file.name,
        content,
        language: detectLanguage(file.name),
        isDirty: true,
      };

      setOpenFiles(prev => [...prev, openFile]);
      setActiveFileId(openFile.id);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => createNewFile()}
              size="sm"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              New File
            </Button>
            
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Open File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".js,.ts,.py,.java,.cs,.cpp,.html,.css,.json,.xml,.sql,.php,.rb,.go,.rs,.md,.yml,.sh,.txt"
              onChange={handleUploadFile}
              className="hidden"
            />

            <Select onValueChange={createNewFile}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="New file type" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveFile}
              size="sm"
              disabled={!activeFile?.isDirty || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>

            <Button
              onClick={handleDownloadFile}
              size="sm"
              variant="outline"
              disabled={!activeFile}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            <Button
              onClick={() => setShowSettings(!showSettings)}
              size="sm"
              variant="outline"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mt-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Editor Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium">Font Size</label>
                  <Input
                    type="number"
                    value={settings.fontSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    min={10}
                    max={30}
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Tab Size</label>
                  <Input
                    type="number"
                    value={settings.tabSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, tabSize: Number(e.target.value) }))}
                    min={2}
                    max={8}
                    className="h-8"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.wordWrap}
                    onChange={(e) => setSettings(prev => ({ ...prev, wordWrap: e.target.checked }))}
                  />
                  <label className="text-xs font-medium">Word Wrap</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                  />
                  <label className="text-xs font-medium">Auto Save</label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card p-3">
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="space-y-2">
              <h3 className="text-sm font-medium">Open Files</h3>
              {openFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No files open</p>
              ) : (
                <div className="space-y-1">
                  {openFiles.map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                        activeFileId === file.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs truncate">{file.name}</span>
                        {file.isDirty && <span className="text-orange-500">•</span>}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseFile(file.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="space-y-2">
              <h3 className="text-sm font-medium">Recent Files</h3>
              {recentFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent files</p>
              ) : (
                <div className="space-y-1">
                  {recentFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted"
                      onClick={() => openFile(file)}
                    >
                      <FileText className="w-3 h-3" />
                      <span className="text-xs truncate">{file.original_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          {openFiles.length > 0 && (
            <div className="border-b bg-card">
              <div className="flex overflow-x-auto">
                {openFiles.map(file => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer hover:bg-muted ${
                      activeFileId === file.id ? 'bg-muted border-b-2 border-primary' : ''
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <span className="text-sm">{file.name}</span>
                    {file.isDirty && <span className="text-orange-500">•</span>}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseFile(file.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor Content */}
          <div className="flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleEditorChange}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  fontSize: settings.fontSize,
                  wordWrap: settings.wordWrap ? 'on' : 'off',
                  minimap: { enabled: settings.minimap },
                  lineNumbers: settings.lineNumbers ? 'on' : 'off',
                  tabSize: settings.tabSize,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  renderWhitespace: 'selection',
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No file open</h3>
                  <p className="text-sm mb-4">Create a new file or open an existing one to start coding</p>
                  <Button onClick={() => createNewFile()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Create New File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-card px-3 py-1 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeFile && (
            <>
              <span>Language: {activeFile.language}</span>
              <span>Lines: {activeFile.content.split('\n').length}</span>
              <span>Characters: {activeFile.content.length}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {settings.autoSave && <Badge variant="secondary" className="text-xs">Auto Save</Badge>}
          {activeFile?.isDirty && <Badge variant="outline" className="text-xs text-orange-500">Unsaved</Badge>}
        </div>
      </div>
    </div>
  );
}

export default RealCodeEditor;
