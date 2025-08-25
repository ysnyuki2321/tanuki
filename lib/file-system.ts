export interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  size: number
  modifiedAt: string
  createdAt: string
  path: string
  parentId?: string
  mimeType?: string
  isShared?: boolean
  shareId?: string
  content?: string // For text files
  url?: string // For file downloads/previews
}

// Mock file system service
export class FileSystemService {
  private static instance: FileSystemService
  private static files: FileItem[] = [
    // Root folders
    {
      id: "documents",
      name: "Documents",
      type: "folder",
      size: 0,
      modifiedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      path: "/Documents",
    },
    {
      id: "projects",
      name: "Projects",
      type: "folder",
      size: 0,
      modifiedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      path: "/Projects",
    },
    {
      id: "media",
      name: "Media",
      type: "folder",
      size: 0,
      modifiedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      path: "/Media",
    },

    // Documents
    {
      id: "readme",
      name: "README.md",
      type: "file",
      size: 2048,
      modifiedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      path: "/Documents/README.md",
      parentId: "documents",
      mimeType: "text/markdown",
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
    },
    {
      id: "proposal",
      name: "Project Proposal.docx",
      type: "file",
      size: 1024000,
      modifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      path: "/Documents/Project Proposal.docx",
      parentId: "documents",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },

    // Projects
    {
      id: "tanuki-app",
      name: "tanuki-web-app.zip",
      type: "file",
      size: 15728640,
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      path: "/Projects/tanuki-web-app.zip",
      parentId: "projects",
      mimeType: "application/zip",
      isShared: true,
      shareId: "demo-project",
    },
    {
      id: "database-schema",
      name: "users.sql",
      type: "file",
      size: 2048576,
      modifiedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      path: "/Projects/users.sql",
      parentId: "projects",
      mimeType: "application/sql",
      isShared: true,
      shareId: "sample-database",
      content: `-- Tanuki Storage Platform Database Schema
-- User management and file storage tables

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    file_path VARCHAR(1000) NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_folder BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(100),
    share_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File versions for version control
CREATE TABLE file_versions (
    id SERIAL PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT,
    size BIGINT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File shares and permissions
CREATE TABLE file_shares (
    id SERIAL PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    shared_by INTEGER REFERENCES users(id),
    shared_with_email VARCHAR(255),
    permission_level VARCHAR(20) DEFAULT 'read', -- read, write, admin
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_parent_folder_id ON files(parent_folder_id);
CREATE INDEX idx_files_share_token ON files(share_token);
CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);

-- Sample data
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@tanuki.dev', 'Admin User', '$2b$10$example_hash', 'admin'),
('user@tanuki.dev', 'Demo User', '$2b$10$example_hash', 'user');

-- Sample notification preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    file_upload_notifications BOOLEAN DEFAULT TRUE,
    share_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`,
    },
    {
      id: "config-file",
      name: "config.json",
      type: "file",
      size: 512,
      modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      path: "/Projects/config.json",
      parentId: "projects",
      mimeType: "application/json",
      content: `{
  "app": {
    "name": "Tanuki Storage Platform",
    "version": "1.0.0",
    "description": "Advanced web storage with code editing and database management"
  },
  "server": {
    "port": 3000,
    "host": "localhost",
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:3000", "https://tanuki.app"]
    }
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "name": "tanuki_db",
    "ssl": false
  },
  "storage": {
    "provider": "local",
    "maxFileSize": "100MB",
    "allowedTypes": [
      "image/*",
      "text/*",
      "application/pdf",
      "application/zip"
    ]
  },
  "features": {
    "codeEditor": true,
    "databaseGui": true,
    "fileSharing": true,
    "analytics": true
  }
}`,
    },
    {
      id: "main-script",
      name: "main.py",
      type: "file",
      size: 4096,
      modifiedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      path: "/Projects/main.py",
      parentId: "projects",
      mimeType: "text/x-python",
      content: `#!/usr/bin/env python3
"""
Main application entry point for Tanuki Storage Platform
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

class TanukiApp:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path
        self.started_at = datetime.now()
        self.version = "1.0.0"

    def initialize(self) -> bool:
        """Initialize the application"""
        print(f"🚀 Starting Tanuki Storage Platform v{self.version}")
        print(f"📅 Started at: {self.started_at}")

        # Load configuration
        if not self.load_config():
            print("❌ Failed to load configuration")
            return False

        print("✅ Application initialized successfully")
        return True

    def load_config(self) -> bool:
        """Load application configuration"""
        try:
            # Configuration loading logic here
            return True
        except Exception as e:
            print(f"Error loading config: {e}")
            return False

    def run(self):
        """Main application loop"""
        if not self.initialize():
            sys.exit(1)

        print("🎯 Application is running...")
        # Main application logic here

if __name__ == "__main__":
    app = TanukiApp()
    app.run()
`,
    },

    // Media
    {
      id: "tanuki-logo",
      name: "tanuki-logo.png",
      type: "file",
      size: 256000,
      modifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      path: "/Media/tanuki-logo.png",
      parentId: "media",
      mimeType: "image/png",
    },
    {
      id: "demo-video",
      name: "demo-presentation.mp4",
      type: "file",
      size: 52428800,
      modifiedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      path: "/Media/demo-presentation.mp4",
      parentId: "media",
      mimeType: "video/mp4",
    },
    {
      id: "background-music",
      name: "background.mp3",
      type: "file",
      size: 8388608,
      modifiedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
      path: "/Media/background.mp3",
      parentId: "media",
      mimeType: "audio/mpeg",
    },
  ]

  static async getFiles(parentId?: string): Promise<FileItem[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!parentId) {
      // Return root level items
      return this.files.filter((file) => !file.parentId)
    }

    return this.files.filter((file) => file.parentId === parentId)
  }

  static async getFile(id: string): Promise<FileItem | null> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return this.files.find((file) => file.id === id) || null
  }

  static async uploadFile(file: File, parentId?: string): Promise<FileItem> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: file.name,
      type: "file",
      size: file.size,
      modifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: parentId ? `/path/${file.name}` : `/${file.name}`,
      parentId,
      mimeType: file.type,
    }

    this.files.push(newFile)
    return newFile
  }

  static async deleteFile(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const index = this.files.findIndex((file) => file.id === id)
    if (index !== -1) {
      this.files.splice(index, 1)
      return true
    }
    return false
  }

  static async renameFile(id: string, newName: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const file = this.files.find((f) => f.id === id)
    if (file) {
      file.name = newName
      file.modifiedAt = new Date().toISOString()
      return true
    }
    return false
  }

  static async shareFile(id: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const file = this.files.find((f) => f.id === id)
    if (file) {
      const shareId = `share-${Date.now()}`
      file.isShared = true
      file.shareId = shareId
      return shareId
    }
    throw new Error("File not found")
  }

  static async searchFiles(query: string): Promise<FileItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return this.files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
  }
}
