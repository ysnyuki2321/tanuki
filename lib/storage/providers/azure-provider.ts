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

// Azure SDK interfaces (to avoid requiring Azure SDK as dependency until needed)
interface AzureBlobServiceClient {
  getContainerClient(containerName: string): AzureContainerClient
}

interface AzureContainerClient {
  getBlobClient(blobName: string): AzureBlobClient
  listBlobsFlat(options?: any): AsyncIterable<any>
  exists(): Promise<boolean>
}

interface AzureBlobClient {
  upload(body: Buffer | string, bodyLength: number, options?: any): Promise<any>
  download(offset?: number, count?: number, options?: any): Promise<any>
  delete(options?: any): Promise<any>
  exists(): Promise<boolean>
  getProperties(): Promise<any>
  setMetadata(metadata: any, options?: any): Promise<any>
  generateSasUrl(options: any): Promise<string>
  startCopyFromURL(copySource: string, options?: any): Promise<any>
  downloadToBuffer(buffer?: Buffer, offset?: number, count?: number, options?: any): Promise<any>
}

interface AzureStorageSharedKeyCredential {
  accountName: string
}

export class AzureStorageProvider implements StorageProvider {
  readonly name: string = 'azure'
  readonly type = 'azure' as const
  readonly region?: string
  readonly bucketName: string

  private blobServiceClient: AzureBlobServiceClient
  private containerClient: AzureContainerClient
  private initialized = false
  private accountName: string

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName // In Azure, this is the container name
    this.region = config.region
    this.accountName = config.credentials.accountName || ''
    
