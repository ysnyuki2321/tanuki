'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileStorageService } from '@/lib/file-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Eye, 
  Lock, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { TanukiLogo } from '@/components/tanuki-logo';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ShareData {
  id: string;
  file_id: string;
  shared_by: string;
  shared_with_email: string | null;
  token: string;
  permissions: string[];
  password_hash: string | null;
  expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
  created_at: string;
  file: {
    id: string;
    name: string;
    original_name: string;
    size: number | null;
    mime_type: string | null;
    file_type: string | null;
    extension: string | null;
    created_at: string;
  };
  sharer: {
    full_name: string | null;
    email: string;
  };
}

export default function SharePage() {
  const params = useParams();
  const shareToken = params.id as string;

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  useEffect(() => {
    if (shareToken) {
      loadShareData();
    }
  }, [shareToken]);

  const loadShareData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        setError('Database not configured');
        return;
      }

      // Load share data with file and user info
      const { data, error: shareError } = await supabase
        .from('shares')
        .select(`
          *,
          file:files(
            id, name, original_name, size, mime_type, file_type, extension, created_at
          ),
          sharer:users!shared_by(
            full_name, email
          )
        `)
        .eq('token', shareToken)
        .single();

      if (shareError || !data) {
        setError('Share link not found or has expired');
        return;
      }

      // Check if share has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This share link has expired');
        return;
      }

      // Check if download limit exceeded
      if (data.max_downloads && data.download_count >= data.max_downloads) {
        setError('Download limit exceeded for this file');
        return;
      }

      // Check if password is required
      if (data.password_hash) {
        setIsPasswordRequired(true);
      }

      setShareData(data as ShareData);
    } catch (error) {
      console.error('Error loading share data:', error);
      setError('Failed to load share information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password || !shareData) return;

    try {
      // Hash the password and compare (simplified - in real app, do this server-side)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === shareData.password_hash) {
        setIsPasswordRequired(false);
        toast.success('Password correct');
      } else {
        toast.error('Incorrect password');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error('Password verification failed');
    }
  };

  const handleDownload = async () => {
    if (!shareData || !shareData.permissions.includes('download')) {
      toast.error('Download permission not granted');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await FileStorageService.downloadFile(shareData.file_id);
      
      if (result.success && result.url) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.url;
        link.download = shareData.file.original_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update download count
        if (supabase) {
          await supabase
            .from('shares')
            .update({ 
              download_count: shareData.download_count + 1 
            })
            .eq('id', shareData.id);
        }

        toast.success('Download started');
      } else {
        toast.error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!shareData || !shareData.permissions.includes('read')) {
      toast.error('Preview permission not granted');
      return;
    }

    setIsViewing(true);
    try {
      const result = await FileStorageService.downloadFile(shareData.file_id);
      
      if (result.success && result.url) {
        // Open in new tab for preview
        window.open(result.url, '_blank');
        toast.success('Opening preview');
      } else {
        toast.error(result.error || 'Preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Preview failed');
    } finally {
      setIsViewing(false);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      case 'archive': return <Archive className="w-6 h-6" />;
      case 'text': return <Code className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <TanukiLogo size={48} />
            <CardTitle className="flex items-center justify-center gap-2 mt-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <TanukiLogo size={32} />
            <Badge variant="outline">Shared File</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {isPasswordRequired ? (
            // Password Required
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  This file is password protected. Enter the password to access it.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="Enter password"
                  />
                </div>

                <Button 
                  onClick={handlePasswordSubmit}
                  className="w-full"
                  disabled={!password}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Unlock File
                </Button>
              </CardContent>
            </Card>
          ) : (
            // File Details and Actions
            <div className="space-y-6">
              {/* File Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      {getFileIcon(shareData.file.file_type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{shareData.file.original_name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(shareData.file.size)}</span>
                        <span>•</span>
                        <span className="capitalize">{shareData.file.file_type || 'Unknown'} file</span>
                        <span>•</span>
                        <span>{format(new Date(shareData.file.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Share Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>Shared by {shareData.sharer.full_name || shareData.sharer.email}</span>
                    </div>
                    
                    {shareData.expires_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Expires on {format(new Date(shareData.expires_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-sm">Permissions:</span>
                      {shareData.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission === 'read' ? 'View' : permission === 'download' ? 'Download' : permission}
                        </Badge>
                      ))}
                    </div>

                    {shareData.max_downloads && (
                      <div className="text-sm text-muted-foreground">
                        Downloads: {shareData.download_count} / {shareData.max_downloads}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shareData.permissions.includes('read') && (
                      <Button 
                        onClick={handlePreview}
                        disabled={isViewing}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isViewing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {isViewing ? 'Opening...' : 'Preview'}
                      </Button>
                    )}

                    {shareData.permissions.includes('download') && (
                      <Button 
                        onClick={handleDownload}
                        disabled={isDownloading || (shareData.max_downloads && shareData.download_count >= shareData.max_downloads)}
                        className="flex items-center gap-2"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </Button>
                    )}
                  </div>

                  {shareData.max_downloads && shareData.download_count >= shareData.max_downloads && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This file has reached its download limit.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Powered by Tanuki Storage</p>
                <Button variant="link" onClick={() => window.location.href = '/'}>
                  Create your own storage
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
