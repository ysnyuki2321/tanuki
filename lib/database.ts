// Mock database service - replace with real implementation later
export interface DatabaseTable {
  name: string
  columns: DatabaseColumn[]
  rowCount: number
  size: string
}

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  foreignKey?: {
    table: string
    column: string
  }
  defaultValue?: string
}

export interface DatabaseRow {
  [key: string]: any
}

export interface QueryResult {
  columns: string[]
  rows: DatabaseRow[]
  affectedRows?: number
  executionTime: number
  error?: string
}

export interface DatabaseConnection {
  id: string
  name: string
  type: "mysql" | "postgresql" | "sqlite" | "mongodb"
  host?: string
  port?: number
  database: string
  username?: string
  isConnected: boolean
}

// Mock database data
const mockTables: DatabaseTable[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "INTEGER", nullable: false, primaryKey: true },
      { name: "email", type: "VARCHAR(255)", nullable: false, primaryKey: false },
      { name: "name", type: "VARCHAR(255)", nullable: false, primaryKey: false },
      { name: "password_hash", type: "VARCHAR(255)", nullable: false, primaryKey: false },
      { name: "role", type: "ENUM('user','admin')", nullable: false, primaryKey: false, defaultValue: "user" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, primaryKey: false, defaultValue: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP", nullable: true, primaryKey: false },
    ],
    rowCount: 1247,
    size: "2.3 MB",
  },
  {
    name: "files",
    columns: [
      { name: "id", type: "INTEGER", nullable: false, primaryKey: true },
      {
        name: "user_id",
        type: "INTEGER",
        nullable: false,
        primaryKey: false,
        foreignKey: { table: "users", column: "id" },
      },
      { name: "filename", type: "VARCHAR(255)", nullable: false, primaryKey: false },
      { name: "file_path", type: "TEXT", nullable: false, primaryKey: false },
      { name: "file_size", type: "BIGINT", nullable: true, primaryKey: false },
      { name: "mime_type", type: "VARCHAR(100)", nullable: true, primaryKey: false },
      { name: "is_shared", type: "BOOLEAN", nullable: false, primaryKey: false, defaultValue: "false" },
      { name: "share_url", type: "VARCHAR(255)", nullable: true, primaryKey: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false, primaryKey: false, defaultValue: "CURRENT_TIMESTAMP" },
    ],
    rowCount: 8934,
    size: "15.7 MB",
  },
  {
    name: "sessions",
    columns: [
      { name: "id", type: "VARCHAR(255)", nullable: false, primaryKey: true },
      {
        name: "user_id",
        type: "INTEGER",
        nullable: false,
        primaryKey: false,
        foreignKey: { table: "users", column: "id" },
      },
      { name: "ip_address", type: "VARCHAR(45)", nullable: true, primaryKey: false },
      { name: "user_agent", type: "TEXT", nullable: true, primaryKey: false },
      { name: "expires_at", type: "TIMESTAMP", nullable: false, primaryKey: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false, primaryKey: false, defaultValue: "CURRENT_TIMESTAMP" },
    ],
    rowCount: 342,
    size: "156 KB",
  },
  {
    name: "audit_logs",
    columns: [
      { name: "id", type: "INTEGER", nullable: false, primaryKey: true },
      {
        name: "user_id",
        type: "INTEGER",
        nullable: true,
        primaryKey: false,
        foreignKey: { table: "users", column: "id" },
      },
      { name: "action", type: "VARCHAR(100)", nullable: false, primaryKey: false },
      { name: "resource_type", type: "VARCHAR(50)", nullable: false, primaryKey: false },
      { name: "resource_id", type: "VARCHAR(255)", nullable: true, primaryKey: false },
      { name: "details", type: "JSON", nullable: true, primaryKey: false },
      { name: "ip_address", type: "VARCHAR(45)", nullable: true, primaryKey: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false, primaryKey: false, defaultValue: "CURRENT_TIMESTAMP" },
    ],
    rowCount: 25678,
    size: "8.9 MB",
  },
]

const mockConnections: DatabaseConnection[] = [
  {
    id: "1",
    name: "Tanuki Production",
    type: "postgresql",
    host: "db.tanuki.dev",
    port: 5432,
    database: "tanuki_prod",
    username: "tanuki_user",
    isConnected: true,
  },
  {
    id: "2",
    name: "Local Development",
    type: "sqlite",
    database: "tanuki_dev.db",
    isConnected: false,
  },
]

