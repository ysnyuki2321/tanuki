"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface FileUploadZoneProps {
  onFilesUploaded: (files: File[]) => void
}

export function FileUploadZone({ onFilesUploaded }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        setUploadingFiles(files)
        onFilesUploaded(files)
        setTimeout(() => setUploadingFiles([]), 2000)
      }
    },
    [onFilesUploaded],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        setUploadingFiles(files)
        onFilesUploaded(files)
        setTimeout(() => setUploadingFiles([]), 2000)
      }
    },
    [onFilesUploaded],
  )

  return (
    <Card
      className={`transition-all ${
        isDragOver ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
        {uploadingFiles.length > 0 ? (
          <div className="space-y-2">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary animate-bounce" />
            <p className="text-sm font-medium">Uploading {uploadingFiles.length} file(s)...</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate px-2">
                  {file.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-base sm:text-lg font-medium">Drop files here to upload</p>
              <p className="text-xs sm:text-sm text-muted-foreground">or click to browse</p>
            </div>
            <div className="flex justify-center">
              <label className="inline-flex items-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
