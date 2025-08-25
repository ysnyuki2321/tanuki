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
  StorageAccessDeniedError,
  StorageQuotaExceededError
} from '../storage-interface'

// GCS SDK interfaces (to avoid requiring GCS SDK as dependency until needed)
interface GCSBucket {
  file(name: string): GCSFile
  upload(localPath: string, options?: any): Promise<[GCSFile]>
  getFiles(options?: any): Promise<[GCSFile[]]>
  exists(): Promise<[boolean]>
}

interface GCSFile {
  name: string
  bucket: GCSBucket
  save(data: Buffer | string, options?: any): Promise<void>
  download(options?: any): Promise<[Buffer]>
  delete(): Promise<void>
  exists(): Promise<[boolean]>
  getMetadata(): Promise<[any]>
  setMetadata(metadata: any): Promise<void>
  copy(destination: string | GCSFile): Promise<[GCSFile]>
  move(destination: string | GCSFile): Promise<[GCSFile]>
  getSignedUrl(options: any): Promise<[string]>
  createReadStream(options?: any): NodeJS.ReadableStream
  createWriteStream(options?: any): NodeJS.WritableStream
}

interface GCSStorage {
  bucket(name: string): GCSBucket
}

export class GCSStorageProvider implements StorageProvider {
  readonly name: string = 'gcs'
  readonly type = 'gcs' as const
  readonly region?: string
  readonly bucketName: string

  private storage: GCSStorage
  private bucket: GCSBucket
  private initialized = false
  private projectId: string

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName
    this.region = config.region
    this.projectId = config.credentials.projectId
    