export class DatabaseService {
  private static instance: DatabaseService
  private connections: DatabaseConnection[] = [...mockConnections]
  private activeConnection: DatabaseConnection | null = mockConnections[0]

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async getConnections(): Promise<DatabaseConnection[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return this.connections
  }

  async connect(connectionId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const connection = this.connections.find((c) => c.id === connectionId)
    if (connection) {
      connection.isConnected = true
      this.activeConnection = connection
      return true
    }
    return false
  }

  async disconnect(connectionId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const connection = this.connections.find((c) => c.id === connectionId)
    if (connection) {
      connection.isConnected = false
      if (this.activeConnection?.id === connectionId) {
        this.activeConnection = null
      }
    }
  }

  async getTables(): Promise<DatabaseTable[]> {
    if (!this.activeConnection?.isConnected) {
      throw new Error("No active database connection")
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockTables
  }

  async getTableData(tableName: string, limit = 100, offset = 0): Promise<{ rows: DatabaseRow[]; total: number }> {
    if (!this.activeConnection?.isConnected) {
      throw new Error("No active database connection")
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock data based on table
    const mockData = this.generateMockTableData(tableName, limit)
    const table = mockTables.find((t) => t.name === tableName)

    return {
      rows: mockData,
      total: table?.rowCount || 0,
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    if (!this.activeConnection?.isConnected) {
      throw new Error("No active database connection")
    }

    const startTime = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 800))
    const executionTime = Date.now() - startTime

    // Mock query execution
    const trimmedQuery = query.trim().toLowerCase()

    if (trimmedQuery.startsWith("select")) {
      return this.mockSelectQuery(query, executionTime)
    } else if (
      trimmedQuery.startsWith("insert") ||
      trimmedQuery.startsWith("update") ||
      trimmedQuery.startsWith("delete")
    ) {
      return this.mockModifyQuery(query, executionTime)
    } else if (
      trimmedQuery.startsWith("create") ||
      trimmedQuery.startsWith("alter") ||
      trimmedQuery.startsWith("drop")
    ) {
      return this.mockDDLQuery(query, executionTime)
    } else {
      return {
        columns: [],
        rows: [],
        executionTime,
        error: "Unsupported query type",
      }
    }
  }

  private generateMockTableData(tableName: string, limit: number): DatabaseRow[] {
    const table = mockTables.find((t) => t.name === tableName)
    if (!table) return []

    const rows: DatabaseRow[] = []

    for (let i = 0; i < Math.min(limit, 20); i++) {
      const row: DatabaseRow = {}

      table.columns.forEach((column) => {
        switch (column.name) {
          case "id":
            row[column.name] = i + 1
            break
          case "email":
            row[column.name] = `user${i + 1}@tanuki.dev`
            break
          case "name":
            row[column.name] = `User ${i + 1}`
            break
          case "filename":
            row[column.name] = `file_${i + 1}.txt`
            break
          case "file_path":
            row[column.name] = `/uploads/file_${i + 1}.txt`
            break
          case "file_size":
            row[column.name] = Math.floor(Math.random() * 1000000)
            break
          case "created_at":
          case "updated_at":
          case "expires_at":
            row[column.name] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            break
          case "is_shared":
            row[column.name] = Math.random() > 0.7
            break
          case "role":
            row[column.name] = Math.random() > 0.9 ? "admin" : "user"
            break
          default:
            row[column.name] = `Sample ${column.name} ${i + 1}`
        }
      })

      rows.push(row)
    }

    return rows
  }

  private mockSelectQuery(query: string, executionTime: number): QueryResult {
    return {
      columns: ["id", "name", "email", "created_at"],
      rows: [
        { id: 1, name: "John Doe", email: "john@tanuki.dev", created_at: "2024-01-15T10:30:00Z" },
        { id: 2, name: "Jane Smith", email: "jane@tanuki.dev", created_at: "2024-01-16T14:20:00Z" },
        { id: 3, name: "Bob Wilson", email: "bob@tanuki.dev", created_at: "2024-01-17T09:15:00Z" },
      ],
      executionTime,
    }
  }

  private mockModifyQuery(query: string, executionTime: number): QueryResult {
    const affectedRows = Math.floor(Math.random() * 5) + 1
    return {
      columns: [],
      rows: [],
      affectedRows,
      executionTime,
    }
  }

  private mockDDLQuery(query: string, executionTime: number): QueryResult {
    return {
      columns: [],
      rows: [],
      executionTime,
    }
  }

  getActiveConnection(): DatabaseConnection | null {
    return this.activeConnection
  }
}
