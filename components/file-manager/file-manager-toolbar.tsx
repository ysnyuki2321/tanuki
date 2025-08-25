"use client"

import { Button } from "@/components/ui/button"
import { Grid3X3, List, Trash2, FolderPlus, Upload } from "lucide-react"

interface FileManagerToolbarProps {
  selectedCount: number
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onDeleteSelected: () => void
  onNewFolder?: () => void
}

export function FileManagerToolbar({
  selectedCount,
  viewMode,
  onViewModeChange,
  onDeleteSelected,
  onNewFolder,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onNewFolder}>
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>

        {selectedCount > 0 && (
          <Button variant="outline" size="sm" onClick={onDeleteSelected} className="text-destructive bg-transparent">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedCount})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-r-none"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
