"use client"

import { useState, useEffect } from "react"
import { DatabaseService, type DatabaseConnection, type DatabaseTable } from "@/lib/database"
import { DatabaseConnections } from "./database-connections"
import { TableBrowser } from "./table-browser"
import { QueryEditor } from "./query-editor"
import { TableDataViewer } from "./table-data-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Database, Table, Code, Settings } from "lucide-react"

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
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Database GUI</h2>
        {activeConnection && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Connected to {activeConnection.name}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Query
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2" disabled={!selectedTable}>
            <Database className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <DatabaseConnections connections={connections} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </TabsContent>

        <TabsContent value="browser">
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
