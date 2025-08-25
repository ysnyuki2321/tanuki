"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { DatabaseService, type DatabaseTable, type DatabaseColumn, type QueryResult } from "@/lib/database"
import { 
  Plus, 
  X, 
  Play, 
  Code, 
  Eye, 
  Settings,
  Table,
  Filter,
  ArrowUpDown,
  Link,
  Search,
  Download,
  Save,
  History
} from "lucide-react"

interface QueryCondition {
  id: string
  column: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'is_null' | 'is_not_null'
  value: string
  logicalOperator: 'AND' | 'OR'
}

interface QueryJoin {
  id: string
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  leftColumn: string
  rightColumn: string
}

interface QueryOrder {
  id: string
  column: string
  direction: 'ASC' | 'DESC'
}

interface VisualQuery {
  id: string
  name: string
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  tables: string[]
  columns: string[]
  conditions: QueryCondition[]
  joins: QueryJoin[]
  orderBy: QueryOrder[]
  groupBy: string[]
  having: QueryCondition[]
  limit?: number
  offset?: number
}

interface VisualQueryBuilderProps {
  isConnected: boolean
  onQueryExecute?: (query: string) => void
}

export function VisualQueryBuilder({ isConnected, onQueryExecute }: VisualQueryBuilderProps) {
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [query, setQuery] = useState<VisualQuery>({
    id: 'new-query',
    name: 'New Query',
    type: 'SELECT',
    tables: [],
    columns: [],
    conditions: [],
    joins: [],
    orderBy: [],
    groupBy: [],
    having: []
  })
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedQueries, setSavedQueries] = useState<VisualQuery[]>([])

  const dbService = DatabaseService.getInstance()

  useEffect(() => {
    if (isConnected) {
      loadTables()
      loadSavedQueries()
    }
  }, [isConnected])

  useEffect(() => {
    generateSQL()
  }, [query])

  const loadTables = async () => {
    try {
      const tableList = await dbService.getTables()
      setTables(tableList)
    } catch (error) {
      console.error('Failed to load tables:', error)
    }
  }

  const loadSavedQueries = () => {
    // Mock saved queries
    const mockSavedQueries: VisualQuery[] = [
      {
        id: 'query-1',
        name: 'Active Users Report',
        type: 'SELECT',
        tables: ['users'],
        columns: ['id', 'name', 'email', 'created_at'],
        conditions: [
          {
            id: 'cond-1',
            column: 'role',
            operator: 'equals',
            value: 'user',
            logicalOperator: 'AND'
          }
        ],
        joins: [],
        orderBy: [
          {
            id: 'order-1',
            column: 'created_at',
            direction: 'DESC'
          }
        ],
        groupBy: [],
        having: [],
        limit: 100
      },
      {
        id: 'query-2',
        name: 'Files by User',
        type: 'SELECT',
        tables: ['users', 'files'],
        columns: ['users.name', 'users.email', 'files.filename', 'files.file_size'],
        conditions: [],
        joins: [
          {
            id: 'join-1',
            type: 'INNER',
            table: 'files',
            leftColumn: 'users.id',
            rightColumn: 'files.user_id'
          }
        ],
        orderBy: [],
        groupBy: [],
        having: []
      }
    ]
    setSavedQueries(mockSavedQueries)
  }

  const generateSQL = () => {
    if (!query.tables.length) {
      setGeneratedSQL('')
      return
    }

    let sql = ''

    switch (query.type) {
      case 'SELECT':
        sql = generateSelectSQL()
        break
      case 'INSERT':
        sql = generateInsertSQL()
        break
      case 'UPDATE':
        sql = generateUpdateSQL()
        break
      case 'DELETE':
        sql = generateDeleteSQL()
        break
    }

    setGeneratedSQL(sql)
  }

  const generateSelectSQL = (): string => {
    const columns = query.columns.length > 0 ? query.columns.join(', ') : '*'
    let sql = `SELECT ${columns}\nFROM ${query.tables[0]}`

    // Add JOINs
    query.joins.forEach(join => {
      sql += `\n${join.type} JOIN ${join.table} ON ${join.leftColumn} = ${join.rightColumn}`
    })

    // Add WHERE conditions
    if (query.conditions.length > 0) {
      sql += '\nWHERE '
      query.conditions.forEach((condition, index) => {
        if (index > 0) {
          sql += ` ${condition.logicalOperator} `
        }
        sql += generateConditionSQL(condition)
      })
    }

    // Add GROUP BY
    if (query.groupBy.length > 0) {
      sql += `\nGROUP BY ${query.groupBy.join(', ')}`
    }

    // Add HAVING
    if (query.having.length > 0) {
      sql += '\nHAVING '
      query.having.forEach((condition, index) => {
        if (index > 0) {
          sql += ` ${condition.logicalOperator} `
        }
        sql += generateConditionSQL(condition)
      })
    }

    // Add ORDER BY
    if (query.orderBy.length > 0) {
      sql += '\nORDER BY '
      query.orderBy.forEach((order, index) => {
        if (index > 0) sql += ', '
        sql += `${order.column} ${order.direction}`
      })
    }

    // Add LIMIT and OFFSET
    if (query.limit) {
      sql += `\nLIMIT ${query.limit}`
      if (query.offset) {
        sql += ` OFFSET ${query.offset}`
      }
    }

    return sql
  }

  const generateInsertSQL = (): string => {
    if (!query.tables[0]) return ''
    return `INSERT INTO ${query.tables[0]} (column1, column2)\nVALUES (value1, value2)`
  }

  const generateUpdateSQL = (): string => {
    if (!query.tables[0]) return ''
    let sql = `UPDATE ${query.tables[0]}\nSET column1 = value1`
    
    if (query.conditions.length > 0) {
      sql += '\nWHERE '
      query.conditions.forEach((condition, index) => {
        if (index > 0) {
          sql += ` ${condition.logicalOperator} `
        }
        sql += generateConditionSQL(condition)
      })
    }
    
    return sql
  }

  const generateDeleteSQL = (): string => {
    if (!query.tables[0]) return ''
    let sql = `DELETE FROM ${query.tables[0]}`
    
    if (query.conditions.length > 0) {
      sql += '\nWHERE '
      query.conditions.forEach((condition, index) => {
        if (index > 0) {
          sql += ` ${condition.logicalOperator} `
        }
        sql += generateConditionSQL(condition)
      })
    }
    
    return sql
  }

  const generateConditionSQL = (condition: QueryCondition): string => {
    switch (condition.operator) {
      case 'equals':
        return `${condition.column} = '${condition.value}'`
      case 'not_equals':
        return `${condition.column} != '${condition.value}'`
      case 'greater_than':
        return `${condition.column} > '${condition.value}'`
      case 'less_than':
        return `${condition.column} < '${condition.value}'`
      case 'contains':
        return `${condition.column} LIKE '%${condition.value}%'`
      case 'starts_with':
        return `${condition.column} LIKE '${condition.value}%'`
      case 'ends_with':
        return `${condition.column} LIKE '%${condition.value}'`
      case 'is_null':
        return `${condition.column} IS NULL`
      case 'is_not_null':
        return `${condition.column} IS NOT NULL`
      default:
        return `${condition.column} = '${condition.value}'`
    }
  }

  const addTable = (tableName: string) => {
    if (!query.tables.includes(tableName)) {
      setQuery(prev => ({
        ...prev,
        tables: [...prev.tables, tableName]
      }))
    }
  }

  const removeTable = (tableName: string) => {
    setQuery(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t !== tableName),
      columns: prev.columns.filter(c => !c.startsWith(tableName + '.')),
      joins: prev.joins.filter(j => j.table !== tableName)
    }))
  }

  const addColumn = (columnName: string) => {
    if (!query.columns.includes(columnName)) {
      setQuery(prev => ({
        ...prev,
        columns: [...prev.columns, columnName]
      }))
    }
  }

  const removeColumn = (columnName: string) => {
    setQuery(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c !== columnName)
    }))
  }

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: `condition-${Date.now()}`,
      column: '',
      operator: 'equals',
      value: '',
      logicalOperator: 'AND'
    }
    setQuery(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }))
  }

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }))
  }

  const removeCondition = (id: string) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }))
  }

  const addJoin = () => {
    if (query.tables.length < 2) return
    
    const newJoin: QueryJoin = {
      id: `join-${Date.now()}`,
      type: 'INNER',
      table: query.tables[1] || '',
      leftColumn: '',
      rightColumn: ''
    }
    setQuery(prev => ({
      ...prev,
      joins: [...prev.joins, newJoin]
    }))
  }

  const addOrderBy = () => {
    const newOrder: QueryOrder = {
      id: `order-${Date.now()}`,
      column: '',
      direction: 'ASC'
    }
    setQuery(prev => ({
      ...prev,
      orderBy: [...prev.orderBy, newOrder]
    }))
  }

  const executeQuery = async () => {
    if (!generatedSQL || !isConnected) return

    setIsExecuting(true)
    try {
      const result = await dbService.executeQuery(generatedSQL)
      setQueryResult(result)
      onQueryExecute?.(generatedSQL)
    } catch (error) {
      console.error('Query execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = () => {
    const queryToSave = {
      ...query,
      id: `query-${Date.now()}`,
      name: query.name || 'Untitled Query'
    }
    setSavedQueries(prev => [...prev, queryToSave])
  }

  const loadQuery = (savedQuery: VisualQuery) => {
    setQuery(savedQuery)
  }

  const getAvailableColumns = () => {
    const allColumns: string[] = []
    query.tables.forEach(tableName => {
      const table = tables.find(t => t.name === tableName)
      if (table) {
        table.columns.forEach(col => {
          allColumns.push(`${tableName}.${col.name}`)
        })
      }
    })
    return allColumns
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Database Connection</h3>
            <p className="text-muted-foreground">Connect to a database to use the visual query builder</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Visual Query Builder</h3>
          <p className="text-sm text-muted-foreground">Build queries visually without writing SQL</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveQuery}>
            <Save className="h-4 w-4 mr-2" />
            Save Query
          </Button>
          <Button onClick={executeQuery} disabled={!generatedSQL || isExecuting}>
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Query Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Query Settings
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="query-type">Type:</Label>
                  <Select 
                    value={query.type} 
                    onValueChange={(value) => setQuery(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELECT">SELECT</SelectItem>
                      <SelectItem value="INSERT">INSERT</SelectItem>
                      <SelectItem value="UPDATE">UPDATE</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query-name">Query Name</Label>
                <Input
                  id="query-name"
                  value={query.name}
                  onChange={(e) => setQuery(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter query name"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="tables" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="tables">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Select Tables
                  </CardTitle>
                  <CardDescription>Choose the tables to query from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {query.tables.map(tableName => (
                        <Badge key={tableName} variant="default" className="flex items-center gap-1">
                          {tableName}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeTable(tableName)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {tables.map(table => (
                        <Button
                          key={table.name}
                          variant="outline"
                          size="sm"
                          onClick={() => addTable(table.name)}
                          disabled={query.tables.includes(table.name)}
                          className="justify-start"
                        >
                          <Table className="h-4 w-4 mr-2" />
                          {table.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="columns">
              <Card>
                <CardHeader>
                  <CardTitle>Select Columns</CardTitle>
                  <CardDescription>Choose which columns to include in your query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {query.columns.map(columnName => (
                        <Badge key={columnName} variant="secondary" className="flex items-center gap-1">
                          {columnName}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeColumn(columnName)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {getAvailableColumns().map(columnName => (
                          <Button
                            key={columnName}
                            variant="ghost"
                            size="sm"
                            onClick={() => addColumn(columnName)}
                            disabled={query.columns.includes(columnName)}
                            className="w-full justify-start"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {columnName}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        WHERE Conditions
                      </CardTitle>
                      <CardDescription>Add filters to your query</CardDescription>
                    </div>
                    <Button onClick={addCondition} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {query.conditions.map((condition, index) => (
                      <div key={condition.id} className="grid grid-cols-12 gap-2 items-center">
                        {index > 0 && (
                          <Select 
                            value={condition.logicalOperator} 
                            onValueChange={(value) => updateCondition(condition.id, { logicalOperator: value as 'AND' | 'OR' })}
                          >
                            <SelectTrigger className="col-span-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">AND</SelectItem>
                              <SelectItem value="OR">OR</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Select 
                          value={condition.column} 
                          onValueChange={(value) => updateCondition(condition.id, { column: value })}
                        >
                          <SelectTrigger className={index > 0 ? "col-span-3" : "col-span-5"}>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableColumns().map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={condition.operator} 
                          onValueChange={(value) => updateCondition(condition.id, { operator: value as any })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="starts_with">Starts With</SelectItem>
                            <SelectItem value="ends_with">Ends With</SelectItem>
                            <SelectItem value="is_null">Is Null</SelectItem>
                            <SelectItem value="is_not_null">Is Not Null</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="Value"
                          className="col-span-3"
                          disabled={condition.operator === 'is_null' || condition.operator === 'is_not_null'}
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                          className="col-span-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {query.conditions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No conditions added. Click "Add Condition" to filter your results.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5" />
                      JOINs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button onClick={addJoin} size="sm" disabled={query.tables.length < 2}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add JOIN
                      </Button>
                      
                      {query.joins.map(join => (
                        <div key={join.id} className="grid grid-cols-6 gap-2 items-center">
                          <Select value={join.type} onValueChange={(value) => {
                            setQuery(prev => ({
                              ...prev,
                              joins: prev.joins.map(j => j.id === join.id ? { ...j, type: value as any } : j)
                            }))
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INNER">INNER</SelectItem>
                              <SelectItem value="LEFT">LEFT</SelectItem>
                              <SelectItem value="RIGHT">RIGHT</SelectItem>
                              <SelectItem value="FULL">FULL</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select value={join.table} onValueChange={(value) => {
                            setQuery(prev => ({
                              ...prev,
                              joins: prev.joins.map(j => j.id === join.id ? { ...j, table: value } : j)
                            }))
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Table" />
                            </SelectTrigger>
                            <SelectContent>
                              {query.tables.map(table => (
                                <SelectItem key={table} value={table}>{table}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input placeholder="Left column" />
                          <span className="text-center">=</span>
                          <Input placeholder="Right column" />
                          
                          <Button variant="ghost" size="sm" onClick={() => {
                            setQuery(prev => ({
                              ...prev,
                              joins: prev.joins.filter(j => j.id !== join.id)
                            }))
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5" />
                      ORDER BY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button onClick={addOrderBy} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sort
                      </Button>
                      
                      {query.orderBy.map(order => (
                        <div key={order.id} className="grid grid-cols-4 gap-2 items-center">
                          <Select value={order.column} onValueChange={(value) => {
                            setQuery(prev => ({
                              ...prev,
                              orderBy: prev.orderBy.map(o => o.id === order.id ? { ...o, column: value } : o)
                            }))
                          }}>
                            <SelectTrigger className="col-span-2">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableColumns().map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={order.direction} onValueChange={(value) => {
                            setQuery(prev => ({
                              ...prev,
                              orderBy: prev.orderBy.map(o => o.id === order.id ? { ...o, direction: value as any } : o)
                            }))
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ASC">ASC</SelectItem>
                              <SelectItem value="DESC">DESC</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button variant="ghost" size="sm" onClick={() => {
                            setQuery(prev => ({
                              ...prev,
                              orderBy: prev.orderBy.filter(o => o.id !== order.id)
                            }))
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="limit">LIMIT</Label>
                        <Input
                          id="limit"
                          type="number"
                          value={query.limit || ''}
                          onChange={(e) => setQuery(prev => ({ 
                            ...prev, 
                            limit: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="No limit"
                        />
                      </div>
                      <div>
                        <Label htmlFor="offset">OFFSET</Label>
                        <Input
                          id="offset"
                          type="number"
                          value={query.offset || ''}
                          onChange={(e) => setQuery(prev => ({ 
                            ...prev, 
                            offset: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Generated SQL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={generatedSQL}
                  readOnly
                  className="h-32 font-mono text-sm"
                  placeholder="SQL query will appear here..."
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigator.clipboard.writeText(generatedSQL)}
                  >
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Saved Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {savedQueries.map(savedQuery => (
                    <Button
                      key={savedQuery.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => loadQuery(savedQuery)}
                      className="w-full justify-start"
                    >
                      <Badge variant="outline" className="mr-2 text-xs">
                        {savedQuery.type}
                      </Badge>
                      {savedQuery.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Query Results */}
      {queryResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Query Results
              <Badge variant="outline">
                {queryResult.rows?.length || 0} rows
              </Badge>
              <Badge variant="outline">
                {queryResult.executionTime}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queryResult.error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">
                Error: {queryResult.error}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      {queryResult.columns?.map(col => (
                        <th key={col} className="border border-gray-300 px-4 py-2 text-left">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows?.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        {queryResult.columns?.map(col => (
                          <td key={col} className="border border-gray-300 px-4 py-2">
                            {String(row[col] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
