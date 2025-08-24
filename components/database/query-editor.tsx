"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatabaseService, type QueryResult } from "@/lib/database"
import { Play, Save, RotateCcw, Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QueryEditorProps {
  isConnected: boolean
}

export function QueryEditor({ isConnected }: QueryEditorProps) {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const dbService = DatabaseService.getInstance()

  const handleExecuteQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    try {
      const queryResult = await dbService.executeQuery(query)
      setResult(queryResult)
    } catch (error) {
      setResult({
        columns: [],
        rows: [],
        executionTime: 0,
        error: error instanceof Error ? error.message : "Query execution failed",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleFormatQuery = () => {
    // Basic SQL formatting
    const formatted = query
      .replace(/\bSELECT\b/gi, "SELECT")
      .replace(/\bFROM\b/gi, "\nFROM")
      .replace(/\bWHERE\b/gi, "\nWHERE")
      .replace(/\bORDER BY\b/gi, "\nORDER BY")
      .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
      .replace(/\bHAVING\b/gi, "\nHAVING")
      .replace(/\bJOIN\b/gi, "\nJOIN")
      .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN")
      .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
      .replace(/\bRIGHT JOIN\b/gi, "\nRIGHT JOIN")

    setQuery(formatted)
  }

  const sampleQueries = [
    "SELECT * FROM users LIMIT 10;",
    "SELECT COUNT(*) as total_users FROM users;",
    "SELECT u.name, COUNT(f.id) as file_count\nFROM users u\nLEFT JOIN files f ON u.id = f.user_id\nGROUP BY u.id, u.name\nORDER BY file_count DESC;",
    "SELECT DATE(created_at) as date, COUNT(*) as registrations\nFROM users\nWHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)\nGROUP BY DATE(created_at)\nORDER BY date DESC;",
  ]

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connect to a database to run queries</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SQL Query Editor</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFormatQuery}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Format
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleExecuteQuery} disabled={isExecuting} className="gradient-primary text-white">
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="min-h-32 font-mono text-sm"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Queries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sampleQueries.map((sampleQuery, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => setQuery(sampleQuery)}
              >
                <pre className="text-xs font-mono whitespace-pre-wrap">{sampleQuery}</pre>
              </Button>
            ))}
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Query Result</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.executionTime}ms
                  </Badge>
                  {result.affectedRows !== undefined && (
                    <Badge variant="secondary">{result.affectedRows} rows affected</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              ) : result.rows.length > 0 ? (
                <div className="border rounded-lg overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.columns.map((column) => (
                          <TableHead key={column} className="font-mono text-xs">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, index) => (
                        <TableRow key={index}>
                          {result.columns.map((column) => (
                            <TableCell key={column} className="font-mono text-xs">
                              {row[column]?.toString() || "NULL"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Query executed successfully. No results to display.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
