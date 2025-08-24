"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DatabaseTable } from "@/lib/database"
import { Table, Key, Link, Eye, Edit } from "lucide-react"

interface TableBrowserProps {
  tables: DatabaseTable[]
  selectedTable: string | null
  onTableSelect: (tableName: string) => void
  isConnected: boolean
}

export function TableBrowser({ tables, selectedTable, onTableSelect, isConnected }: TableBrowserProps) {
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Table className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connect to a database to browse tables</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Database Tables</h3>
        <Badge variant="outline" className="w-fit">{tables.length} tables</Badge>
      </div>

      <div className="grid gap-4">
        {tables.map((table) => (
          <Card
            key={table.name}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTable === table.name ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onTableSelect(table.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">{table.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{table.rowCount.toLocaleString()} rows</Badge>
                  <Badge variant="outline" className="text-xs">{table.size}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Columns ({table.columns.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {table.columns.slice(0, 6).map((column) => (
                    <div key={column.name} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {column.primaryKey && <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                        {column.foreignKey && <Link className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                        <span className="font-mono truncate">{column.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs flex-shrink-0">{column.type}</span>
                    </div>
                  ))}
                  {table.columns.length > 6 && (
                    <div className="text-xs sm:text-sm text-muted-foreground">+{table.columns.length - 6} more columns</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()} className="text-xs">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">View Data</span>
                  <span className="sm:hidden">View</span>
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()} className="text-xs">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Schema</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
