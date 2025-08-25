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
  port: number
  status: "online" | "offline" | "maintenance" | "connecting"
  diskUsage: number
  diskTotal: number
  cpu: number
  memory: number
  lastPing: string
  sshEnabled: boolean
  sshConnected: boolean
  mountPoints: DiskMount[]
  credentials?: SSHCredentials
}

export interface DiskMount {
  id: string
  path: string
  filesystem: string
  size: number
  used: number
  available: number
  mountPoint: string
  readonly: boolean
}

export interface SSHCredentials {
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface SSHConnectionResult {
  success: boolean
  error?: string
  nodeId?: string
}

export interface DiskDiscoveryResult {
  success: boolean
  disks: DiskMount[]
  error?: string
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
          port: 22,
          status: "online",
          diskUsage: 85,
          diskTotal: 2000000000000, // 2TB
          cpu: 45,
          memory: 68,
          lastPing: new Date().toISOString(),
          sshEnabled: true,
          sshConnected: true,
          mountPoints: [
            {
              id: "node-1-disk-1",
              path: "/dev/sda1",
              filesystem: "ext4",
              size: 2000000000000,
              used: 1700000000000,
              available: 300000000000,
              mountPoint: "/",
              readonly: false
            }
          ]
        },
        {
          id: "node-2",
          name: "Backup Server",
          host: "192.168.1.101",
          port: 22,
          status: "online",
          diskUsage: 62,
          diskTotal: 1000000000000, // 1TB
          cpu: 23,
          memory: 41,
          lastPing: new Date(Date.now() - 30000).toISOString(),
          sshEnabled: true,
          sshConnected: true,
          mountPoints: [
            {
              id: "node-2-disk-1",
              path: "/dev/sdb1",
              filesystem: "ext4",
              size: 1000000000000,
              used: 620000000000,
              available: 380000000000,
              mountPoint: "/backup",
              readonly: false
            }
          ]
        },
        {
          id: "node-3",
          name: "Archive Server",
          host: "192.168.1.102",
          port: 22,
          status: "maintenance",
          diskUsage: 95,
          diskTotal: 3000000000000, // 3TB
          cpu: 12,
          memory: 28,
          lastPing: new Date(Date.now() - 300000).toISOString(),
          sshEnabled: false,
          sshConnected: false,
          mountPoints: []
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
    credentials: SSHCredentials,
  ): Promise<SSHConnectionResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log(`[v0] SSH connection attempt to node ${nodeId} with user ${credentials.username}`)

    // Simulate connection with 85% success rate
    const success = Math.random() > 0.15

    if (success) {
      return { success: true, nodeId }
    } else {
      return {
        success: false,
        error: "Connection failed: Authentication failed or host unreachable"
      }
    }
  }

  static async disconnectSSH(nodeId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log(`[v0] SSH disconnection from node ${nodeId}`)
    return true
  }

  static async discoverDisks(nodeId: string): Promise<DiskDiscoveryResult> {
    await new Promise((resolve) => setTimeout(resolve, 800))
    console.log(`[v0] Discovering disks on node ${nodeId}`)

    const mockDisks: DiskMount[] = [
      {
        id: `${nodeId}-disk-1`,
        path: "/dev/sda1",
        filesystem: "ext4",
        size: 2000000000000, // 2TB
        used: 1700000000000, // 1.7TB
        available: 300000000000, // 300GB
        mountPoint: "/",
        readonly: false
      },
      {
        id: `${nodeId}-disk-2`,
        path: "/dev/sdb1",
        filesystem: "ext4",
        size: 1000000000000, // 1TB
        used: 620000000000, // 620GB
        available: 380000000000, // 380GB
        mountPoint: "/backup",
        readonly: false
      },
      {
        id: `${nodeId}-disk-3`,
        path: "/dev/sdc1",
        filesystem: "xfs",
        size: 5000000000000, // 5TB
        used: 0, // Unmounted
        available: 5000000000000,
        mountPoint: "",
        readonly: false
      }
    ]

    return { success: true, disks: mockDisks }
  }

  static async mountDisk(
    nodeId: string,
    diskId: string,
    mountPoint: string
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    console.log(`[v0] Mounting disk ${diskId} to ${mountPoint} on node ${nodeId}`)
    return Math.random() > 0.1 // 90% success rate
  }

  static async addServerNode(
    name: string,
    host: string,
    port: number,
    credentials: SSHCredentials
  ): Promise<ServerNode | null> {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const connectionResult = await this.connectSSH(`temp-${Date.now()}`, credentials)

    if (!connectionResult.success) {
      throw new Error(connectionResult.error || "Failed to connect to server")
    }

    const newNode: ServerNode = {
      id: `node-${Date.now()}`,
      name,
      host,
      port,
      status: "online",
      diskUsage: 0,
      diskTotal: 0,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      lastPing: new Date().toISOString(),
      sshEnabled: true,
      sshConnected: true,
      mountPoints: [],
      credentials
    }

    return newNode
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