    // Initialize will be called lazily
    this.initializeClient(config)
  }

  private async initializeClient(config: StorageConfig): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamically import Google Cloud Storage SDK
      const { Storage } = await import('@google-cloud/storage')
      
      const storageOptions: any = {
        projectId: this.projectId
      }

      // Handle authentication methods
      if (config.credentials.keyFilename) {
        storageOptions.keyFilename = config.credentials.keyFilename
      } else if (config.credentials.credentials) {
        storageOptions.credentials = config.credentials.credentials
      }

      this.storage = new Storage(storageOptions) as unknown as GCSStorage
      this.bucket = this.storage.bucket(this.bucketName)
      this.initialized = true
    } catch (error) {
      throw new StorageError(
        'Failed to initialize GCS client. Make sure @google-cloud/storage is installed.',
        'INITIALIZATION_ERROR',
        this.name,
        error as Error
      )
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      throw new StorageError(
        'GCS client not initialized',
        'NOT_INITIALIZED',
        this.name
      )
    }
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: StorageUploadOptions
  ): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      
      const uploadOptions: any = {
        metadata: {
          contentType: options?.mimeType || 'application/octet-stream',
          cacheControl: options?.cacheControl,
          contentEncoding: options?.contentEncoding,
          metadata: options?.customMetadata || {}
        },
        public: options?.isPublic || false,
        resumable: this.getByteLength(data) > 5 * 1024 * 1024, // Use resumable for files > 5MB
        validation: 'crc32c'
      }

      // Handle progress callback
      if (options?.progressCallback) {
        const stream = file.createWriteStream(uploadOptions)
        
        return new Promise((resolve, reject) => {
          let uploaded = 0
          const totalSize = this.getByteLength(data)

          stream.on('progress', (bytesWritten: number) => {
            uploaded = bytesWritten
            const percentage = (uploaded / totalSize) * 100
            options.progressCallback!(percentage)
          })

          stream.on('error', reject)
          
          stream.on('finish', async () => {
            try {
              const metadata = await this.getMetadata(key)
              resolve({
                key,
                size: metadata.size,
                lastModified: metadata.lastModified,
                etag: metadata.etag,
                metadata,
                url: this.getPublicUrl(key),
                publicUrl: options?.isPublic ? this.getPublicUrl(key) : undefined
              })
            } catch (error) {
              reject(error)
            }
          })

          stream.end(data)
        })
      } else {
        // Simple upload
        await file.save(data, uploadOptions)
        
        const metadata = await this.getMetadata(key)
        return {
          key,
          size: metadata.size,
          lastModified: metadata.lastModified,
          etag: metadata.etag,
          metadata,
          url: this.getPublicUrl(key),
          publicUrl: options?.isPublic ? this.getPublicUrl(key) : undefined
        }
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async download(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer | NodeJS.ReadableStream | string | any> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      
      // Check if file exists
      const [exists] = await file.exists()
      if (!exists) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Handle range requests
      const downloadOptions: any = {}
      if (options?.range) {
        downloadOptions.start = options.range.start
        if (options.range.end) {
          downloadOptions.end = options.range.end
        }
      }

      // Handle different response types
      if (options?.responseType === 'stream') {
        return file.createReadStream(downloadOptions)
      } else {
        const [buffer] = await file.download(downloadOptions)
        
        if (options?.responseType === 'text') {
          return buffer.toString('utf-8')
        } else if (options?.responseType === 'json') {
          return JSON.parse(buffer.toString('utf-8'))
        } else {
          return buffer
        }
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      await file.delete()
    } catch (error) {
      // GCS doesn't throw error for non-existent files in delete
      if (error instanceof Error && error.message.includes('No such object')) {
        return // Silently succeed for non-existent files
      }
      throw this.handleError(error, key)
    }
  }

  async deleteMany(keys: string[]): Promise<string[]> {
    await this.ensureInitialized()

    const failed: string[] = []

    // GCS doesn't have bulk delete, so we delete individually
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
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      const [exists] = await file.exists()
      return exists
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      const [metadata] = await file.getMetadata()

      return {
        size: parseInt(metadata.size) || 0,
        mimeType: metadata.contentType || 'application/octet-stream',
        lastModified: new Date(metadata.updated || metadata.timeCreated),
        etag: metadata.etag,
        cacheControl: metadata.cacheControl,
        contentEncoding: metadata.contentEncoding,
        customMetadata: metadata.metadata || {}
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      
      const updateMetadata: any = {}
      if (metadata.mimeType) updateMetadata.contentType = metadata.mimeType
      if (metadata.cacheControl) updateMetadata.cacheControl = metadata.cacheControl
      if (metadata.contentEncoding) updateMetadata.contentEncoding = metadata.contentEncoding
      if (metadata.customMetadata) updateMetadata.metadata = metadata.customMetadata

      await file.setMetadata(updateMetadata)
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    await this.ensureInitialized()

    try {
      const listOptions: any = {
        maxResults: options?.maxResults || 1000,
        pageToken: options?.pageToken,
        prefix: options?.prefix,
        delimiter: options?.delimiter,
        includeTrailingDelimiter: true
      }

      const [files, , apiResponse] = await this.bucket.getFiles(listOptions)

      const objects: StorageObject[] = files.map((file: any) => ({
        key: file.name,
        size: parseInt(file.metadata.size) || 0,
        lastModified: new Date(file.metadata.updated || file.metadata.timeCreated),
        etag: file.metadata.etag,
        metadata: options?.includeMetadata ? {
          size: parseInt(file.metadata.size) || 0,
          mimeType: file.metadata.contentType || 'application/octet-stream',
          lastModified: new Date(file.metadata.updated || file.metadata.timeCreated),
          etag: file.metadata.etag,
          cacheControl: file.metadata.cacheControl,
          contentEncoding: file.metadata.contentEncoding,
          customMetadata: file.metadata.metadata || {}
        } : undefined
      }))

      return {
        objects,
        prefixes: apiResponse.prefixes || [],
        nextPageToken: apiResponse.nextPageToken,
        isTruncated: !!apiResponse.nextPageToken
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
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(key)}`
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      
      const signedUrlOptions: any = {
        version: 'v4',
        action: options.method?.toLowerCase() || 'read',
        expires: Date.now() + (options.expiresIn * 1000)
      }

      if (options.contentType) {
        signedUrlOptions.contentType = options.contentType
      }

      if (options.customMetadata) {
        signedUrlOptions.extensionHeaders = {}
        Object.entries(options.customMetadata).forEach(([key, value]) => {
          signedUrlOptions.extensionHeaders[`x-goog-meta-${key}`] = value
        })
      }

      const [signedUrl] = await file.getSignedUrl(signedUrlOptions)
      return signedUrl
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      const sourceFile = this.bucket.file(sourceKey)
      const destinationFile = this.bucket.file(destinationKey)
      
      await sourceFile.copy(destinationFile)
      
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
    await this.ensureInitialized()

    try {
      const sourceFile = this.bucket.file(sourceKey)
      const destinationFile = this.bucket.file(destinationKey)
      
      await sourceFile.move(destinationFile)
      
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

  // Resumable upload support for large files
  async createMultipartUpload(key: string, options?: StorageUploadOptions): Promise<string> {
    await this.ensureInitialized()

    try {
      const file = this.bucket.file(key)
      
      // GCS uses resumable uploads automatically for large files
      // We'll return a pseudo upload ID that can be used to track the upload
      const uploadId = `gcs-resumable-${key}-${Date.now()}`
      
      // Store upload options for later use (in a real implementation, this would be persisted)
      const uploadMetadata = {
        contentType: options?.mimeType || 'application/octet-stream',
        cacheControl: options?.cacheControl,
        contentEncoding: options?.contentEncoding,
        metadata: options?.customMetadata || {},
        public: options?.isPublic || false
      }

      // In a real implementation, you'd store this metadata somewhere
      return uploadId
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async healthCheck(): Promise<boolean> {
    await this.ensureInitialized()

    try {
      // Check if bucket exists and is accessible
      const [exists] = await this.bucket.exists()
      return exists
    } catch (error) {
      console.error('GCS storage health check failed:', error)
      return false
    }
  }

  private handleError(error: any, key?: string): StorageError {
    console.error('GCS storage error:', error)

    const message = error?.message || 'Unknown GCS storage error'
    const code = error?.code || error?.status || 'UNKNOWN_ERROR'

    // Map common GCS errors to our error types
    if (code === 404 || message.includes('No such object') || message.includes('not found')) {
      return new StorageNotFoundError(key || 'unknown', this.name)
    }

    if (code === 403 || message.includes('access denied') || message.includes('forbidden')) {
      return new StorageAccessDeniedError(key || 'unknown', this.name)
    }

    if (code === 429 || message.includes('quota') || message.includes('rate limit')) {
      return new StorageQuotaExceededError(this.name)
    }

    return new StorageError(
      message,
      code.toString(),
      this.name,
      error
    )
  }
}
