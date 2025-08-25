import {
  StorageManager,
  StorageProvider,
  StorageConfig,
  StorageManagerOptions,
  StorageObject,
  StorageUploadOptions,
  StorageDownloadOptions,
  StorageListOptions,
  StorageListResult,
  StorageMetadata,
  StorageSignedUrlOptions,
  StorageMetrics,
  StorageEvent,
  StorageError,
  StorageNotFoundError,
  StorageOperationType
} from './storage-interface'
import { EventEmitter } from 'events'

export class StorageManagerImpl extends EventEmitter implements StorageManager {
  private providers: Map<string, StorageProvider> = new Map()
  private defaultProviderName: string
  private options: StorageManagerOptions
  private metrics: StorageMetrics[] = []
  private cache: Map<string, { data: any; expires: number }> = new Map()

  constructor(options: StorageManagerOptions) {
    super()
    this.options = options
    this.defaultProviderName = options.defaultProvider
    
    // Setup metrics cleanup interval
    if (options.enableMetrics) {
      setInterval(() => this.cleanupMetrics(), 60000) // Clean every minute
    }

    // Setup cache cleanup interval  
    if (options.enableCaching) {
      setInterval(() => this.cleanupCache(), 30000) // Clean every 30 seconds
    }
  }

  async initialize(): Promise<void> {
    // Initialize all configured providers
    const { createStorageProvider } = await import('./storage-factory')
    
    for (const [name, config] of Object.entries(this.options.providers)) {
      try {
        const provider = await createStorageProvider(config)
        this.providers.set(name, provider)
        console.log(`Storage provider '${name}' initialized successfully`)
      } catch (error) {
        console.error(`Failed to initialize storage provider '${name}':`, error)
        throw new StorageError(
          `Failed to initialize provider ${name}`,
          'INITIALIZATION_ERROR',
          name,
          error as Error
        )
      }
    }

    // Verify default provider exists
    if (!this.providers.has(this.defaultProviderName)) {
      throw new StorageError(
        `Default provider '${this.defaultProviderName}' not found`,
        'PROVIDER_NOT_FOUND',
        this.defaultProviderName
      )
    }
  }

  // Provider management
  getProvider(name?: string): StorageProvider {
    const providerName = name || this.defaultProviderName
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new StorageError(
        `Provider '${providerName}' not found`,
        'PROVIDER_NOT_FOUND',
        providerName
      )
    }
    
