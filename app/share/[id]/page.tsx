"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { SecureFileSharingService, type ShareLink, type ShareComment } from "@/lib/secure-sharing"
import { formatBytes } from "@/lib/utils"
import { TanukiLogo } from "@/components/tanuki-logo"
import {
  Download,
  Eye,
  Lock,
  Calendar,
  Users,
  MessageCircle,
  Send,
  Heart,
  ThumbsUp,
  Smile,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  AlertTriangle,
  CheckCircle,
  Timer,
  Globe,
  Shield,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react"

export default function SharePage() {
  const params = useParams()
  const shareId = params.id as string
  
  const [share, setShare] = useState<ShareLink | null>(null)
  const [comments, setComments] = useState<ShareComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState("")
  const [newComment, setNewComment] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const sharingService = SecureFileSharingService.getInstance()

  useEffect(() => {
    loadShare()
  }, [shareId])

  const loadShare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const shareData = await sharingService.getShare(shareId)
      if (!shareData) {
        setError("Share not found or has been removed")
        return
      }

      // Check if password is required
      if (shareData.password) {
        setPasswordRequired(true)
        return
      }

      // Validate access
      const validation = await sharingService.validateAccess(
        shareId,
        undefined,
        undefined,
        getClientIP()
      )

      if (!validation.valid) {
        setError(validation.reason || "Access denied")
        return
      }

      setShare(shareData)
      
      // Record view
      await sharingService.recordView(shareId, getClientIP(), navigator.userAgent, document.referrer)
      
      // Load comments if allowed
      if (shareData.permissions.canComment) {
        const commentsData = await sharingService.getComments(shareId)
        setComments(commentsData)
      }

    } catch (err) {
      setError("Failed to load shared file")
      console.error("Error loading share:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!password) return

    try {
      const validation = await sharingService.validateAccess(
        shareId,
        password,
        undefined,
        getClientIP()
      )

      if (!validation.valid) {
        setError(validation.reason || "Invalid password")
        return
      }

      setPasswordRequired(false)
      await loadShare()
    } catch (err) {
      setError("Authentication failed")
    }
  }

  const handleDownload = async () => {
    if (!share) return

    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      // Record download
      const canDownload = await sharingService.recordDownload(shareId, getClientIP(), navigator.userAgent)
      
      if (!canDownload) {
        setError("Download not permitted or limit reached")
        return
      }

      // Simulate download progress
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            // In a real implementation, trigger the actual file download
            console.log(`Downloading file: ${share.fileName}`)
            const link = document.createElement('a')
            link.href = `/api/files/${share.fileId}/download?token=${shareId}`
            link.download = share.fileName
            link.click()
            return 100
          }
          return prev + 10
        })
      }, 200)

    } catch (err) {
      setError("Download failed")
    } finally {
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 1000)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !userName.trim()) return

    try {
      await sharingService.addComment(
        shareId,
        newComment,
        userName,
        userEmail || undefined
      )

      const updatedComments = await sharingService.getComments(shareId)
      setComments(updatedComments)
      setNewComment("")
    } catch (err) {
      console.error("Failed to add comment:", err)
    }
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      await sharingService.addReaction(commentId, emoji, 'anonymous-user')
      const updatedComments = await sharingService.getComments(shareId)
      setComments(updatedComments)
    } catch (err) {
      console.error("Failed to add reaction:", err)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-green-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-8 w-8 text-red-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-8 w-8 text-purple-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-8 w-8 text-orange-500" />
    if (mimeType.includes('javascript') || mimeType.includes('python')) return <Code className="h-8 w-8 text-indigo-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const getClientIP = () => {
    // In a real implementation, get actual client IP
    return '192.168.1.100'
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    // Show success message
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading shared file...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <TanukiLogo size={48} className="mx-auto mb-4" />
            <CardTitle className="flex items-center gap-2 justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <TanukiLogo size={48} className="mx-auto mb-4" />
            <CardTitle className="flex items-center gap-2 justify-center">
              <Lock className="h-5 w-5" />
              Password Protected
            </CardTitle>
            <CardDescription>
              This shared file is password protected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={handlePasswordSubmit} className="w-full" disabled={!password}>
                <Lock className="h-4 w-4 mr-2" />
                Access File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!share) return null

  const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date()
  const isDownloadLimitReached = share.maxDownloads && share.downloadCount >= share.maxDownloads

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TanukiLogo size={32} />
              <div>
                <h1 className="text-lg font-semibold">Tanuki Storage</h1>
                <p className="text-sm text-muted-foreground">Secure File Sharing</p>
              </div>
            </div>
            <Button variant="outline" onClick={copyShareUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* File Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  {getFileIcon(share.mimeType)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{share.fileName}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {formatBytes(share.fileSize)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {share.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {share.downloadCount} downloads
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Shared {new Date(share.createdAt).toLocaleDateString()}
                      </span>
                      {share.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          Expires {new Date(share.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {share.permissions.canView && (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Badge>
                )}
                {share.permissions.canDownload && (
                  <Badge variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Badge>
                )}
                {share.permissions.canComment && (
                  <Badge variant="outline">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Comment
                  </Badge>
                )}
                {share.password && (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                )}
                {share.allowedDomains.length > 0 && (
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Domain Restricted
                  </Badge>
                )}
              </div>

              {isExpired && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This share has expired and is no longer accessible.
                  </AlertDescription>
                </Alert>
              )}

              {isDownloadLimitReached && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Download limit has been reached for this file.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                {share.permissions.canDownload && !isExpired && !isDownloadLimitReached && (
                  <Button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {isDownloading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Downloading...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          {share.permissions.canComment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
                <CardDescription>
                  Share your thoughts about this file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add Comment Form */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userName">Your Name *</Label>
                      <Input
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="userEmail">Email (optional)</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment here..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || !userName.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>

                <Separator className="my-6" />

                {/* Comments List */}
                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`} />
                              <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                                {comment.isEdited && (
                                  <Badge variant="outline" className="text-xs">edited</Badge>
                                )}
                              </div>
                              <p className="text-sm">{comment.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {comment.reactions.map((reaction) => (
                                  <Button
                                    key={reaction.emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleReaction(comment.id, reaction.emoji)}
                                  >
                                    {reaction.emoji} {reaction.count}
                                  </Button>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReaction(comment.id, '👍')}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReaction(comment.id, '❤️')}
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReaction(comment.id, '😊')}
                                >
                                  <Smile className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {comment.parentId && <Separator className="ml-11" />}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* File Details */}
          <Card>
            <CardHeader>
              <CardTitle>File Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">File Type</p>
                  <p className="font-medium">{share.mimeType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Size</p>
                  <p className="font-medium">{formatBytes(share.fileSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Views</p>
                  <p className="font-medium">{share.viewCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Downloads</p>
                  <p className="font-medium">{share.downloadCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Shared On</p>
                  <p className="font-medium">{new Date(share.createdAt).toLocaleDateString()}</p>
                </div>
                {share.expiresAt && (
                  <div>
                    <p className="text-muted-foreground mb-1">Expires On</p>
                    <p className="font-medium">{new Date(share.expiresAt).toLocaleDateString()}</p>
                  </div>
                )}
                {share.maxDownloads && (
                  <div>
                    <p className="text-muted-foreground mb-1">Download Limit</p>
                    <p className="font-medium">{share.downloadCount} / {share.maxDownloads}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Last Accessed</p>
                  <p className="font-medium">
                    {share.analytics.lastAccessed 
                      ? new Date(share.analytics.lastAccessed).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <TanukiLogo size={20} />
            <span>Tanuki Storage</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Add missing import
import { Loader2 } from "lucide-react"
