"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  File,
  Download,
  Eye,
  Lock,
  Calendar,
  User,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react'
import { FileSharingService, type ShareLinkInfo } from '@/lib/file-sharing-service'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { TanukiLogo } from '@/components/tanuki-logo'
import { toast } from 'sonner'

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  default: FileText
}

export default function SharePage() {
  const params = useParams()
  const shareToken = params.id as string

  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [verifyingPassword, setVerifyingPassword] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadShareInfo()
  }, [shareToken])

  const loadShareInfo = async () => {
    if (!shareToken) return

    setLoading(true)
    setError(null)

    try {
      const info = await FileSharingService.getShareInfo(shareToken)
      
      if (!info) {
        setError('Share link not found or is invalid')
      } else {
        setShareInfo(info)
        // If no password required, consider it verified
        if (!info.requiresPassword) {
          setPasswordVerified(true)
        }
      }
    } catch (err) {
      console.error('Error loading share info:', err)
      setError('Failed to load share information')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('Please enter a password')
      return
    }

    setVerifyingPassword(true)
    try {
      const isValid = await FileSharingService.verifySharePassword(shareToken, password)
      
      if (isValid) {
        setPasswordVerified(true)
        toast.success('Password verified successfully')
      } else {
        toast.error('Incorrect password')
      }
    } catch (err) {
      console.error('Error verifying password:', err)
      toast.error('Failed to verify password')
    } finally {
      setVerifyingPassword(false)
    }
  }

  const handleDownload = async () => {
    if (!shareInfo) return

    setDownloading(true)
    try {
      const result = await FileSharingService.downloadSharedFile(
        shareToken,
        shareInfo.requiresPassword ? password : undefined
      )

      if (result.success && result.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = result.url
        link.download = shareInfo.file.original_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Download started')
        
        // Refresh share info to update download count
        setTimeout(() => loadShareInfo(), 1000)
      } else {
        toast.error(result.error || 'Failed to download file')
      }
    } catch (err) {
      console.error('Error downloading file:', err)
      toast.error('Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const getFileTypeIcon = (mimeType: string | null) => {
    if (!mimeType) return FILE_TYPE_ICONS.default

    if (mimeType.startsWith('image/')) return FILE_TYPE_ICONS.image
    if (mimeType.startsWith('video/')) return FILE_TYPE_ICONS.video
    if (mimeType.startsWith('audio/')) return FILE_TYPE_ICONS.audio
    if (mimeType.includes('zip') || mimeType.includes('archive')) return FILE_TYPE_ICONS.archive
    
    return FILE_TYPE_ICONS.default
  }

  const canPreview = () => {
    if (!shareInfo?.file.mime_type) return false
    
    const previewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown', 'application/json',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg'
    ]
    
    return previewableTypes.includes(shareInfo.file.mime_type)
  }

  const canDownload = () => {
    return shareInfo?.share.permissions.includes('download') || false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-center text-muted-foreground">
              Loading shared file...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !shareInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <TanukiLogo size={60} />
            </div>
            <CardTitle className="text-2xl">Share Not Found</CardTitle>
            <CardDescription>
              This share link is invalid, expired, or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || shareInfo?.errorMessage || 'Share link not found'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const FileIcon = getFileTypeIcon(shareInfo.file.mime_type)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TanukiLogo size={32} />
              <div>
                <h1 className="font-semibold">Tanuki Storage</h1>
                <p className="text-sm text-muted-foreground">Secure File Sharing</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Shared File</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Password Form */}
          {shareInfo.requiresPassword && !passwordVerified && (
            <Card>
              <CardHeader className="text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>Password Protected</CardTitle>
                <CardDescription>
                  This file is password protected. Please enter the password to continue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={verifyingPassword}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={verifyingPassword || !password.trim()}
                  >
                    {verifyingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Access File'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* File Information */}
          {passwordVerified && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <FileIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl break-all">
                        {shareInfo.file.original_name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Shared via Tanuki Storage
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">File Size</p>
                      <p className="font-medium">
                        {shareInfo.file.size ? formatBytes(shareInfo.file.size) : 'Unknown'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">File Type</p>
                      <p className="font-medium">
                        {shareInfo.file.mime_type || 'Unknown'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Shared</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(shareInfo.share.created_at))} ago
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">
                        {shareInfo.share.download_count}
                        {shareInfo.share.max_downloads && ` / ${shareInfo.share.max_downloads}`}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {shareInfo.share.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="flex items-center space-x-1">
                          {permission === 'view' && <Eye className="w-3 h-3" />}
                          {permission === 'download' && <Download className="w-3 h-3" />}
                          <span className="capitalize">{permission}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Expiry Info */}
                  {shareInfo.share.expires_at && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Expires</p>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(shareInfo.share.expires_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {canPreview() && shareInfo.share.permissions.includes('view') && (
                      <Button variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    )}
                    
                    {canDownload() && (
                      <Button 
                        onClick={handleDownload}
                        disabled={downloading || shareInfo.downloadLimitReached}
                        className="flex-1"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {shareInfo.downloadLimitReached && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This file has reached its download limit and cannot be downloaded.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Security Notice</p>
                      <p className="text-xs text-muted-foreground">
                        This file was shared securely through Tanuki Storage. 
                        Only people with this link can access it. 
                        Downloads are tracked and logged for security purposes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
