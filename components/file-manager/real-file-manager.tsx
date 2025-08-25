'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileStorageService, type FileUploadOptions } from '@/lib/file-storage';
import { type DbFile } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  Trash2, 
  Share2, 
  Eye, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  Loader2,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface StorageUsage {
  used: number;
  quota: number;
  fileCount: number;
}

export function RealFileManager() {
  const { user, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<DbFile[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({ used: 0, quota: 0, fileCount: 0 });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Load files
  const loadFiles = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fileList = await FileStorageService.listFiles({
        userId: user.id,
        folderId: currentFolder || undefined,
        search: searchQuery || undefined,
      });
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentFolder, searchQuery]);

  // Load storage usage
  const loadStorageUsage = useCallback(async () => {
    if (!user) return;
    
    try {
      const usage = await FileStorageService.getStorageUsage(user.id);
      setStorageUsage(usage);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFiles();
      loadStorageUsage();
    }
  }, [isAuthenticated, user, loadFiles, loadStorageUsage]);

  // Handle file upload
  const handleFileUpload = async (fileList: FileList) => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const files = Array.from(fileList);
      const uploadPromises = files.map(file => 
        FileStorageService.uploadFile({
          file,
          folder: currentFolder || undefined,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
        })
      );

      const results = await Promise.all(uploadPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
        await loadFiles();
        await loadStorageUsage();
      }

      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file download
  const handleFileDownload = async (file: DbFile) => {
    try {
      const result = await FileStorageService.downloadFile(file.id);
      if (result.success && result.url) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.url;
        link.download = file.original_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
      } else {
        toast.error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  // Handle file delete
  const handleFileDelete = async (file: DbFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.original_name}"?`)) {
      return;
    }

    try {
      const result = await FileStorageService.deleteFile(file.id);
      if (result.success) {
        toast.success('File deleted successfully');
        await loadFiles();
        await loadStorageUsage();
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  // Handle file share
  const handleFileShare = async (file: DbFile) => {
    try {
      const result = await FileStorageService.shareFile(file.id, {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      if (result.success && result.shareToken) {
        const shareUrl = `${window.location.origin}/share/${result.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      } else {
        toast.error(result.error || 'Share failed');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Share failed');
    }
  };

  // Get file icon
  const getFileIcon = (file: DbFile) => {
    switch (file.file_type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      case 'text': return <Code className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format storage usage percentage
  const getStoragePercentage = () => {
    if (storageUsage.quota === 0) return 0;
    return Math.round((storageUsage.used / storageUsage.quota) * 100);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please sign in to access your files.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatFileSize(storageUsage.used)} used</span>
              <span>{formatFileSize(storageUsage.quota)} total</span>
            </div>
            <Progress value={getStoragePercentage()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{storageUsage.fileCount} files</span>
              <span>{getStoragePercentage()}% used</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Manager Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>File Manager</CardTitle>
            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(files);
                  };
                  input.click();
                }}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <Alert className="mb-4">
              <Upload className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Files */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No files found</p>
              <p className="text-sm">Upload your first file to get started</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 
              'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 
              'space-y-2'
            }>
              {files.map((file) => (
                <Card 
                  key={file.id} 
                  className={`${viewMode === 'grid' ? 'aspect-square' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <CardContent className={`p-4 ${viewMode === 'grid' ? 'h-full flex flex-col' : 'flex items-center justify-between'}`}>
                    <div className={`${viewMode === 'grid' ? 'flex-1 flex flex-col items-center justify-center' : 'flex items-center gap-3'}`}>
                      {getFileIcon(file)}
                      <div className={`${viewMode === 'grid' ? 'text-center mt-2' : 'flex-1'}`}>
                        <p className="text-sm font-medium truncate">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        {file.is_public && (
                          <Badge variant="secondary" className="text-xs mt-1">Public</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className={`${viewMode === 'grid' ? 'mt-2' : ''} flex items-center gap-1`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDownload(file)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileShare(file)}
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFileShare(file)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleFileDelete(file)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag and Drop Upload Zone */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent 
          className="p-8 text-center"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-primary');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              handleFileUpload(files);
            }
          }}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop files here to upload</p>
          <p className="text-sm text-muted-foreground mb-4">
            Or click the upload button above
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {formatFileSize(100 * 1024 * 1024)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealFileManager;
