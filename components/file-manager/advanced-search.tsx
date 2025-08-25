"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Code,
  Database,
  Settings
} from "lucide-react"
import { format } from "date-fns"

export interface SearchFilters {
  query: string
  fileTypes: string[]
  sizeRange: {
    min: number | null
    max: number | null
    unit: "KB" | "MB" | "GB"
  }
  dateRange: {
    from: Date | null
    to: Date | null
  }
  isShared: boolean | null
  sortBy: "name" | "size" | "modified" | "created"
  sortOrder: "asc" | "desc"
}

interface AdvancedSearchProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onReset: () => void
  resultCount?: number
}

const fileTypeOptions = [
  { value: "image", label: "Images", icon: Image, extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"] },
  { value: "document", label: "Documents", icon: FileText, extensions: ["pdf", "doc", "docx", "txt", "md"] },
  { value: "video", label: "Videos", icon: Video, extensions: ["mp4", "avi", "mkv", "mov", "wmv"] },
  { value: "audio", label: "Audio", icon: Music, extensions: ["mp3", "wav", "flac", "aac", "ogg"] },
  { value: "archive", label: "Archives", icon: Archive, extensions: ["zip", "rar", "7z", "tar", "gz"] },
  { value: "code", label: "Code", icon: Code, extensions: ["js", "ts", "py", "java", "cpp", "html", "css"] },
  { value: "database", label: "Database", icon: Database, extensions: ["sql", "db", "sqlite"] },
]

export function AdvancedSearch({ filters, onFiltersChange, onReset, resultCount }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState<"from" | "to" | null>(null)

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const toggleFileType = (fileType: string) => {
    const newTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter(type => type !== fileType)
      : [...filters.fileTypes, fileType]
    updateFilters({ fileTypes: newTypes })
  }

  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case "query":
        updateFilters({ query: "" })
        break
      case "fileTypes":
        updateFilters({ fileTypes: [] })
        break
      case "size":
        updateFilters({ sizeRange: { min: null, max: null, unit: "MB" } })
        break
      case "date":
        updateFilters({ dateRange: { from: null, to: null } })
        break
      case "shared":
        updateFilters({ isShared: null })
        break
    }
  }

  const hasActiveFilters = 
    filters.query || 
    filters.fileTypes.length > 0 || 
    filters.sizeRange.min !== null || 
    filters.sizeRange.max !== null ||
    filters.dateRange.from || 
    filters.dateRange.to ||
    filters.isShared !== null

  const formatFileSize = (size: number, unit: string) => {
    return `${size} ${unit}`
  }

  return (
    <div className="space-y-4">
      {/* Search Bar with Advanced Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search files and folders..."
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {[
                filters.query && "query",
                filters.fileTypes.length > 0 && "types",
                (filters.sizeRange.min !== null || filters.sizeRange.max !== null) && "size",
                (filters.dateRange.from || filters.dateRange.to) && "date",
                filters.isShared !== null && "shared"
              ].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={onReset}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              Query: "{filters.query}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter("query")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.fileTypes.map(type => {
            const option = fileTypeOptions.find(opt => opt.value === type)
            return (
              <Badge key={type} variant="secondary" className="gap-1">
                {option && <option.icon className="w-3 h-3" />}
                {option?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => toggleFileType(type)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )
          })}

          {(filters.sizeRange.min !== null || filters.sizeRange.max !== null) && (
            <Badge variant="secondary" className="gap-1">
              Size: {filters.sizeRange.min || 0} - {filters.sizeRange.max || "∞"} {filters.sizeRange.unit}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter("size")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.dateRange.from ? format(filters.dateRange.from, "MMM d") : "∞"} - {filters.dateRange.to ? format(filters.dateRange.to, "MMM d") : "∞"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter("date")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filters.isShared !== null && (
            <Badge variant="secondary" className="gap-1">
              {filters.isShared ? "Shared" : "Not Shared"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter("shared")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} file{resultCount !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Advanced Filters Panel */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Types */}
            <div className="space-y-3">
              <Label>File Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {fileTypeOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={filters.fileTypes.includes(option.value)}
                      onCheckedChange={() => toggleFileType(option.value)}
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* File Size */}
            <div className="space-y-3">
              <Label>File Size</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.sizeRange.min || ""}
                  onChange={(e) => updateFilters({
                    sizeRange: {
                      ...filters.sizeRange,
                      min: e.target.value ? Number(e.target.value) : null
                    }
                  })}
                  className="w-24"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.sizeRange.max || ""}
                  onChange={(e) => updateFilters({
                    sizeRange: {
                      ...filters.sizeRange,
                      max: e.target.value ? Number(e.target.value) : null
                    }
                  })}
                  className="w-24"
                />
                <Select
                  value={filters.sizeRange.unit}
                  onValueChange={(unit: "KB" | "MB" | "GB") => updateFilters({
                    sizeRange: { ...filters.sizeRange, unit }
                  })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KB">KB</SelectItem>
                    <SelectItem value="MB">MB</SelectItem>
                    <SelectItem value="GB">GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Modified</Label>
              <div className="flex gap-2">
                <Popover open={datePickerOpen === "from"} onOpenChange={(open) => setDatePickerOpen(open ? "from" : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "MMM d, yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={(date) => {
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: date || null }
                        })
                        setDatePickerOpen(null)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={datePickerOpen === "to"} onOpenChange={(open) => setDatePickerOpen(open ? "to" : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "MMM d, yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={(date) => {
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: date || null }
                        })
                        setDatePickerOpen(null)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Share Status */}
            <div className="space-y-3">
              <Label>Share Status</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.isShared === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilters({ isShared: filters.isShared === true ? null : true })}
                >
                  Shared Only
                </Button>
                <Button
                  variant={filters.isShared === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilters({ isShared: filters.isShared === false ? null : false })}
                >
                  Not Shared
                </Button>
              </div>
            </div>

            <Separator />

            {/* Sort Options */}
            <div className="space-y-3">
              <Label>Sort By</Label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(sortBy: "name" | "size" | "modified" | "created") => 
                    updateFilters({ sortBy })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="modified">Modified</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortOrder}
                  onValueChange={(sortOrder: "asc" | "desc") => 
                    updateFilters({ sortOrder })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onReset}>
                Clear All
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
