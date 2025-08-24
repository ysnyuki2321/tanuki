// Mock zip preview service - replace with real implementation later
export interface ZipEntry {
  name: string
  path: string
  size: number
  compressedSize: number
  isDirectory: boolean
  lastModified: Date
  content?: string // For text files
  mimeType?: string
}

export interface ZipArchive {
  name: string
  totalSize: number
  compressedSize: number
  fileCount: number
  entries: ZipEntry[]
}

// Mock zip data for demo
const mockZipEntries: ZipEntry[] = [
  {
    name: "README.md",
    path: "README.md",
    size: 1024,
    compressedSize: 512,
    isDirectory: false,
    lastModified: new Date("2024-01-15"),
    content:
      "# Project Archive\n\nThis is a sample project archive containing various files and folders.\n\n## Contents\n\n- Source code files\n- Documentation\n- Configuration files\n- Assets\n\n## Usage\n\nExtract the archive and follow the setup instructions in the docs folder.",
    mimeType: "text/markdown",
  },
  {
    name: "src",
    path: "src/",
    size: 0,
    compressedSize: 0,
    isDirectory: true,
    lastModified: new Date("2024-01-15"),
  },
  {
    name: "app.js",
    path: "src/app.js",
    size: 2048,
    compressedSize: 1024,
    isDirectory: false,
    lastModified: new Date("2024-01-16"),
    content:
      "// Main application entry point\nconst express = require('express');\nconst path = require('path');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Middleware\napp.use(express.json());\napp.use(express.static('public'));\n\n// Routes\napp.get('/', (req, res) => {\n  res.sendFile(path.join(__dirname, 'public', 'index.html'));\n});\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'OK', timestamp: new Date().toISOString() });\n});\n\n// Start server\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});",
    mimeType: "application/javascript",
  },
  {
    name: "utils.js",
    path: "src/utils.js",
    size: 1536,
    compressedSize: 768,
    isDirectory: false,
    lastModified: new Date("2024-01-16"),
    content:
      "// Utility functions\n\n/**\n * Format file size in human readable format\n * @param {number} bytes - File size in bytes\n * @returns {string} Formatted size\n */\nfunction formatFileSize(bytes) {\n  if (bytes === 0) return '0 Bytes';\n  const k = 1024;\n  const sizes = ['Bytes', 'KB', 'MB', 'GB'];\n  const i = Math.floor(Math.log(bytes) / Math.log(k));\n  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];\n}\n\n/**\n * Generate random ID\n * @returns {string} Random ID\n */\nfunction generateId() {\n  return Math.random().toString(36).substring(2, 15);\n}\n\nmodule.exports = {\n  formatFileSize,\n  generateId\n};",
    mimeType: "application/javascript",
  },
  {
    name: "config",
    path: "config/",
    size: 0,
    compressedSize: 0,
    isDirectory: true,
    lastModified: new Date("2024-01-14"),
  },
  {
    name: "database.json",
    path: "config/database.json",
    size: 512,
    compressedSize: 256,
    isDirectory: false,
    lastModified: new Date("2024-01-14"),
    content:
      '{\n  "development": {\n    "host": "localhost",\n    "port": 5432,\n    "database": "tanuki_dev",\n    "username": "dev_user",\n    "password": "dev_password",\n    "dialect": "postgresql"\n  },\n  "production": {\n    "host": "db.tanuki.dev",\n    "port": 5432,\n    "database": "tanuki_prod",\n    "username": "prod_user",\n    "password": "${DB_PASSWORD}",\n    "dialect": "postgresql",\n    "ssl": true\n  }\n}',
    mimeType: "application/json",
  },
  {
    name: "server.conf",
    path: "config/server.conf",
    size: 768,
    compressedSize: 384,
    isDirectory: false,
    lastModified: new Date("2024-01-14"),
    content:
      "# Server Configuration\n\n# Basic settings\nserver_name tanuki.dev\nport 3000\nenv production\n\n# Security\nssl_enabled true\nssl_cert /etc/ssl/certs/tanuki.crt\nssl_key /etc/ssl/private/tanuki.key\n\n# Performance\nmax_connections 1000\ntimeout 30\nkeepalive_timeout 65\n\n# Logging\nlog_level info\nlog_file /var/log/tanuki/server.log\nerror_log /var/log/tanuki/error.log\n\n# Cache\ncache_enabled true\ncache_ttl 3600\n\n# Rate limiting\nrate_limit 100\nrate_window 60",
    mimeType: "text/plain",
  },
  {
    name: "docs",
    path: "docs/",
    size: 0,
    compressedSize: 0,
    isDirectory: true,
    lastModified: new Date("2024-01-13"),
  },
  {
    name: "installation.md",
    path: "docs/installation.md",
    size: 2048,
    compressedSize: 1024,
    isDirectory: false,
    lastModified: new Date("2024-01-13"),
    content:
      "# Installation Guide\n\n## Prerequisites\n\n- Node.js 18 or higher\n- PostgreSQL 13 or higher\n- Redis (optional, for caching)\n\n## Steps\n\n1. **Clone the repository**\n   ```bash\n   git clone https://github.com/tanuki/project.git\n   cd project\n   ```\n\n2. **Install dependencies**\n   ```bash\n   npm install\n   ```\n\n3. **Setup database**\n   ```bash\n   createdb tanuki_dev\n   npm run migrate\n   ```\n\n4. **Configure environment**\n   ```bash\n   cp .env.example .env\n   # Edit .env with your settings\n   ```\n\n5. **Start the application**\n   ```bash\n   npm start\n   ```\n\n## Troubleshooting\n\nIf you encounter issues, check the logs in `/var/log/tanuki/` or run with debug mode:\n\n```bash\nDEBUG=* npm start\n```",
    mimeType: "text/markdown",
  },
  {
    name: "api.md",
    path: "docs/api.md",
    size: 3072,
    compressedSize: 1536,
    isDirectory: false,
    lastModified: new Date("2024-01-13"),
    content:
      '# API Documentation\n\n## Authentication\n\nAll API endpoints require authentication via JWT token in the Authorization header:\n\n```\nAuthorization: Bearer <token>\n```\n\n## Endpoints\n\n### Users\n\n#### GET /api/users\nRetrieve list of users\n\n**Response:**\n```json\n{\n  "users": [\n    {\n      "id": 1,\n      "email": "user@example.com",\n      "name": "John Doe",\n      "role": "user",\n      "created_at": "2024-01-01T00:00:00Z"\n    }\n  ]\n}\n```\n\n#### POST /api/users\nCreate new user\n\n**Request:**\n```json\n{\n  "email": "user@example.com",\n  "name": "John Doe",\n  "password": "secure_password"\n}\n```\n\n### Files\n\n#### GET /api/files\nRetrieve user files\n\n#### POST /api/files/upload\nUpload new file\n\n#### DELETE /api/files/:id\nDelete file\n\n## Error Handling\n\nAll errors return JSON with error details:\n\n```json\n{\n  "error": "Error message",\n  "code": "ERROR_CODE",\n  "details": {}\n}\n```',
    mimeType: "text/markdown",
  },
  {
    name: "assets",
    path: "assets/",
    size: 0,
    compressedSize: 0,
    isDirectory: true,
    lastModified: new Date("2024-01-12"),
  },
  {
    name: "logo.png",
    path: "assets/logo.png",
    size: 15360,
    compressedSize: 12288,
    isDirectory: false,
    lastModified: new Date("2024-01-12"),
    mimeType: "image/png",
  },
  {
    name: "package.json",
    path: "package.json",
    size: 1024,
    compressedSize: 512,
    isDirectory: false,
    lastModified: new Date("2024-01-15"),
    content:
      '{\n  "name": "tanuki-project",\n  "version": "1.0.0",\n  "description": "Advanced web storage platform",\n  "main": "src/app.js",\n  "scripts": {\n    "start": "node src/app.js",\n    "dev": "nodemon src/app.js",\n    "test": "jest",\n    "migrate": "sequelize-cli db:migrate",\n    "seed": "sequelize-cli db:seed:all"\n  },\n  "dependencies": {\n    "express": "^4.18.2",\n    "sequelize": "^6.35.0",\n    "pg": "^8.11.3",\n    "jsonwebtoken": "^9.0.2",\n    "bcrypt": "^5.1.1",\n    "multer": "^1.4.5"\n  },\n  "devDependencies": {\n    "nodemon": "^3.0.2",\n    "jest": "^29.7.0"\n  },\n  "keywords": ["storage", "files", "web", "platform"],\n  "author": "Tanuki Team",\n  "license": "MIT"\n}',
    mimeType: "application/json",
  },
]

