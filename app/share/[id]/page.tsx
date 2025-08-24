"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TanukiLogo } from "@/components/tanuki-logo"
import {
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  ImageIcon,
  Code,
  Database,
  Archive,
  Music,
  Video,
  File,
} from "lucide-react"
import { useParams } from "next/navigation"

interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  sharedBy: string
  sharedAt: string
  expiresAt?: string
  downloadCount: number
  maxDownloads?: number
  password?: boolean
}

export default function SharePage() {
  const params = useParams()
  const shareId = params.id as string
  const [file, setFile] = useState<SharedFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSharedFile = async () => {
      try {
        // Mock shared file data
        await new Promise((resolve) => setTimeout(resolve, 500))

        const mockFiles: Record<string, SharedFile> = {
          "demo-project": {
            id: "demo-project",
            name: "tanuki-web-app.zip",
            type: "application/zip",
            size: 15728640, // 15MB
            sharedBy: "admin@tanuki.dev",
            sharedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(), // 6 days from now
            downloadCount: 23,
            maxDownloads: 100,
            password: false,
          },
          "sample-database": {
            id: "sample-database",
            name: "users.sql",
            type: "application/sql",
            size: 2048576, // 2MB
            sharedBy: "developer@tanuki.dev",
            sharedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            downloadCount: 5,
            password: true,
          },
        }

        const sharedFile = mockFiles[shareId]
        if (sharedFile) {
          setFile(sharedFile)
        } else {
          setError("File not found or link has expired")
        }
      } catch (err) {
        setError("Failed to load shared file")
      } finally {
        setLoading(false)
      }
    }

    loadSharedFile()
  }, [shareId])

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="h-8 w-8 text-green-500" />
    if (type.includes("video")) return <Video className="h-8 w-8 text-red-500" />
    if (type.includes("audio")) return <Music className="h-8 w-8 text-pink-500" />
    if (type.includes("zip") || type.includes("archive")) return <Archive className="h-8 w-8 text-yellow-500" />
    if (type.includes("sql") || type.includes("database")) return <Database className="h-8 w-8 text-orange-500" />
    if (type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css")) {
      return <Code className="h-8 w-8 text-purple-500" />
    }
    if (type.includes("text") || type.includes("document")) return <FileText className="h-8 w-8 text-blue-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = () => {
    if (!file) return
    console.log(`[v0] Downloading file: ${file.name}`)
    // In a real app, this would trigger the actual download
    alert(`Downloading ${file.name}...`)
  }

  const handlePreview = () => {
    if (!file) return
    console.log(`[v0] Previewing file: ${file.name}`)
    // In a real app, this would open a preview modal
    alert(`Preview not available for this file type`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <TanukiLogo className="h-16 w-16" />
            <h2 className="text-2xl font-bold">File Not Found</h2>
            <p className="text-center text-muted-foreground">
              {error || "The shared file you are looking for does not exist or has expired."}
            </p>
            <Button onClick={() => (window.location.href = "/")}>Go to Tanuki</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <TanukiLogo className="h-12 w-12 mr-3" />
          <h1 className="text-2xl font-bold">Tanuki Storage</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">{getFileIcon(file.type)}</div>
              <CardTitle className="text-2xl">{file.name}</CardTitle>
              <p className="text-muted-foreground">Shared file</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">File Size</p>
                  <p className="text-lg">{formatBytes(file.size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Downloads</p>
                  <p className="text-lg">
                    {file.downloadCount}
                    {file.maxDownloads && ` / ${file.maxDownloads}`}
                  </p>
                </div>
              </div>

              {/* Share Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Shared by {file.sharedBy}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Shared on {new Date(file.sharedAt).toLocaleDateString()}</span>
                </div>
                {file.expiresAt && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Expires on {new Date(file.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {file.password && <Badge variant="secondary">Password Protected</Badge>}
                {file.maxDownloads && (
                  <Badge variant="outline">
                    Limited Downloads ({file.maxDownloads - file.downloadCount} remaining)
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Security Notice:</strong> Only download files from trusted sources. Scan downloaded files with
                  antivirus software before opening.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Powered by Tanuki */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Powered by <strong>Tanuki Storage</strong> - Advanced file storage and sharing
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
