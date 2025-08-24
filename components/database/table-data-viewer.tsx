"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DatabaseService, type DatabaseRow } from "@/lib/database"
import { ChevronLeft, ChevronRight, RefreshCw, Edit, Plus, Trash2 } from "lucide-react"

interface TableDataViewerProps {
  tableName: string
}

export function TableDataViewer({ tableName }: TableDataViewerProps) {
  const [data, setData] = useState<{ rows: DatabaseRow[]; total: number }>({ rows: [], total: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [pageSize] = useState(20)

  const dbService = DatabaseService.getInstance()

  useEffect(() => {
    loadTableData()
  }, [tableName, currentPage])

  const loadTableData = async () => {
    setIsLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const result = await dbService.getTableData(tableName, pageSize, offset)
      setData(result)
    } catch (error) {
      console.error("Failed to load table data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(data.total / pageSize)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p>Loading table data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg">Table: {tableName}</CardTitle>
              <Badge variant="outline" className="text-xs">{data.total.toLocaleString()} total rows</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Row</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button variant="outline" size="sm" onClick={loadTableData} className="text-xs">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.rows.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-auto max-h-64 sm:max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 sm:w-12 text-xs">#</TableHead>
                      {Object.keys(data.rows[0]).map((column) => (
                        <TableHead key={column} className="font-mono text-xs">
                          <span className="truncate block max-w-16 sm:max-w-32" title={column}>
                            {column}
                          </span>
                        </TableHead>
                      ))}
                      <TableHead className="w-16 sm:w-24 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, index) => (
                      <TableRow key={index} className="group">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        {Object.entries(row).map(([column, value]) => (
                          <TableCell key={column} className="font-mono text-xs max-w-32 sm:max-w-48">
                            <div className="truncate" title={value?.toString()}>
                              {value === null || value === undefined ? (
                                <span className="text-muted-foreground italic">NULL</span>
                              ) : typeof value === "boolean" ? (
                                <Badge variant={value ? "default" : "secondary"} className="text-xs">
                                  {value.toString()}
                                </Badge>
                              ) : (
                                value.toString()
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.total)} of{" "}
                    {data.total.toLocaleString()} rows
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-end">
                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1} className="text-xs">
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm">Page</span>
                      <Badge variant="outline" className="text-xs">
                        {currentPage} of {totalPages}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages} className="text-xs">
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm sm:text-base">No data found in this table</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