export class ZipPreviewService {
  private static instance: ZipPreviewService

  static getInstance(): ZipPreviewService {
    if (!ZipPreviewService.instance) {
      ZipPreviewService.instance = new ZipPreviewService()
    }
    return ZipPreviewService.instance
  }

  async analyzeZip(fileName: string): Promise<ZipArchive> {
    // Simulate zip analysis
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const totalSize = mockZipEntries.reduce((sum, entry) => sum + entry.size, 0)
    const compressedSize = mockZipEntries.reduce((sum, entry) => sum + entry.compressedSize, 0)
    const fileCount = mockZipEntries.filter((entry) => !entry.isDirectory).length

    return {
      name: fileName,
      totalSize,
      compressedSize,
      fileCount,
      entries: mockZipEntries,
    }
  }

  async extractFile(zipName: string, filePath: string): Promise<Blob> {
    // Simulate file extraction
    await new Promise((resolve) => setTimeout(resolve, 500))

    const entry = mockZipEntries.find((e) => e.path === filePath)
    if (!entry || entry.isDirectory) {
      throw new Error("File not found or is a directory")
    }

    // Return mock blob
    const content = entry.content || `Mock content for ${entry.name}`
    return new Blob([content], { type: entry.mimeType || "text/plain" })
  }

  buildFileTree(entries: ZipEntry[]): ZipTreeNode[] {
    const tree: ZipTreeNode[] = []
    const pathMap = new Map<string, ZipTreeNode>()

    // Sort entries to process directories first
    const sortedEntries = [...entries].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.path.localeCompare(b.path)
    })

    for (const entry of sortedEntries) {
      const parts = entry.path.split("/").filter(Boolean)
      let currentPath = ""
      let currentLevel = tree

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        currentPath += (currentPath ? "/" : "") + part

        let node = pathMap.get(currentPath)

        if (!node) {
          const isLast = i === parts.length - 1
          node = {
            name: part,
            path: currentPath,
            isDirectory: entry.isDirectory || !isLast,
            size: isLast ? entry.size : 0,
            lastModified: entry.lastModified,
            children: [],
            entry: isLast ? entry : undefined,
          }

          pathMap.set(currentPath, node)
          currentLevel.push(node)
        }

        currentLevel = node.children
      }
    }

    return tree
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  getFileIcon(entry: ZipEntry): string {
    if (entry.isDirectory) return "📁"

    const ext = entry.name.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return "📄"
      case "json":
        return "📋"
      case "md":
        return "📝"
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return "🖼️"
      case "pdf":
        return "📕"
      case "zip":
      case "rar":
        return "📦"
      case "txt":
        return "📄"
      case "conf":
      case "config":
        return "⚙️"
      default:
        return "📄"
    }
  }
}

export interface ZipTreeNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  lastModified: Date
  children: ZipTreeNode[]
  entry?: ZipEntry
}
