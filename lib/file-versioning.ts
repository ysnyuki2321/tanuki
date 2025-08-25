export interface FileVersion {
  id: string
  fileId: string
  versionNumber: number
  content: string
  size: number
  checksum: string
  createdAt: string
  createdBy: string
  changeDescription?: string
  tags?: string[]
}

export interface FileHistory {
  fileId: string
  fileName: string
  totalVersions: number
  currentVersion: number
  versions: FileVersion[]
  totalSize: number
}

export interface VersionComparison {
  oldVersion: FileVersion
  newVersion: FileVersion
  changes: {
    linesAdded: number
    linesRemoved: number
    linesModified: number
    additions: string[]
    deletions: string[]
    modifications: { line: number; old: string; new: string }[]
  }
}

// Mock versioning data
const mockVersions: FileVersion[] = [
  {
    id: "v1",
    fileId: "readme",
    versionNumber: 1,
    content: `# Tanuki Web Storage Platform

Welcome to your personal cloud storage platform!

## Features

- File Management: Upload and organize files
- Code Editor: Edit code files in browser
- Database GUI: Manage databases visually

## Getting Started

1. Upload files
2. Create folders
3. Edit code files
4. Share files

Happy storage!`,
    size: 512,
    checksum: "abc123",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    createdBy: "user@tanuki.dev",
    changeDescription: "Initial file creation",
    tags: ["initial", "documentation"]
  },
  {
    id: "v2",
    fileId: "readme",
    versionNumber: 2,
    content: `# Tanuki Web Storage Platform

Welcome to your personal cloud storage platform!

## Features

- 📁 **File Management**: Upload, organize, and manage your files
- 🔧 **Code Editor**: Edit code files directly in the browser
- 🗄️ **Database GUI**: Manage your databases with visual tools
- 🔗 **File Sharing**: Share files securely with custom permissions

## Getting Started

1. Upload files using the drag-and-drop zone
2. Create folders to organize your content
3. Use the code editor for text and code files
4. Share files with generated secure links

Happy storage! 🎉`,
    size: 768,
    checksum: "def456",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdBy: "admin@tanuki.dev",
    changeDescription: "Added emojis and improved formatting",
    tags: ["update", "formatting"]
  },
  {
    id: "v3",
    fileId: "readme",
    versionNumber: 3,
    content: `# Tanuki Web Storage Platform

Welcome to your personal cloud storage platform!

## Features

- 📁 **File Management**: Upload, organize, and manage your files
- 🔧 **Code Editor**: Edit code files directly in the browser
- 🗄️ **Database GUI**: Manage your databases with visual tools
- 🔗 **File Sharing**: Share files securely with custom permissions

## Getting Started

1. Upload files using the drag-and-drop zone
2. Create folders to organize your content
3. Use the code editor for text and code files
4. Share files with generated secure links

## New Features

- Advanced search and filtering
- File versioning and history
- Real-time notifications

Happy storage! 🎉`,
    size: 1024,
    checksum: "ghi789",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "user@tanuki.dev",
    changeDescription: "Added new features section",
    tags: ["update", "features"]
  }
]

export class FileVersioningService {
  private static instance: FileVersioningService
  private versions: FileVersion[] = [...mockVersions]

  static getInstance(): FileVersioningService {
    if (!FileVersioningService.instance) {
      FileVersioningService.instance = new FileVersioningService()
    }
    return FileVersioningService.instance
  }

  async getFileHistory(fileId: string): Promise<FileHistory | null> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const fileVersions = this.versions
      .filter(v => v.fileId === fileId)
      .sort((a, b) => b.versionNumber - a.versionNumber)

    if (fileVersions.length === 0) return null

    const totalSize = fileVersions.reduce((sum, v) => sum + v.size, 0)

    return {
      fileId,
      fileName: "README.md", // In real implementation, get from file service
      totalVersions: fileVersions.length,
      currentVersion: Math.max(...fileVersions.map(v => v.versionNumber)),
      versions: fileVersions,
      totalSize
    }
  }

  async getVersion(versionId: string): Promise<FileVersion | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return this.versions.find(v => v.id === versionId) || null
  }

  async createVersion(
    fileId: string, 
    content: string, 
    createdBy: string, 
    changeDescription?: string,
    tags?: string[]
  ): Promise<FileVersion> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const existingVersions = this.versions.filter(v => v.fileId === fileId)
    const nextVersion = existingVersions.length > 0 
      ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1 
      : 1

    const newVersion: FileVersion = {
      id: `v${Date.now()}`,
      fileId,
      versionNumber: nextVersion,
      content,
      size: new Blob([content]).size,
      checksum: this.generateChecksum(content),
      createdAt: new Date().toISOString(),
      createdBy,
      changeDescription,
      tags
    }

    this.versions.push(newVersion)
    return newVersion
  }

  async restoreVersion(fileId: string, versionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const version = this.versions.find(v => v.id === versionId)
    if (!version) return false

    // In real implementation, this would update the actual file
    // For now, we'll create a new version with the restored content
    await this.createVersion(
      fileId,
      version.content,
      "system",
      `Restored from version ${version.versionNumber}`,
      ["restore"]
    )

    return true
  }

  async deleteVersion(versionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const index = this.versions.findIndex(v => v.id === versionId)
    if (index === -1) return false

    this.versions.splice(index, 1)
    return true
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<VersionComparison | null> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const version1 = await this.getVersion(versionId1)
    const version2 = await this.getVersion(versionId2)

    if (!version1 || !version2) return null

    const [oldVersion, newVersion] = version1.versionNumber < version2.versionNumber 
      ? [version1, version2] 
      : [version2, version1]

    const changes = this.calculateChanges(oldVersion.content, newVersion.content)

    return {
      oldVersion,
      newVersion,
      changes
    }
  }

  async searchVersions(fileId: string, query: string): Promise<FileVersion[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const fileVersions = this.versions.filter(v => v.fileId === fileId)
    
    if (!query) return fileVersions

    const lowerQuery = query.toLowerCase()
    return fileVersions.filter(version =>
      version.changeDescription?.toLowerCase().includes(lowerQuery) ||
      version.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      version.content.toLowerCase().includes(lowerQuery)
    )
  }

  private generateChecksum(content: string): string {
    // Simple hash function for demo purposes
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private calculateChanges(oldContent: string, newContent: string) {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    
    const additions: string[] = []
    const deletions: string[] = []
    const modifications: { line: number; old: string; new: string }[] = []

    // Simple diff algorithm for demo
    const maxLines = Math.max(oldLines.length, newLines.length)
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === undefined && newLine !== undefined) {
        additions.push(newLine)
      } else if (oldLine !== undefined && newLine === undefined) {
        deletions.push(oldLine)
      } else if (oldLine !== newLine) {
        modifications.push({ line: i + 1, old: oldLine, new: newLine })
      }
    }

    return {
      linesAdded: additions.length,
      linesRemoved: deletions.length,
      linesModified: modifications.length,
      additions,
      deletions,
      modifications
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  getVersionStats(versions: FileVersion[]) {
    const totalSize = versions.reduce((sum, v) => sum + v.size, 0)
    const avgSize = versions.length > 0 ? totalSize / versions.length : 0
    const sizeGrowth = versions.length > 1 
      ? ((versions[0].size - versions[versions.length - 1].size) / versions[versions.length - 1].size) * 100
      : 0

    return {
      totalVersions: versions.length,
      totalSize: this.formatFileSize(totalSize),
      averageSize: this.formatFileSize(avgSize),
      sizeGrowth: Math.round(sizeGrowth * 100) / 100
    }
  }
}
