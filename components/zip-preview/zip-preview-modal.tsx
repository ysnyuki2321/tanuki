"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ZipPreviewService, type ZipArchive, type ZipTreeNode } from "@/lib/zip-preview"
import { ZipFileTree } from "./zip-file-tree"
import { ZipFilePreview } from "./zip-file-preview"
import { ZipArchiveInfo } from "./zip-archive-info"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, FolderTree, Eye, Info } from "lucide-react"
import { Loader2 } from "lucide-react"

interface ZipPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
}

export function ZipPreviewModal({ isOpen, onClose, fileName }: ZipPreviewModalProps) {
  const [archive, setArchive] = useState<ZipArchive | null>(null)
  const [fileTree, setFileTree] = useState<ZipTreeNode[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const zipService = ZipPreviewService.getInstance()

  useEffect(() => {
    if (isOpen && fileName) {
      loadZipArchive()
    }
  }, [isOpen, fileName])

  const loadZipArchive = async () => {
    setIsLoading(true)
    try {
      const zipArchive = await zipService.analyzeZip(fileName)
      setArchive(zipArchive)

      const tree = zipService.buildFileTree(zipArchive.entries)
      setFileTree(tree)
    } catch (error) {
      console.error("Failed to analyze zip:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath)
  }

  const handleClose = () => {
    setArchive(null)
    setFileTree([])
    setSelectedFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[80vh] sm:h-[80vh] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="truncate">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm sm:text-base">Analyzing zip archive...</p>
            </div>
          </div>
        ) : archive ? (
          <div className="flex-1 p-4 sm:p-6 pt-0">
            <Tabs defaultValue="tree" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Archive Info</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="tree" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FolderTree className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">File Tree</span>
                  <span className="sm:hidden">Tree</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" disabled={!selectedFile}>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">File Preview</span>
                  <span className="sm:hidden">Preview</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1">
                <ZipArchiveInfo archive={archive} />
              </TabsContent>

              <TabsContent value="tree" className="flex-1">
                <ZipFileTree
                  tree={fileTree}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  archive={archive}
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1">
                {selectedFile ? (
                  <ZipFilePreview filePath={selectedFile} archive={archive} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm sm:text-base">Select a file to preview</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm sm:text-base">Failed to load zip archive</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
