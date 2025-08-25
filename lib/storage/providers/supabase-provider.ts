import { createClient, SupabaseClient } from '@supabase/supabase-js'
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

export class SupabaseStorageProvider implements StorageProvider {
  readonly name: string = 'supabase'
  readonly type = 'supabase' as const
  readonly region?: string
  readonly bucketName: string

  private supabase: SupabaseClient
  private bucket: any

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName
    this.region = config.region

    // Initialize Supabase client
    this.supabase = createClient(
      config.credentials.url,
      config.credentials.serviceKey || config.credentials.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    this.bucket = this.supabase.storage.from(this.bucketName)
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: StorageUploadOptions
  ): Promise<StorageObject> {
    try {
      const uploadOptions: any = {
        contentType: options?.mimeType,
        cacheControl: options?.cacheControl,
        upsert: true
      }

      if (options?.customMetadata) {
        uploadOptions.metadata = options.customMetadata
      }

      const { data: uploadResult, error } = await this.bucket.upload(
        key,
        data,
        uploadOptions
      )

      if (error) {
        throw this.handleError(error, key)
      }

      // Get metadata for the uploaded file
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
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, key)
    }
  }

  async download(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer | string | any> {
    try {
      const downloadOptions: any = {}

      if (options?.range) {
        downloadOptions.headers = {
          Range: `bytes=${options.range.start}-${options.range.end || ''}`
        }
      }

      const { data, error } = await this.bucket.download(key, downloadOptions)

      if (error) {
        throw this.handleError(error, key)
      }

      if (!data) {
        throw new StorageNotFoundError(key, this.name)
      }

      // Convert blob to buffer or string based on response type
      if (options?.responseType === 'text') {
        return await data.text()
      } else if (options?.responseType === 'json') {
        return await data.json()
      } else if (options?.responseType === 'stream') {
        return data.stream()
      } else {
        // Default to buffer
        return Buffer.from(await data.arrayBuffer())
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, key)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.bucket.remove([key])

      if (error) {
        throw this.handleError(error, key)
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, key)
    }
  }

  async deleteMany(keys: string[]): Promise<string[]> {
    try {
      const { data, error } = await this.bucket.remove(keys)

      if (error) {
        // If batch delete fails, try individual deletes
        const failed: string[] = []
        for (const key of keys) {
          try {
            await this.delete(key)
          } catch {
            failed.push(key)
          }
        }
        return failed
      }

      // Return any keys that failed to delete
      const successful = data?.map((item: any) => item.name) || []
      return keys.filter(key => !successful.includes(key))
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.bucket.list(undefined, {
        search: key,
        limit: 1
      })

      if (error) {
        throw this.handleError(error, key)
      }

      return data?.some((item: any) => item.name === key) || false
    } catch (error) {
      if (error instanceof StorageNotFoundError) {
        return false
      }
      throw error
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    try {
      // Supabase doesn't have a direct metadata API, so we list with the specific file
      const { data, error } = await this.bucket.list(undefined, {
        search: key,
        limit: 1
      })

      if (error) {
        throw this.handleError(error, key)
      }

      const file = data?.find((item: any) => item.name === key)
      if (!file) {
        throw new StorageNotFoundError(key, this.name)
      }

      return {
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: new Date(file.updated_at || file.created_at),
        etag: file.metadata?.eTag,
        cacheControl: file.metadata?.cacheControl,
        customMetadata: file.metadata?.metadata || {}
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, key)
    }
  }

  async updateMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    // Supabase doesn't support direct metadata updates
    // This would require re-uploading the file with new metadata
    throw new StorageError(
      'Metadata updates not supported by Supabase storage',
      'OPERATION_NOT_SUPPORTED',
      this.name
    )
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    try {
      const listOptions: any = {
        limit: options?.maxResults || 1000,
        offset: 0
      }

      if (options?.prefix) {
        listOptions.prefix = options.prefix
      }

      const { data, error } = await this.bucket.list(
        options?.prefix ? undefined : '',
        listOptions
      )

      if (error) {
        throw this.handleError(error)
      }

      const objects: StorageObject[] = (data || []).map((item: any) => ({
        key: item.name,
        size: item.metadata?.size || 0,
        lastModified: new Date(item.updated_at || item.created_at),
        etag: item.metadata?.eTag,
        metadata: options?.includeMetadata ? {
          size: item.metadata?.size || 0,
          mimeType: item.metadata?.mimetype || 'application/octet-stream',
          lastModified: new Date(item.updated_at || item.created_at),
          etag: item.metadata?.eTag,
          customMetadata: item.metadata?.metadata || {}
        } : undefined
      }))

      return {
        objects,
        isTruncated: objects.length === (options?.maxResults || 1000),
        nextPageToken: objects.length === (options?.maxResults || 1000) 
          ? (listOptions.offset + objects.length).toString() 
          : undefined
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
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
    const { data } = this.bucket.getPublicUrl(key)
    return data.publicUrl
  }

  async getSignedUrl(key: string, options: StorageSignedUrlOptions): Promise<string> {
    try {
      const { data, error } = await this.bucket.createSignedUrl(
        key,
        options.expiresIn,
        {
          download: options.method === 'GET'
        }
      )

      if (error) {
        throw this.handleError(error, key)
      }

      return data.signedUrl
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, key)
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    try {
      const { data, error } = await this.bucket.copy(sourceKey, destinationKey)

      if (error) {
        throw this.handleError(error, sourceKey)
      }

      return {
        key: destinationKey,
        size: 0, // Supabase copy doesn't return size
        lastModified: new Date(),
        etag: data?.Key || undefined
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, sourceKey)
    }
  }

  async move(sourceKey: string, destinationKey: string): Promise<StorageObject> {
    try {
      const { data, error } = await this.bucket.move(sourceKey, destinationKey)

      if (error) {
        throw this.handleError(error, sourceKey)
      }

      return {
        key: destinationKey,
        size: 0, // Supabase move doesn't return size
        lastModified: new Date(),
        etag: data?.Key || undefined
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw this.handleError(error, sourceKey)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to list files as a health check
      const { error } = await this.bucket.list('', { limit: 1 })
      return !error
    } catch (error) {
      console.error('Supabase storage health check failed:', error)
      return false
    }
  }

  private handleError(error: any, key?: string): StorageError {
    console.error('Supabase storage error:', error)

    const message = error?.message || 'Unknown storage error'
    const code = error?.statusCode || error?.status || 'UNKNOWN_ERROR'

    // Map common Supabase errors to our error types
    if (message.includes('not found') || code === 404) {
      return new StorageNotFoundError(key || 'unknown', this.name)
    }

    if (message.includes('access denied') || message.includes('unauthorized') || code === 403) {
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
