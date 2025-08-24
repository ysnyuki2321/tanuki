"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ZipPreviewService, type ZipArchive, type ZipEntry } from "@/lib/zip-preview"
import { Download, FileText, Image, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface ZipFilePreviewProps {
  filePath: string
  archive: ZipArchive
}

export function ZipFilePreview({ filePath, archive }: ZipFilePreviewProps) {
  const [entry, setEntry] = useState<ZipEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const zipService = ZipPreviewService.getInstance()

  useEffect(() => {
    const foundEntry = archive.entries.find((e) => e.path === filePath)
    setEntry(foundEntry || null)
  }, [filePath, archive])

  const handleExtractFile = async () => {
    if (!entry) return

    try {
      const blob = await zipService.extractFile(archive.name, entry.path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = entry.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to extract file:", error)
    }
  }

  const isTextFile = (mimeType?: string) => {
    if (!mimeType) return false
    return (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/javascript" ||
      mimeType === "application/xml"
    )
  }

  const isImageFile = (mimeType?: string) => {
    if (!mimeType) return false
    return mimeType.startsWith("image/")
  }

  if (!entry) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">File not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{zipService.getFileIcon(entry)}</span>
            <div>
              <CardTitle className="text-base">{entry.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{entry.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{zipService.formatFileSize(entry.size)}</Badge>
            <Button variant="outline" size="sm" onClick={handleExtractFile}>
              <Download className="w-4 h-4 mr-2" />
              Extract
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{zipService.formatFileSize(entry.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compressed:</span>
              <span>{zipService.formatFileSize(entry.compressedSize)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compression:</span>
              <span>{(((entry.size - entry.compressedSize) / entry.size) * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{entry.mimeType || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modified:</span>
              <span>{entry.lastModified.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            {isTextFile(entry.mimeType) ? (
              <>
                <FileText className="w-4 h-4" />
                File Content
              </>
            ) : isImageFile(entry.mimeType) ? (
              <>
                <Image className="w-4 h-4" />
                Image Preview
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Preview Not Available
              </>
            )}
          </h4>

          {isTextFile(entry.mimeType) && entry.content ? (
            <Textarea
              value={entry.content}
              readOnly
              className="min-h-64 font-mono text-sm resize-none"
              placeholder="Loading file content..."
            />
          ) : isImageFile(entry.mimeType) ? (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>Image preview not available</p>
                  <p className="text-xs">Extract file to view image</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Preview not available for this file type</p>
                  <p className="text-xs">Extract file to view content</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
