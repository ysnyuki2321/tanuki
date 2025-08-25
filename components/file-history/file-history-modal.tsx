"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileVersioningService, 
  type FileVersion,
  type VersionComparison 
} from "@/lib/file-versioning"
import type { FileItem } from "@/lib/file-system"
import { 
  Clock, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  Download, 
  Trash2, 
  Search,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react"

interface FileHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  file: FileItem
  onRestoreVersion?: (versionId: string) => void
}

export function FileHistoryModal({ isOpen, onClose, file, onRestoreVersion }: FileHistoryModalProps) {
  const [fileHistory, setFileHistory] = useState<FileVersion[] | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const versioningService = FileVersioningService

  useEffect(() => {
    if (isOpen && file) {
      loadFileHistory()
    }
  }, [isOpen, file])

  const loadFileHistory = async () => {
    setIsLoading(true)
    try {
      const history = await versioningService.getFileVersions(file.id)
      setFileHistory(history)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load file history" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(prev => prev.filter(id => id !== versionId))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, versionId])
    } else {
      setSelectedVersions([selectedVersions[1], versionId])
    }
  }

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) return

    setIsLoading(true)
    try {
      const comp = await versioningService.compareVersions(file.id, parseInt(selectedVersions[0]), parseInt(selectedVersions[1]))
      setComparison(comp)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to compare versions" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to restore this version? This will create a new version with the restored content.")) {
      return
    }

    setIsLoading(true)
    try {
      const success = await versioningService.restoreToVersion(file.id, parseInt(versionId))
      if (success) {
        setMessage({ type: "success", text: "Version restored successfully" })
        await loadFileHistory()
        onRestoreVersion?.(versionId)
      } else {
        setMessage({ type: "error", text: "Failed to restore version" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to restore version" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to delete this version? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const success = await versioningService.deleteVersion(file.id, parseInt(versionId))
      if (success) {
        setMessage({ type: "success", text: "Version deleted successfully" })
        await loadFileHistory()
      } else {
        setMessage({ type: "error", text: "Failed to delete version" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete version" })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVersions = fileHistory?.filter(version =>
    !searchQuery || 
    version.changes_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.created_by?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const versionStats = null

  if (!fileHistory && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>File History - {file.name}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No version history found for this file</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            File History - {file.name}
          </DialogTitle>
        </DialogHeader>

        {message && (
          <Alert className={message.type === "success" ? "border-green-500 bg-green-50" : ""}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => setMessage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </Alert>
        )}

        <Tabs defaultValue="timeline" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search versions by description, tags, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedVersions([])}
                disabled={selectedVersions.length === 0}
              >
                Clear Selection
              </Button>
            </div>

            {/* Version Timeline */}
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredVersions.map((version, index) => (
                  <Card 
                    key={version.id} 
                    className={`cursor-pointer transition-all ${
                      selectedVersions.includes(version.id) 
                        ? "ring-2 ring-primary" 
                        : "hover:shadow-md"
                    }`}
                    onClick={() => handleVersionSelect(version.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            v{version.version_number}
                            {index === 0 && " (Current)"}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(version.created_at).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {version.created_by}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {version.size ? `${(version.size / 1024).toFixed(1)} KB` : 'Unknown'}
                          </Badge>
                          {selectedVersions.includes(version.id) && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {version.changes_description && (
                          <p className="text-sm">{version.changes_description}</p>
                        )}
                        


                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {index !== 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreVersion(version.id)
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Restore
                            </Button>
                          )}
                          {fileHistory && fileHistory.length > 1 && index !== 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteVersion(version.id)
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Selected Versions Actions */}
            {selectedVersions.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
                </span>
                {selectedVersions.length === 2 && (
                  <Button size="sm" onClick={handleCompareVersions}>
                    Compare Versions
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            {selectedVersions.length !== 2 ? (
              <div className="text-center py-8">
                <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select exactly 2 versions to compare</p>
              </div>
            ) : comparison ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Version Comparison</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      v{comparison.oldVersion.version_number}
                    </Badge>
                    <ArrowRight className="w-4 h-4" />
                    <Badge variant="outline">
                      v{comparison.newVersion.version_number}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-600">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Size Difference
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {comparison.sizeDifference > 0 ? '+' : ''}{comparison.sizeDifference} bytes
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Time Difference
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {Math.round(comparison.timeDifference / (1000 * 60 * 60 * 24))} days
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Comparing versions...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Statistics not available</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