    return provider
  }

  async addProvider(name: string, config: StorageConfig): Promise<void> {
    const { createStorageProvider } = await import('./storage-factory')
    
    try {
      const provider = await createStorageProvider(config)
      this.providers.set(name, provider)
      this.emit('providerAdded', { name, config })
    } catch (error) {
      throw new StorageError(
        `Failed to add provider ${name}`,
        'PROVIDER_ADD_ERROR',
        name,
        error as Error
      )
    }
  }

  async removeProvider(name: string): Promise<void> {
    if (name === this.defaultProviderName) {
      throw new StorageError(
        'Cannot remove default provider',
        'CANNOT_REMOVE_DEFAULT',
        name
      )
    }

    if (this.providers.delete(name)) {
      this.emit('providerRemoved', { name })
    }
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  // Unified operations
  async upload(
    key: string, 
    data: Buffer | Uint8Array | string, 
    options?: StorageUploadOptions
  ): Promise<StorageObject> {
    return this.executeOperation('upload', async (provider) => {
      const result = await provider.upload(key, data, options)
      this.emitEvent('upload', provider.name, key, result.size, result.metadata)
      return result
    }, key, Buffer.byteLength(data as any))
  }

  async download(
    key: string, 
    options?: StorageDownloadOptions
  ): Promise<Buffer | NodeJS.ReadableStream | string | any> {
    return this.executeOperation('download', async (provider) => {
      const result = await provider.download(key, options)
      this.emitEvent('download', provider.name, key)
      return result
    }, key)
  }

  async delete(key: string): Promise<void> {
    return this.executeOperation('delete', async (provider) => {
      await provider.delete(key)
      this.emitEvent('delete', provider.name, key)
    }, key)
  }

  async exists(key: string): Promise<boolean> {
    return this.executeOperation('metadata', async (provider) => {
      return provider.exists(key)
    }, key)
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    const cacheKey = `metadata:${key}`
    
    if (this.options.enableCaching) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }

    const result = await this.executeOperation('metadata', async (provider) => {
      return provider.getMetadata(key)
    }, key)

    if (this.options.enableCaching) {
      this.setCache(cacheKey, result, 300) // Cache for 5 minutes
    }

    return result
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    return this.executeOperation('list', async (provider) => {
      return provider.list(options)
    })
  }

  getPublicUrl(key: string): string {
    const provider = this.getProvider()
    return provider.getPublicUrl(key)
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    return this.executeOperation('url', async (provider) => {
      return provider.getSignedUrl(key, options)
    }, key)
  }

  // Cross-provider operations
  async copyBetweenProviders(
    sourceProvider: string,
    sourceKey: string,
    destinationProvider: string,
    destinationKey: string
  ): Promise<StorageObject> {
    const source = this.getProvider(sourceProvider)
    const destination = this.getProvider(destinationProvider)

    const startTime = Date.now()

    try {
      // Download from source
      const data = await source.download(sourceKey)
      const metadata = await source.getMetadata(sourceKey)

      // Upload to destination
      const result = await destination.upload(destinationKey, data as Buffer, {
        mimeType: metadata.mimeType,
        customMetadata: metadata.customMetadata
      })

      this.recordMetric('copy', destination.name, Date.now() - startTime, result.size, true)
      this.emitEvent('copy', destination.name, destinationKey, result.size, result.metadata)

      return result
    } catch (error) {
      this.recordMetric('copy', destination.name, Date.now() - startTime, 0, false, (error as Error).message)
      throw error
    }
  }

  async syncProviders(
    sourceProvider: string,
    destinationProvider: string,
    prefix?: string
  ): Promise<{ copied: string[]; failed: string[] }> {
    const source = this.getProvider(sourceProvider)
    const destination = this.getProvider(destinationProvider)

    const copied: string[] = []
    const failed: string[] = []

    try {
      const listResult = await source.list({ prefix })
      
      for (const object of listResult.objects) {
        try {
          await this.copyBetweenProviders(
            sourceProvider,
            object.key,
            destinationProvider,
            object.key
          )
          copied.push(object.key)
        } catch (error) {
          console.error(`Failed to sync ${object.key}:`, error)
          failed.push(object.key)
        }
      }
    } catch (error) {
      throw new StorageError(
        `Failed to sync providers`,
        'SYNC_ERROR',
        sourceProvider,
        error as Error
      )
    }

    return { copied, failed }
  }

  // Metrics and monitoring
  async getMetrics(
    provider?: string, 
    timeRange?: { start: Date; end: Date }
  ): Promise<StorageMetrics[]> {
    let metrics = this.metrics

    if (provider) {
      metrics = metrics.filter(m => m.provider === provider)
    }

    if (timeRange) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    return metrics
  }

  async healthCheck(provider?: string): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    if (provider) {
      const p = this.getProvider(provider)
      results[provider] = await p.healthCheck()
    } else {
      for (const [name, p] of this.providers) {
        try {
          results[name] = await p.healthCheck()
        } catch (error) {
          results[name] = false
        }
      }
    }

    return results
  }

  // Private helper methods
  private async executeOperation<T>(
    operation: StorageOperationType,
    fn: (provider: StorageProvider) => Promise<T>,
    key?: string,
    size?: number
  ): Promise<T> {
    const provider = this.getProvider()
    const startTime = Date.now()

    try {
      const result = await this.retryOperation(fn, provider)
      
      if (this.options.enableMetrics) {
        this.recordMetric(operation, provider.name, Date.now() - startTime, size, true)
      }

      return result
    } catch (error) {
      if (this.options.enableMetrics) {
        this.recordMetric(operation, provider.name, Date.now() - startTime, size, false, (error as Error).message)
      }

      // Convert provider-specific errors to our standard errors
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new StorageNotFoundError(key || 'unknown', provider.name)
        }
      }

      throw error
    }
  }

  private async retryOperation<T>(
    fn: (provider: StorageProvider) => Promise<T>,
    provider: StorageProvider
  ): Promise<T> {
    const retryConfig = this.options.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn(provider)
      } catch (error) {
        lastError = error as Error
        
        if (attempt === retryConfig.maxRetries) {
          break
        }

        // Calculate delay
        let delay = retryConfig.retryDelay
        if (retryConfig.exponentialBackoff) {
          delay = delay * Math.pow(2, attempt)
        }

        // Add jitter
        delay = delay + Math.random() * 1000

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  private recordMetric(
    operation: StorageOperationType,
    provider: string,
    duration: number,
    size: number = 0,
    success: boolean,
    error?: string
  ): void {
    const metric: StorageMetrics = {
      provider,
      operation,
      duration,
      size: size > 0 ? size : undefined,
      success,
      error,
      timestamp: new Date()
    }

    this.metrics.push(metric)

    // Emit metric event
    this.emit('metric', metric)
  }

  private emitEvent(
    type: StorageEvent['type'],
    provider: string,
    key: string,
    size?: number,
    metadata?: StorageMetadata
  ): void {
    const event: StorageEvent = {
      type,
      provider,
      key,
      size,
      metadata,
      timestamp: new Date()
    }

    this.emit('storageEvent', event)
  }

  private cleanupMetrics(): void {
    // Keep only last 24 hours of metrics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo)
  }

  private getFromCache(key: string): any {
    const item = this.cache.get(key)
    if (item && Date.now() < item.expires) {
      return item.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expires })
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
let storageManagerInstance: StorageManagerImpl | null = null

export function createStorageManager(options: StorageManagerOptions): StorageManagerImpl {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManagerImpl(options)
  }
  return storageManagerInstance
}

export function getStorageManager(): StorageManagerImpl {
  if (!storageManagerInstance) {
    throw new Error('Storage manager not initialized. Call createStorageManager first.')
  }
  return storageManagerInstance
}
