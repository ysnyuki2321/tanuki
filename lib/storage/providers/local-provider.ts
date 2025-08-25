import fs from 'fs/promises'
import path from 'path'
import { createReadStream, createWriteStream, existsSync, statSync } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import crypto from 'crypto'

import {
  StorageProvider,
  StorageConfig,
  StorageObject,
  StorageMetadata,
  StorageUploadOptions,
  StorageDownloadOptions,
  StorageListOptions,
  StorageListResult,
  StorageSignedUrlOptions,
  StorageError,
  StorageNotFoundError,
  StorageAccessDeniedError
} from '../storage-interface'

const pipelineAsync = promisify(pipeline)

export class LocalStorageProvider implements StorageProvider {
  readonly name: string = 'local'
  readonly type = 'local' as const
  readonly region?: string
  readonly bucketName: string

  private basePath: string
  private metadataPath: string

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName
    this.basePath = path.resolve(config.credentials.basePath, this.bucketName)
    this.metadataPath = path.join(this.basePath, '.metadata')
    
    // Ensure base directory exists
    this.ensureDirectoryExists(this.basePath)
    this.ensureDirectoryExists(this.metadataPath)
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new StorageError(
          `Failed to create directory: ${dirPath}`,
          'DIRECTORY_CREATE_ERROR',
          this.name,
          error
        )
      }
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '')
    return path.join(this.basePath, sanitizedKey)
  }

  private getMetadataFilePath(key: string): string {
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '')
    const metadataKey = crypto.createHash('md5').update(sanitizedKey).digest('hex')
    return path.join(this.metadataPath, `${metadataKey}.json`)
  }

  private async saveMetadata(key: string, metadata: StorageMetadata): Promise<void> {
    const metadataFilePath = this.getMetadataFilePath(key)
    const metadataDir = path.dirname(metadataFilePath)
    
    await this.ensureDirectoryExists(metadataDir)
    await fs.writeFile(metadataFilePath, JSON.stringify({
      key,
      ...metadata,
      lastModified: metadata.lastModified.toISOString()
    }))
  }

  private async loadMetadata(key: string): Promise<StorageMetadata | null> {
    try {
      const metadataFilePath = this.getMetadataFilePath(key)
      const metadataJson = await fs.readFile(metadataFilePath, 'utf-8')
      const metadata = JSON.parse(metadataJson)
      
      return {
        ...metadata,
        lastModified: new Date(metadata.lastModified)
      }
    } catch (error) {
      return null
    }
  }

  private generateETag(filePath: string): string {
    try {
      const stats = statSync(filePath)
      return crypto
        .createHash('md5')
        .update(`${stats.mtime.getTime()}-${stats.size}`)
        .digest('hex')
    } catch {
      return crypto.createHash('md5').update(Date.now().toString()).digest('hex')
    }
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: StorageUploadOptions
  ): Promise<StorageObject> {
    try {
      const filePath = this.getFilePath(key)
      const fileDir = path.dirname(filePath)
      
      // Ensure directory exists
      await this.ensureDirectoryExists(fileDir)

      // Convert data to buffer
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as string)

      // Write file with progress tracking
      if (options?.progressCallback) {
        const stream = createWriteStream(filePath)
        let written = 0
        const totalSize = buffer.length

        stream.on('drain', () => {
          const percentage = (written / totalSize) * 100
          options.progressCallback!(percentage)
        })

        await pipelineAsync(
          async function* () {
            yield buffer
          },
          stream
        )

        options.progressCallback(100)
      } else {
        await fs.writeFile(filePath, buffer)
      }

      // Create metadata
      const stats = await fs.stat(filePath)
      const etag = this.generateETag(filePath)
      
      const metadata: StorageMetadata = {
        size: stats.size,
        mimeType: options?.mimeType || 'application/octet-stream',
        lastModified: stats.mtime,
        etag,
        cacheControl: options?.cacheControl,
        contentEncoding: options?.contentEncoding,
        customMetadata: options?.customMetadata || {}
      }

      await this.saveMetadata(key, metadata)

      return {
        key,
        size: metadata.size,
        lastModified: metadata.lastModified,
        etag: metadata.etag,
        metadata,
        url: this.getPublicUrl(key),
        publicUrl: options?.isPublic ? this.getPublicUrl(key) : undefined
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async download(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer | NodeJS.ReadableStream | string | any> {
    try {
      const filePath = this.getFilePath(key)
      
      // Check if file exists
      if (!existsSync(filePath)) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Handle range requests
      if (options?.range) {
        const stats = await fs.stat(filePath)
        const start = options.range.start
        const end = Math.min(options.range.end || stats.size - 1, stats.size - 1)
        
        if (options?.responseType === 'stream') {
          return createReadStream(filePath, { start, end })
        } else {
          const buffer = Buffer.alloc(end - start + 1)
          const fd = await fs.open(filePath, 'r')
          await fd.read(buffer, 0, buffer.length, start)
          await fd.close()
          
          if (options?.responseType === 'text') {
            return buffer.toString('utf-8')
          } else if (options?.responseType === 'json') {
            return JSON.parse(buffer.toString('utf-8'))
          } else {
            return buffer
          }
        }
      } else {
        // Full file download
        if (options?.responseType === 'stream') {
          return createReadStream(filePath)
        } else {
          const buffer = await fs.readFile(filePath)
          
          if (options?.responseType === 'text') {
            return buffer.toString('utf-8')
          } else if (options?.responseType === 'json') {
            return JSON.parse(buffer.toString('utf-8'))
          } else {
            return buffer
          }
        }
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key)
      const metadataFilePath = this.getMetadataFilePath(key)
      
      // Delete file and metadata
      await Promise.all([
        fs.unlink(filePath).catch(() => {}), // Ignore if file doesn't exist
        fs.unlink(metadataFilePath).catch(() => {}) // Ignore if metadata doesn't exist
      ])
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async deleteMany(keys: string[]): Promise<string[]> {
    const failed: string[] = []

    await Promise.all(
      keys.map(async (key) => {
        try {
          await this.delete(key)
        } catch (error) {
          failed.push(key)
        }
      })
    )

    return failed
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key)
      return existsSync(filePath)
    } catch (error) {
      return false
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    try {
      const filePath = this.getFilePath(key)
      
      if (!existsSync(filePath)) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Try to load saved metadata first
      const savedMetadata = await this.loadMetadata(key)
      if (savedMetadata) {
        return savedMetadata
      }

      // Fallback to file stats
      const stats = await fs.stat(filePath)
      const etag = this.generateETag(filePath)
      
      return {
        size: stats.size,
        mimeType: 'application/octet-stream',
        lastModified: stats.mtime,
        etag,
        customMetadata: {}
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    try {
      const currentMetadata = await this.getMetadata(key)
      const updatedMetadata = { ...currentMetadata, ...metadata }
      await this.saveMetadata(key, updatedMetadata)
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    try {
      const objects: StorageObject[] = []
      const prefixes: string[] = []
      
      const walkDirectory = async (dir: string, currentPrefix: string = ''): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue // Skip hidden files/directories
          
          const fullPath = path.join(dir, entry.name)
          const relativePath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name
          
          if (entry.isDirectory()) {
            if (options?.delimiter && !options?.prefix) {
              prefixes.push(`${relativePath}/`)
            } else {
              await walkDirectory(fullPath, relativePath)
            }
          } else {
            // Check prefix filter
            if (options?.prefix && !relativePath.startsWith(options.prefix)) {
              continue
            }
            
            // Check max results
            if (options?.maxResults && objects.length >= options.maxResults) {
              break
            }
            
            const stats = await fs.stat(fullPath)
            const etag = this.generateETag(fullPath)
            
            const storageObject: StorageObject = {
              key: relativePath,
              size: stats.size,
              lastModified: stats.mtime,
              etag
            }

            // Include metadata if requested
            if (options?.includeMetadata) {
              try {
                storageObject.metadata = await this.getMetadata(relativePath)
              } catch {
                // Use basic metadata if saved metadata not available
                storageObject.metadata = {
                  size: stats.size,
                  mimeType: 'application/octet-stream',
                  lastModified: stats.mtime,
                  etag,
                  customMetadata: {}
                }
              }
            }
            
            objects.push(storageObject)
          }
        }
      }

      await walkDirectory(this.basePath)

      return {
        objects: objects.slice(0, options?.maxResults || objects.length),
        prefixes,
        isTruncated: options?.maxResults ? objects.length > options.maxResults : false,
        nextPageToken: options?.maxResults && objects.length > options.maxResults 
          ? (options.maxResults).toString() 
          : undefined
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async listByPrefix(
    prefix: string,
    options?: Omit<StorageListOptions, 'prefix'>
  ): Promise<StorageListResult> {
    return this.list({ ...options, prefix })
  }

  getPublicUrl(key: string): string {
    // For local storage, we can't provide a real public URL
    // In a real implementation, you might serve files through a local HTTP server
    return `file://${this.getFilePath(key)}`
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    // For local storage, we'll generate a simple signed URL using HMAC
    // In production, you'd want a more sophisticated implementation
    try {
      const filePath = this.getFilePath(key)
      
      if (!existsSync(filePath)) {
        throw new StorageNotFoundError(key, this.name)
      }

      const expiresAt = Date.now() + (options.expiresIn * 1000)
      const payload = JSON.stringify({
        key,
        method: options.method || 'GET',
        expires: expiresAt
      })
      
      // Simple HMAC signature (in production, use a proper secret)
      const signature = crypto
        .createHmac('sha256', 'local-storage-secret')
        .update(payload)
        .digest('hex')
      
      return `local://${this.bucketName}/${key}?expires=${expiresAt}&signature=${signature}`
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    try {
      const sourcePath = this.getFilePath(sourceKey)
      const destinationPath = this.getFilePath(destinationKey)
      
      if (!existsSync(sourcePath)) {
        throw new StorageNotFoundError(sourceKey, this.name)
      }

      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath)
      await this.ensureDirectoryExists(destinationDir)

      // Copy file
      await fs.copyFile(sourcePath, destinationPath)
      
      // Copy metadata
      const sourceMetadata = await this.loadMetadata(sourceKey)
      if (sourceMetadata) {
        await this.saveMetadata(destinationKey, sourceMetadata)
      }

      const metadata = await this.getMetadata(destinationKey)
      return {
        key: destinationKey,
        size: metadata.size,
        lastModified: metadata.lastModified,
        etag: metadata.etag,
        metadata
      }
    } catch (error) {
      throw this.handleError(error, sourceKey)
    }
  }

  async move(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    try {
      const sourcePath = this.getFilePath(sourceKey)
      const destinationPath = this.getFilePath(destinationKey)
      
      if (!existsSync(sourcePath)) {
        throw new StorageNotFoundError(sourceKey, this.name)
      }

      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath)
      await this.ensureDirectoryExists(destinationDir)

      // Move file
      await fs.rename(sourcePath, destinationPath)
      
      // Move metadata
      const sourceMetadata = await this.loadMetadata(sourceKey)
      if (sourceMetadata) {
        await this.saveMetadata(destinationKey, sourceMetadata)
        await fs.unlink(this.getMetadataFilePath(sourceKey)).catch(() => {})
      }

      const metadata = await this.getMetadata(destinationKey)
      return {
        key: destinationKey,
        size: metadata.size,
        lastModified: metadata.lastModified,
        etag: metadata.etag,
        metadata
      }
    } catch (error) {
      throw this.handleError(error, sourceKey)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check if base directory is accessible
      await fs.access(this.basePath, fs.constants.R_OK | fs.constants.W_OK)
      return true
    } catch (error) {
      console.error('Local storage health check failed:', error)
      return false
    }
  }

  private handleError(error: any, key?: string): StorageError {
    console.error('Local storage error:', error)

    const message = error?.message || 'Unknown local storage error'
    const code = error?.code || 'UNKNOWN_ERROR'

    // Map common file system errors to our error types
    if (code === 'ENOENT' || message.includes('no such file')) {
      return new StorageNotFoundError(key || 'unknown', this.name)
    }

    if (code === 'EACCES' || code === 'EPERM' || message.includes('permission denied')) {
      return new StorageAccessDeniedError(key || 'unknown', this.name)
    }

    return new StorageError(
      message,
      code.toString(),
      this.name,
      error
    )
  }
}
