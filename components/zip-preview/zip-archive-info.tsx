"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ZipArchive } from "@/lib/zip-preview"
import { Archive, File, Folder, Gauge } from "lucide-react"

interface ZipArchiveInfoProps {
  archive: ZipArchive
}

export function ZipArchiveInfo({ archive }: ZipArchiveInfoProps) {
  const compressionRatio = ((archive.totalSize - archive.compressedSize) / archive.totalSize) * 100
  const directoryCount = archive.entries.filter((entry) => entry.isDirectory).length

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Files</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archive.fileCount}</div>
            <p className="text-sm text-muted-foreground">Total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Folders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{directoryCount}</div>
            <p className="text-sm text-muted-foreground">Total folders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Original Size</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(archive.totalSize / 1024 / 1024).toFixed(1)}MB</div>
            <p className="text-sm text-muted-foreground">Uncompressed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Compression</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compressionRatio.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Space saved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archive Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Archive Name:</span>
                <span className="text-sm font-medium">{archive.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Entries:</span>
                <span className="text-sm font-medium">{archive.entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Compressed Size:</span>
                <span className="text-sm font-medium">{(archive.compressedSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uncompressed Size:</span>
                <span className="text-sm font-medium">{(archive.totalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Compression Ratio:</span>
                <Badge variant="secondary">{compressionRatio.toFixed(1)}%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Format:</span>
                <Badge variant="outline">ZIP</Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">File Types</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  archive.entries
                    .filter((entry) => !entry.isDirectory)
                    .map((entry) => entry.name.split(".").pop()?.toLowerCase())
                    .filter(Boolean),
                ),
              ).map((ext) => (
                <Badge key={ext} variant="outline" className="text-xs">
                  .{ext}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
