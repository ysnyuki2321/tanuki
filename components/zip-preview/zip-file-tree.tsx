"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZipPreviewService, type ZipTreeNode, type ZipArchive } from "@/lib/zip-preview"
import { ChevronRight, ChevronDown, Download } from "lucide-react"

interface ZipFileTreeProps {
  tree: ZipTreeNode[]
  selectedFile: string | null
  onFileSelect: (filePath: string) => void
  archive: ZipArchive
}

export function ZipFileTree({ tree, selectedFile, onFileSelect, archive }: ZipFileTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([""]))

  const zipService = ZipPreviewService.getInstance()

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }

  const handleExtractFile = async (filePath: string) => {
    try {
      const blob = await zipService.extractFile(archive.name, filePath)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filePath.split("/").pop() || "file"
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to extract file:", error)
    }
  }

  const renderNode = (node: ZipTreeNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.path)
    const isSelected = selectedFile === node.path
    const hasChildren = node.children.length > 0

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 sm:gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            isSelected ? "bg-primary/10 border border-primary/20" : ""
          }`}
          style={{ paddingLeft: `${Math.min(level * 16 + 8, 120)}px` }}
          onClick={() => {
            if (node.isDirectory) {
              toggleNode(node.path)
            } else {
              onFileSelect(node.path)
            }
          }}
        >
          {node.isDirectory && hasChildren && (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={(e) => e.stopPropagation()}>
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}

          {(!node.isDirectory || !hasChildren) && <div className="w-4" />}

          <span className="text-base sm:text-lg">{node.entry ? zipService.getFileIcon(node.entry) : "📁"}</span>

          <span className="flex-1 text-xs sm:text-sm font-medium truncate">{node.name}</span>

          {!node.isDirectory && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">{zipService.formatFileSize(node.size)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleExtractFile(node.path)
                }}
                title="Download file"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {node.isDirectory && isExpanded && <div>{node.children.map((child) => renderNode(child, level + 1))}</div>}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">Archive Contents</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 sm:max-h-96 overflow-auto p-2 sm:p-4 space-y-1 group">{tree.map((node) => renderNode(node))}</div>
      </CardContent>
    </Card>
  )
}