    // Initialize will be called lazily
    this.initializeClient(config)
  }

  private async initializeClient(config: StorageConfig): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamically import Azure Storage SDK
      const { BlobServiceClient, StorageSharedKeyCredential } = await import('@azure/storage-blob')
      
      let blobServiceClient: any

      if (config.credentials.connectionString) {
        // Use connection string
        blobServiceClient = BlobServiceClient.fromConnectionString(config.credentials.connectionString)
        
        // Extract account name from connection string
        const accountNameMatch = config.credentials.connectionString.match(/AccountName=([^;]+)/)
        if (accountNameMatch) {
          this.accountName = accountNameMatch[1]
        }
      } else if (config.credentials.accountName && config.credentials.accountKey) {
        // Use account name and key
        this.accountName = config.credentials.accountName
        const sharedKeyCredential = new StorageSharedKeyCredential(
          config.credentials.accountName,
          config.credentials.accountKey
        )
        
        blobServiceClient = new BlobServiceClient(
          `https://${config.credentials.accountName}.blob.core.windows.net`,
          sharedKeyCredential
        )
      } else {
        throw new Error('Either connectionString or accountName + accountKey are required')
      }

      this.blobServiceClient = blobServiceClient
      this.containerClient = this.blobServiceClient.getContainerClient(this.bucketName)
      this.initialized = true
    } catch (error) {
      throw new StorageError(
        'Failed to initialize Azure client. Make sure @azure/storage-blob is installed.',
        'INITIALIZATION_ERROR',
        this.name,
        error as Error
      )
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      throw new StorageError(
        'Azure client not initialized',
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
      const blobClient = this.containerClient.getBlobClient(key)
      
      const uploadOptions: any = {
        blobHTTPHeaders: {
          blobContentType: options?.mimeType || 'application/octet-stream',
          blobCacheControl: options?.cacheControl,
          blobContentEncoding: options?.contentEncoding
        },
        metadata: options?.customMetadata || {},
        tier: 'Hot' // Default to Hot tier
      }

      // Handle progress callback
      if (options?.progressCallback) {
        uploadOptions.onProgress = (progress: any) => {
          const percentage = (progress.loadedBytes / (data as any).length) * 100
          options.progressCallback!(percentage)
        }
      }

      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as string)
      await blobClient.upload(buffer, buffer.length, uploadOptions)

      // Get metadata for response
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
      const blobClient = this.containerClient.getBlobClient(key)
      
      const downloadOptions: any = {}
      
      // Handle range requests
      if (options?.range) {
        downloadOptions.range = {
          offset: options.range.start,
          count: options.range.end ? (options.range.end - options.range.start + 1) : undefined
        }
      }

      const downloadResponse = await blobClient.download(
        downloadOptions.range?.offset || 0,
        downloadOptions.range?.count,
        downloadOptions
      )

      if (!downloadResponse.readableStreamBody) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Handle different response types
      if (options?.responseType === 'stream') {
        return downloadResponse.readableStreamBody
      } else {
        // Download to buffer
        const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody)
        
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
      const blobClient = this.containerClient.getBlobClient(key)
      await blobClient.delete()
    } catch (error) {
      // Azure doesn't throw error for non-existent blobs in delete
      if (error instanceof Error && error.message.includes('BlobNotFound')) {
        return // Silently succeed for non-existent blobs
      }
      throw this.handleError(error, key)
    }
  }

  async deleteMany(keys: string[]): Promise<string[]> {
    await this.ensureInitialized()

    const failed: string[] = []

    // Azure doesn't have bulk delete, so we delete individually
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
      const blobClient = this.containerClient.getBlobClient(key)
      return await blobClient.exists()
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    await this.ensureInitialized()

    try {
      const blobClient = this.containerClient.getBlobClient(key)
      const properties = await blobClient.getProperties()

      return {
        size: properties.contentLength || 0,
        mimeType: properties.contentType || 'application/octet-stream',
        lastModified: properties.lastModified || new Date(),
        etag: properties.etag?.replace(/"/g, ''),
        cacheControl: properties.cacheControl,
        contentEncoding: properties.contentEncoding,
        customMetadata: properties.metadata || {}
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    await this.ensureInitialized()

    try {
      const blobClient = this.containerClient.getBlobClient(key)
      
      // Azure requires setting HTTP headers and metadata separately
      const httpHeaders: any = {}
      if (metadata.mimeType) httpHeaders.blobContentType = metadata.mimeType
      if (metadata.cacheControl) httpHeaders.blobCacheControl = metadata.cacheControl
      if (metadata.contentEncoding) httpHeaders.blobContentEncoding = metadata.contentEncoding

      // Set HTTP headers if any
      if (Object.keys(httpHeaders).length > 0) {
        await blobClient.setHTTPHeaders(httpHeaders)
      }

      // Set custom metadata
      if (metadata.customMetadata) {
        await blobClient.setMetadata(metadata.customMetadata)
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    await this.ensureInitialized()

    try {
      const listOptions: any = {
        prefix: options?.prefix,
        includeMetadata: options?.includeMetadata || false
      }

      const objects: StorageObject[] = []
      const prefixes: string[] = []
      let count = 0
      const maxResults = options?.maxResults || 1000

      // Azure SDK uses async iteration
      for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
        if (count >= maxResults) break

        objects.push({
          key: blob.name,
          size: blob.properties.contentLength || 0,
          lastModified: blob.properties.lastModified || new Date(),
          etag: blob.properties.etag?.replace(/"/g, ''),
          metadata: options?.includeMetadata ? {
            size: blob.properties.contentLength || 0,
            mimeType: blob.properties.contentType || 'application/octet-stream',
            lastModified: blob.properties.lastModified || new Date(),
            etag: blob.properties.etag?.replace(/"/g, ''),
            cacheControl: blob.properties.cacheControl,
            contentEncoding: blob.properties.contentEncoding,
            customMetadata: blob.metadata || {}
          } : undefined
        })

        count++
      }

      return {
        objects,
        prefixes,
        isTruncated: objects.length === maxResults,
        nextPageToken: objects.length === maxResults ? `${count}` : undefined
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
    return `https://${this.accountName}.blob.core.windows.net/${this.bucketName}/${encodeURIComponent(key)}`
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    await this.ensureInitialized()

    try {
      const blobClient = this.containerClient.getBlobClient(key)
      
      // Azure SAS options
      const sasOptions: any = {
        permissions: this.getAzurePermissions(options.method),
        expiresOn: new Date(Date.now() + (options.expiresIn * 1000))
      }

      if (options.contentType) {
        sasOptions.contentType = options.contentType
      }

      return await blobClient.generateSasUrl(sasOptions)
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      const sourceBlobClient = this.containerClient.getBlobClient(sourceKey)
      const destinationBlobClient = this.containerClient.getBlobClient(destinationKey)
      
      const sourceUrl = sourceBlobClient.url
      await destinationBlobClient.startCopyFromURL(sourceUrl)
      
      // Wait for copy to complete (in production, you might want to poll for completion)
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

  async move(sourceKey: string, destinationKey: string): StorageObject> {
    await this.ensureInitialized()

    try {
      // Copy then delete (Azure doesn't have native move)
      const copyResult = await this.copy(sourceKey, destinationKey)
      await this.delete(sourceKey)
      return copyResult
    } catch (error) {
      throw this.handleError(error, sourceKey)
    }
  }

  async healthCheck(): Promise<boolean> {
    await this.ensureInitialized()

    try {
      // Check if container exists and is accessible
      return await this.containerClient.exists()
    } catch (error) {
      console.error('Azure storage health check failed:', error)
      return false
    }
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = []
    
    return new Promise((resolve, reject) => {
      readableStream.on('data', (chunk) => {
        chunks.push(chunk)
      })
      
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      
      readableStream.on('error', reject)
    })
  }

  private getAzurePermissions(method?: string): any {
    // Azure Storage permissions mapping
    const { BlobSASPermissions } = require('@azure/storage-blob')
    
    switch (method?.toUpperCase()) {
      case 'PUT':
      case 'POST':
        return BlobSASPermissions.from('cw') // create, write
      case 'DELETE':
        return BlobSASPermissions.from('d') // delete
      case 'GET':
      default:
        return BlobSASPermissions.from('r') // read
    }
  }

  private handleError(error: any, key?: string): StorageError {
    console.error('Azure storage error:', error)

    const message = error?.message || 'Unknown Azure storage error'
    const code = error?.code || error?.statusCode || 'UNKNOWN_ERROR'

    // Map common Azure errors to our error types
    if (code === 'BlobNotFound' || code === 404 || message.includes('not found')) {
      return new StorageNotFoundError(key || 'unknown', this.name)
    }

    if (code === 'AuthorizationFailure' || code === 403 || message.includes('access denied')) {
      return new StorageAccessDeniedError(key || 'unknown', this.name)
    }

    if (code === 'QuotaExceeded' || code === 429 || message.includes('quota')) {
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