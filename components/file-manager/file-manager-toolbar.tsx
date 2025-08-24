"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Grid3X3, List, Search, Trash2, FolderPlus } from "lucide-react"

interface FileManagerToolbarProps {
  selectedCount: number
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onDeleteSelected: () => void
}

export function FileManagerToolbar({
  selectedCount,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onDeleteSelected,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top row - Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <FolderPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Folder</span>
            <span className="sm:hidden">Folder</span>
          </Button>

          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={onDeleteSelected} className="text-destructive bg-transparent flex-1 sm:flex-none">
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Delete ({selectedCount})</span>
              <span className="sm:hidden">Del ({selectedCount})</span>
            </Button>
          )}
        </div>

        {/* View mode toggle - always visible */}
        <div className="flex border rounded-lg w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-r-none flex-1 sm:flex-none"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="rounded-l-none flex-1 sm:flex-none"
          >
            <List className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* Bottom row - Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
    </div>
  )
}
