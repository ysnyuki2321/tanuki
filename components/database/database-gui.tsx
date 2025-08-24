"use client"

import { useState, useEffect } from "react"
import { DatabaseService, type DatabaseConnection, type DatabaseTable } from "@/lib/database"
import { DatabaseConnections } from "./database-connections"
import { TableBrowser } from "./table-browser"
import { QueryEditor } from "./query-editor"
import { TableDataViewer } from "./table-data-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Database, Table, Code, Settings, DatabaseZap, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function DatabaseGUI() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null)
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const dbService = DatabaseService.getInstance()

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      const connectionList = await dbService.getConnections()
      setConnections(connectionList)
      const active = connectionList.find((c) => c.isConnected)
      if (active) {
        setActiveConnection(active)
        await loadTables()
      }
    } catch (error) {
      console.error("Failed to load connections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTables = async () => {
    try {
      const tableList = await dbService.getTables()
      setTables(tableList)
    } catch (error) {
      console.error("Failed to load tables:", error)
    }
  }

  const handleConnect = async (connectionId: string) => {
    try {
      const success = await dbService.connect(connectionId)
      if (success) {
        await loadConnections()
      }
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      await dbService.disconnect(connectionId)
      await loadConnections()
      setTables([])
      setSelectedTable(null)
    } catch (error) {
      console.error("Failed to disconnect:", error)
    }
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const handleSQLiteQuickAction = async (action: "new" | "open" | "import") => {
    if (!activeConnection) {
      toast({ title: "Chưa có kết nối", description: "Hãy kết nối tới SQLite trước.", variant: "destructive" as any })
      return
    }
    toast({ title: "SQLite", description: `Thao tác: ${action} (demo)` })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p>Loading database connections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Database GUI</h2>
        </div>
        {activeConnection && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">Connected to </span>
              {activeConnection.name}
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="connections" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Connections</span>
            <span className="sm:hidden">Conn</span>
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Table className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tables</span>
            <span className="sm:hidden">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Code className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Query</span>
            <span className="sm:hidden">Query</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" disabled={!selectedTable}>
            <Database className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Data</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <DatabaseConnections connections={connections} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </TabsContent>

        <TabsContent value="browser">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DatabaseZap className="w-4 h-4" />
              SQLite Quick Actions
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSQLiteQuickAction("new")}>
                <Plus className="w-4 h-4 mr-1" /> New DB
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSQLiteQuickAction("open")}>
                <Database className="w-4 h-4 mr-1" /> Open DB
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSQLiteQuickAction("import")}>
                <Upload className="w-4 h-4 mr-1" /> Import .sql
              </Button>
            </div>
          </div>
          <TableBrowser
            tables={tables}
            selectedTable={selectedTable}
            onTableSelect={handleTableSelect}
            isConnected={!!activeConnection}
          />
        </TabsContent>

        <TabsContent value="query">
          <QueryEditor isConnected={!!activeConnection} />
        </TabsContent>

        <TabsContent value="data">
          {selectedTable ? (
            <TableDataViewer tableName={selectedTable} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a table to view data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
