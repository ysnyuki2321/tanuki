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
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            {fileName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p>Analyzing zip archive...</p>
            </div>
          </div>
        ) : archive ? (
          <div className="flex-1 p-6 pt-0">
            <Tabs defaultValue="tree" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Archive Info
                </TabsTrigger>
                <TabsTrigger value="tree" className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  File Tree
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!selectedFile}>
                  <Eye className="w-4 h-4" />
                  File Preview
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
                    <p className="text-muted-foreground">Select a file to preview</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Failed to load zip archive</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
