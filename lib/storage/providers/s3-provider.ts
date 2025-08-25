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

// S3 SDK interfaces (to avoid requiring AWS SDK as dependency until needed)
interface S3Client {
  putObject(params: any): { promise(): Promise<any> }
  getObject(params: any): { promise(): Promise<any> }
  deleteObject(params: any): { promise(): Promise<any> }
  deleteObjects(params: any): { promise(): Promise<any> }
  headObject(params: any): { promise(): Promise<any> }
  listObjectsV2(params: any): { promise(): Promise<any> }
  copyObject(params: any): { promise(): Promise<any> }
  getSignedUrl(operation: string, params: any): Promise<string>
  createMultipartUpload(params: any): { promise(): Promise<any> }
  uploadPart(params: any): { promise(): Promise<any> }
  completeMultipartUpload(params: any): { promise(): Promise<any> }
  abortMultipartUpload(params: any): { promise(): Promise<any> }
}

export class S3StorageProvider implements StorageProvider {
  readonly name: string = 's3'
  readonly type = 's3' as const
  readonly region: string
  readonly bucketName: string

  private s3Client: S3Client
  private initialized = false

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName
    this.region = config.region || 'us-east-1'
    
    // Initialize will be called lazily
    this.initializeClient(config)
  }

  private async initializeClient(config: StorageConfig): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamically import AWS SDK to avoid bundle size impact
      const AWS = await import('aws-sdk')
      
      AWS.config.update({
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
        sessionToken: config.credentials.sessionToken,
        region: this.region
      })

      this.s3Client = new AWS.S3({
        apiVersion: '2006-03-01',
        ...config.options
      }) as any

      this.initialized = true
    } catch (error) {
      throw new StorageError(
        'Failed to initialize S3 client. Make sure aws-sdk is installed.',
        'INITIALIZATION_ERROR',
        this.name,
        error as Error
      )
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      throw new StorageError(
        'S3 client not initialized',
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
      const params: any = {
        Bucket: this.bucketName,
        Key: key,
        Body: data,
        ContentType: options?.mimeType || 'application/octet-stream',
        CacheControl: options?.cacheControl,
        ContentEncoding: options?.contentEncoding
      }

      // Add custom metadata
      if (options?.customMetadata) {
        params.Metadata = options.customMetadata
      }

      // Set ACL for public access
      if (options?.isPublic) {
        params.ACL = 'public-read'
      }

      // Upload progress callback support
      if (options?.progressCallback) {
        params.onUploadProgress = (progress: any) => {
          const percentage = (progress.loaded / progress.total) * 100
          options.progressCallback!(percentage)
        }
      }

      const result = await this.s3Client.putObject(params).promise()

      // Get object metadata for response
      const metadata = await this.getMetadata(key)

      return {
        key,
        size: metadata.size,
        lastModified: metadata.lastModified,
        etag: result.ETag?.replace(/"/g, ''),
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
      const params: any = {
        Bucket: this.bucketName,
        Key: key
      }

      // Add range header if specified
      if (options?.range) {
        params.Range = `bytes=${options.range.start}-${options.range.end || ''}`
      }

      const result = await this.s3Client.getObject(params).promise()

      if (!result.Body) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Handle different response types
      if (options?.responseType === 'stream') {
        // Return the stream directly if available
        return result.Body as NodeJS.ReadableStream
      } else if (options?.responseType === 'text') {
        return result.Body.toString('utf-8')
      } else if (options?.responseType === 'json') {
        return JSON.parse(result.Body.toString('utf-8'))
      } else {
        // Default to buffer
        return result.Body as Buffer
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.s3Client.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise()
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async deleteMany(keys: string[]): Promise<string[]> {
    await this.ensureInitialized()

    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: false
        }
      }

      const result = await this.s3Client.deleteObjects(deleteParams).promise()

      // Return keys that failed to delete
      const errors = result.Errors || []
      return errors.map((error: any) => error.Key)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureInitialized()

    try {
      await this.s3Client.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise()
      return true
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 'NotFound') {
        return false
      }
      throw this.handleError(error, key)
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    await this.ensureInitialized()

    try {
      const result = await this.s3Client.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise()

      return {
        size: result.ContentLength || 0,
        mimeType: result.ContentType || 'application/octet-stream',
        lastModified: result.LastModified || new Date(),
        etag: result.ETag?.replace(/"/g, ''),
        cacheControl: result.CacheControl,
        contentEncoding: result.ContentEncoding,
        customMetadata: result.Metadata || {}
      }
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    await this.ensureInitialized()

    try {
      // S3 requires copying the object to update metadata
      const copyParams: any = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${key}`,
        Key: key,
        MetadataDirective: 'REPLACE'
      }

      if (metadata.mimeType) copyParams.ContentType = metadata.mimeType
      if (metadata.cacheControl) copyParams.CacheControl = metadata.cacheControl
      if (metadata.contentEncoding) copyParams.ContentEncoding = metadata.contentEncoding
      if (metadata.customMetadata) copyParams.Metadata = metadata.customMetadata

      await this.s3Client.copyObject(copyParams).promise()
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    await this.ensureInitialized()

    try {
      const params: any = {
        Bucket: this.bucketName,
        MaxKeys: options?.maxResults || 1000,
        ContinuationToken: options?.pageToken,
        Prefix: options?.prefix,
        Delimiter: options?.delimiter
      }

      const result = await this.s3Client.listObjectsV2(params).promise()

      const objects: StorageObject[] = (result.Contents || []).map((item: any) => ({
        key: item.Key,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag?.replace(/"/g, ''),
        metadata: options?.includeMetadata ? undefined : undefined // Would need separate headObject calls
      }))

      return {
        objects,
        prefixes: result.CommonPrefixes?.map((prefix: any) => prefix.Prefix) || [],
        nextPageToken: result.NextContinuationToken,
        isTruncated: result.IsTruncated || false
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
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodeURIComponent(key)}`
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    await this.ensureInitialized()

    try {
      const operation = options.method === 'PUT' ? 'putObject' : 'getObject'
      const params: any = {
        Bucket: this.bucketName,
        Key: key,
        Expires: options.expiresIn
      }

      if (options.contentType) {
        params.ContentType = options.contentType
      }

      if (options.customMetadata) {
        params.Metadata = options.customMetadata
      }

      return await this.s3Client.getSignedUrl(operation, params)
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      const copyParams = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey
      }

      const result = await this.s3Client.copyObject(copyParams).promise()

      return {
        key: destinationKey,
        size: 0, // Would need headObject to get actual size
        lastModified: new Date(),
        etag: result.CopyObjectResult?.ETag?.replace(/"/g, '')
      }
    } catch (error) {
      throw this.handleError(error, sourceKey)
    }
  }

  async move(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      // Copy then delete
      const copyResult = await this.copy(sourceKey, destinationKey)
      await this.delete(sourceKey)
      return copyResult
    } catch (error) {
      throw this.handleError(error, sourceKey)
    }
  }

  // Multipart upload support
  async createMultipartUpload(key: string, options?: StorageUploadOptions): Promise<string> {
    await this.ensureInitialized()

    try {
      const params: any = {
        Bucket: this.bucketName,
        Key: key,
        ContentType: options?.mimeType || 'application/octet-stream'
      }

      if (options?.customMetadata) {
        params.Metadata = options.customMetadata
      }

      if (options?.isPublic) {
        params.ACL = 'public-read'
      }

      const result = await this.s3Client.createMultipartUpload(params).promise()
      return result.UploadId
    } catch (error) {
      throw this.handleError(error, key)
    }
  }

  async uploadPart(uploadId: string, partNumber: number, data: Buffer): Promise<string> {
    await this.ensureInitialized()

    try {
      const result = await this.s3Client.uploadPart({
        Bucket: this.bucketName,
        Key: '', // Key is associated with uploadId
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: data
      }).promise()

      return result.ETag?.replace(/"/g, '') || ''
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async completeMultipartUpload(
    uploadId: string, 
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<StorageObject> {
    await this.ensureInitialized()

    try {
      const result = await this.s3Client.completeMultipartUpload({
        Bucket: this.bucketName,
        Key: '', // Key is associated with uploadId
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(part => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
        }
      }).promise()

      return {
        key: result.Key || '',
        size: 0, // Would need headObject to get actual size
        lastModified: new Date(),
        etag: result.ETag?.replace(/"/g, '')
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async abortMultipartUpload(uploadId: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.s3Client.abortMultipartUpload({
        Bucket: this.bucketName,
        Key: '', // Key is associated with uploadId
        UploadId: uploadId
      }).promise()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async healthCheck(): Promise<boolean> {
    await this.ensureInitialized()

    try {
      // Try to list bucket contents as health check
      await this.s3Client.listObjectsV2({
        Bucket: this.bucketName,
        MaxKeys: 1
      }).promise()
      return true
    } catch (error) {
      console.error('S3 storage health check failed:', error)
      return false
    }
  }

  private handleError(error: any, key?: string): StorageError {
    console.error('S3 storage error:', error)

    const message = error?.message || 'Unknown S3 storage error'
    const code = error?.code || error?.statusCode || 'UNKNOWN_ERROR'

    // Map common S3 errors to our error types
    if (code === 'NoSuchKey' || code === 'NotFound' || error?.statusCode === 404) {
      return new StorageNotFoundError(key || 'unknown', this.name)
    }

    if (code === 'AccessDenied' || code === 'Forbidden' || error?.statusCode === 403) {
      return new StorageAccessDeniedError(key || 'unknown', this.name)
    }

    if (code === 'QuotaExceeded' || code === 'ServiceUnavailable') {
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
