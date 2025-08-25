// Storage abstraction layer for multiple cloud providers
// Provides unified interface for file operations across different storage backends

export interface StorageMetadata {
  size: number
  mimeType: string
  lastModified: Date
  etag?: string
  cacheControl?: string
  contentEncoding?: string
  customMetadata?: Record<string, string>
}

export interface StorageObject {
  key: string
  size: number
  lastModified: Date
  etag?: string
  metadata?: StorageMetadata
  url?: string
  publicUrl?: string
}

export interface StorageUploadOptions {
  mimeType?: string
  cacheControl?: string
  contentEncoding?: string
  customMetadata?: Record<string, string>
  isPublic?: boolean
  progressCallback?: (progress: number) => void
}

export interface StorageDownloadOptions {
  range?: {
    start: number
    end?: number
  }
  responseType?: 'buffer' | 'stream' | 'text' | 'json'
}

export interface StorageListOptions {
  prefix?: string
  maxResults?: number
  pageToken?: string
  delimiter?: string
  includeMetadata?: boolean
}

export interface StorageListResult {
  objects: StorageObject[]
  prefixes?: string[]
  nextPageToken?: string
  isTruncated: boolean
}

export interface StorageSignedUrlOptions {
  expiresIn: number // seconds
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE'
  contentType?: string
  customMetadata?: Record<string, string>
}

export interface StorageProvider {
  readonly name: string
  readonly type: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
  readonly region?: string
  readonly bucketName: string

  // Basic operations
  upload(
    key: string, 
    data: Buffer | Uint8Array | string, 
    options?: StorageUploadOptions
  ): Promise<StorageObject>

  download(
    key: string, 
    options?: StorageDownloadOptions
  ): Promise<Buffer | NodeJS.ReadableStream | string | any>

  delete(key: string): Promise<void>
  deleteMany(keys: string[]): Promise<string[]> // Returns failed deletions

  // Metadata operations
  exists(key: string): Promise<boolean>
  getMetadata(key: string): Promise<StorageMetadata>
  updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void>

  // Listing operations
  list(options?: StorageListOptions): Promise<StorageListResult>
  listByPrefix(prefix: string, options?: Omit<StorageListOptions, 'prefix'>): Promise<StorageListResult>

  // URL operations
  getPublicUrl(key: string): string
  getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string>

  // Batch operations
  copy(sourceKey: string, destinationKey: string): Promise<StorageObject>
  move(sourceKey: string, destinationKey: string): Promise<StorageObject>
  
  // Advanced operations
  createMultipartUpload?(key: string, options?: StorageUploadOptions): Promise<string> // Returns upload ID
  uploadPart?(uploadId: string, partNumber: number, data: Buffer): Promise<string> // Returns ETag
  completeMultipartUpload?(uploadId: string, parts: Array<{ partNumber: number; etag: string }>): Promise<StorageObject>
  abortMultipartUpload?(uploadId: string): Promise<void>

  // Health check
  healthCheck(): Promise<boolean>
}

export interface StorageConfig {
  provider: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
  bucketName: string
  region?: string
  credentials: Record<string, any>
  options?: Record<string, any>
}

export interface StorageManagerOptions {
  defaultProvider: string
  providers: Record<string, StorageConfig>
  enableCaching?: boolean
  cacheConfig?: {
    ttl: number // seconds
    maxSize: number // bytes
  }
  enableMetrics?: boolean
  retryConfig?: {
    maxRetries: number
    retryDelay: number // milliseconds
    exponentialBackoff: boolean
  }
}

// Error types
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(key: string, provider: string) {
    super(`Object not found: ${key}`, 'NOT_FOUND', provider)
    this.name = 'StorageNotFoundError'
  }
}

export class StorageAccessDeniedError extends StorageError {
  constructor(key: string, provider: string) {
    super(`Access denied: ${key}`, 'ACCESS_DENIED', provider)
    this.name = 'StorageAccessDeniedError'
  }
}

export class StorageQuotaExceededError extends StorageError {
  constructor(provider: string) {
    super('Storage quota exceeded', 'QUOTA_EXCEEDED', provider)
    this.name = 'StorageQuotaExceededError'
  }
}

// Utility types
export type StorageProviderType = StorageProvider['type']
export type StorageOperationType = 'upload' | 'download' | 'delete' | 'list' | 'metadata' | 'url'

// Metrics interface
export interface StorageMetrics {
  provider: string
  operation: StorageOperationType
  duration: number
  size?: number
  success: boolean
  error?: string
  timestamp: Date
}

// Event types for storage operations
export interface StorageEvent {
  type: 'upload' | 'download' | 'delete' | 'copy' | 'move'
  provider: string
  key: string
  size?: number
  metadata?: StorageMetadata
  timestamp: Date
  userId?: string
  tenantId?: string
}

// Storage manager interface
export interface StorageManager {
  // Provider management
  getProvider(name?: string): StorageProvider
  addProvider(name: string, config: StorageConfig): Promise<void>
  removeProvider(name: string): Promise<void>
  listProviders(): string[]

  // Unified operations (uses default provider)
  upload(key: string, data: Buffer | Uint8Array | string, options?: StorageUploadOptions): Promise<StorageObject>
  download(key: string, options?: StorageDownloadOptions): Promise<Buffer | NodeJS.ReadableStream | string | any>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  getMetadata(key: string): Promise<StorageMetadata>
  list(options?: StorageListOptions): Promise<StorageListResult>
  getPublicUrl(key: string): string
  getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string>

  // Cross-provider operations
  copyBetweenProviders(
    sourceProvider: string,
    sourceKey: string,
    destinationProvider: string,
    destinationKey: string
  ): Promise<StorageObject>

  // Bulk operations
  syncProviders(sourceProvider: string, destinationProvider: string, prefix?: string): Promise<{
    copied: string[]
    failed: string[]
  }>

  // Metrics and monitoring
  getMetrics(provider?: string, timeRange?: { start: Date; end: Date }): Promise<StorageMetrics[]>
  
  // Health checks
  healthCheck(provider?: string): Promise<Record<string, boolean>>
}

// Configuration validation
export interface StorageConfigValidator {
  validate(config: StorageConfig): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>
  
  testConnection(config: StorageConfig): Promise<boolean>
}

// Storage adapter factory
export interface StorageAdapterFactory {
  create(config: StorageConfig): Promise<StorageProvider>
  getSupportedProviders(): StorageProviderType[]
}
