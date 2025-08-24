export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalStorage: number
  usedStorage: number
  totalFiles: number
  totalShares: number
  serverNodes: ServerNode[]
}

export interface ServerNode {
  id: string
  name: string
  host: string
  status: "online" | "offline" | "maintenance"
  diskUsage: number
  diskTotal: number
  cpu: number
  memory: number
  lastPing: string
  sshEnabled: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  storageUsed: number
  storageLimit: number
  filesCount: number
  lastActive: string
  status: "active" | "suspended" | "pending"
}

// Mock admin service
export class AdminService {
  static async getSystemStats(): Promise<SystemStats> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      totalUsers: 1247,
      activeUsers: 892,
      totalStorage: 5000000000000, // 5TB
      usedStorage: 3200000000000, // 3.2TB
      totalFiles: 45678,
      totalShares: 1234,
      serverNodes: [
        {
          id: "node-1",
          name: "Primary Server",
          host: "192.168.1.100",
          status: "online",
          diskUsage: 85,
          diskTotal: 2000000000000, // 2TB
          cpu: 45,
          memory: 68,
          lastPing: new Date().toISOString(),
          sshEnabled: true,
        },
        {
          id: "node-2",
          name: "Backup Server",
          host: "192.168.1.101",
          status: "online",
          diskUsage: 62,
          diskTotal: 1000000000000, // 1TB
          cpu: 23,
          memory: 41,
          lastPing: new Date(Date.now() - 30000).toISOString(),
          sshEnabled: true,
        },
        {
          id: "node-3",
          name: "Archive Server",
          host: "192.168.1.102",
          status: "maintenance",
          diskUsage: 95,
          diskTotal: 3000000000000, // 3TB
          cpu: 12,
          memory: 28,
          lastPing: new Date(Date.now() - 300000).toISOString(),
          sshEnabled: false,
        },
      ],
    }
  }

  static async getUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return [
      {
        id: "1",
        email: "admin@tanuki.dev",
        name: "Admin User",
        role: "admin",
        storageUsed: 50000000000, // 50GB
        storageLimit: 100000000000, // 100GB
        filesCount: 1250,
        lastActive: new Date().toISOString(),
        status: "active",
      },
      {
        id: "2",
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        storageUsed: 25000000000, // 25GB
        storageLimit: 50000000000, // 50GB
        filesCount: 890,
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        status: "active",
      },
      {
        id: "3",
        email: "jane@example.com",
        name: "Jane Smith",
        role: "user",
        storageUsed: 75000000000, // 75GB
        storageLimit: 100000000000, // 100GB
        filesCount: 2340,
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        status: "active",
      },
    ]
  }

  static async connectSSH(
    nodeId: string,
    credentials: { username: string; password?: string; privateKey?: string },
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log(`[v0] SSH connection attempt to node ${nodeId} with user ${credentials.username}`)
    return Math.random() > 0.2 // 80% success rate for demo
  }

  static async executeSSHCommand(nodeId: string, command: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800))
    console.log(`[v0] Executing SSH command on ${nodeId}: ${command}`)

    // Mock command responses
    const responses: Record<string, string> = {
      "df -h": `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       2.0T  1.7T  300G  85% /
/dev/sdb1       1.0T  620G  380G  62% /backup`,
      "free -h": `              total        used        free      shared  buff/cache   available
Mem:           32Gi        22Gi       2.1Gi       1.2Gi       7.8Gi       8.9Gi
Swap:          8.0Gi       1.2Gi       6.8Gi`,
      uptime: " 15:42:33 up 45 days,  3:21,  2 users,  load average: 0.45, 0.32, 0.28",
    }

    return responses[command] || `Command executed: ${command}\nOutput: Success`
  }
}
