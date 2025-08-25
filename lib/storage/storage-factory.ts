import {
  StorageProvider,
  StorageConfig,
  StorageAdapterFactory,
  StorageConfigValidator,
  StorageError,
  StorageProviderType
} from './storage-interface'

export class StorageFactory implements StorageAdapterFactory {
  private static instance: StorageFactory | null = null

  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory()
    }
    return StorageFactory.instance
  }

  async create(config: StorageConfig): Promise<StorageProvider> {
    // Validate configuration
    const validator = new StorageConfigValidatorImpl()
    const validation = await validator.validate(config)
    
    if (!validation.valid) {
      throw new StorageError(
        `Invalid storage configuration: ${validation.errors.join(', ')}`,
        'INVALID_CONFIG',
        config.provider
      )
    }

    // Create provider based on type
    switch (config.provider) {
      case 'supabase':
        const { SupabaseStorageProvider } = await import('./providers/supabase-provider')
        return new SupabaseStorageProvider(config)

      case 's3':
        const { S3StorageProvider } = await import('./providers/s3-provider')
        return new S3StorageProvider(config)

      case 'gcs':
        const { GCSStorageProvider } = await import('./providers/gcs-provider')
        return new GCSStorageProvider(config)

      case 'azure':
        const { AzureStorageProvider } = await import('./providers/azure-provider')
        return new AzureStorageProvider(config)

      case 'local':
        const { LocalStorageProvider } = await import('./providers/local-provider')
        return new LocalStorageProvider(config)

      default:
        throw new StorageError(
          `Unsupported storage provider: ${config.provider}`,
          'UNSUPPORTED_PROVIDER',
          config.provider
        )
    }
  }

  getSupportedProviders(): StorageProviderType[] {
    return ['supabase', 's3', 'gcs', 'azure', 'local']
  }
}

export class StorageConfigValidatorImpl implements StorageConfigValidator {
  async validate(config: StorageConfig): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!config.provider) {
      errors.push('Provider is required')
    }

    if (!config.bucketName) {
      errors.push('Bucket name is required')
    }

    if (!config.credentials || typeof config.credentials !== 'object') {
      errors.push('Credentials object is required')
    }

    // Provider-specific validation
    switch (config.provider) {
      case 'supabase':
        await this.validateSupabaseConfig(config, errors, warnings)
        break
      case 's3':
        await this.validateS3Config(config, errors, warnings)
        break
      case 'gcs':
        await this.validateGCSConfig(config, errors, warnings)
        break
      case 'azure':
        await this.validateAzureConfig(config, errors, warnings)
        break
      case 'local':
        await this.validateLocalConfig(config, errors, warnings)
        break
      default:
        errors.push(`Unsupported provider: ${config.provider}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  async testConnection(config: StorageConfig): Promise<boolean> {
    try {
      const factory = StorageFactory.getInstance()
      const provider = await factory.create(config)
      return await provider.healthCheck()
    } catch (error) {
      console.error('Storage connection test failed:', error)
      return false
    }
  }

  private async validateSupabaseConfig(
    config: StorageConfig,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { url, anonKey, serviceKey } = config.credentials

    if (!url) {
      errors.push('Supabase URL is required')
    } else {
      try {
        new URL(url)
      } catch {
        errors.push('Invalid Supabase URL format')
      }
    }

    if (!anonKey && !serviceKey) {
      errors.push('Either anon key or service key is required for Supabase')
    }

    if (anonKey && serviceKey) {
      warnings.push('Both anon key and service key provided. Service key will be used.')
    }

    // Validate bucket name format for Supabase
    if (config.bucketName && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(config.bucketName)) {
      errors.push('Supabase bucket name must contain only lowercase letters, numbers, and hyphens')
    }
  }

  private async validateS3Config(
    config: StorageConfig,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { accessKeyId, secretAccessKey, sessionToken } = config.credentials

    if (!accessKeyId) {
      errors.push('AWS Access Key ID is required')
    }

    if (!secretAccessKey) {
      errors.push('AWS Secret Access Key is required')
    }

    if (!config.region) {
      errors.push('AWS region is required for S3')
    }

    // Validate bucket name format for S3
    if (config.bucketName) {
      if (config.bucketName.length < 3 || config.bucketName.length > 63) {
        errors.push('S3 bucket name must be between 3 and 63 characters')
      }

      if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(config.bucketName)) {
        errors.push('S3 bucket name contains invalid characters')
      }

      if (config.bucketName.includes('..')) {
        errors.push('S3 bucket name cannot contain consecutive periods')
      }
    }

    if (sessionToken) {
      warnings.push('Using temporary credentials with session token')
    }
  }

  private async validateGCSConfig(
    config: StorageConfig,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { projectId, keyFilename, credentials: serviceAccountKey } = config.credentials

    if (!projectId) {
      errors.push('Google Cloud Project ID is required')
    }

    if (!keyFilename && !serviceAccountKey) {
      errors.push('Either key file path or service account credentials are required for GCS')
    }

    if (keyFilename && serviceAccountKey) {
      warnings.push('Both key file and service account credentials provided. Service account credentials will be used.')
    }

    // Validate bucket name format for GCS
    if (config.bucketName) {
      if (config.bucketName.length < 3 || config.bucketName.length > 63) {
        errors.push('GCS bucket name must be between 3 and 63 characters')
      }

      if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(config.bucketName)) {
        errors.push('GCS bucket name contains invalid characters')
      }
    }
  }

  private async validateAzureConfig(
    config: StorageConfig,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { accountName, accountKey, connectionString } = config.credentials

    if (!connectionString && (!accountName || !accountKey)) {
      errors.push('Either connection string or account name + account key are required for Azure')
    }

    if (connectionString && (accountName || accountKey)) {
      warnings.push('Both connection string and credentials provided. Connection string will be used.')
    }

    // Validate container name format for Azure
    if (config.bucketName) {
      if (config.bucketName.length < 3 || config.bucketName.length > 63) {
        errors.push('Azure container name must be between 3 and 63 characters')
      }

      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(config.bucketName)) {
        errors.push('Azure container name must contain only lowercase letters, numbers, and hyphens')
      }
    }
  }

  private async validateLocalConfig(
    config: StorageConfig,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { basePath } = config.credentials

    if (!basePath) {
      errors.push('Base path is required for local storage')
    }

    // Check if path exists and is writable (in a real implementation)
    warnings.push('Local storage should only be used for development or testing')
  }
}

// Convenience function for creating storage providers
export async function createStorageProvider(config: StorageConfig): Promise<StorageProvider> {
  const factory = StorageFactory.getInstance()
  return factory.create(config)
}

// Configuration helpers
export function createSupabaseConfig(
  url: string,
  anonKey: string,
  bucketName: string,
  serviceKey?: string
): StorageConfig {
  return {
    provider: 'supabase',
    bucketName,
    credentials: {
      url,
      anonKey,
      serviceKey
    }
  }
}

export function createS3Config(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  bucketName: string,
  sessionToken?: string
): StorageConfig {
  return {
    provider: 's3',
    bucketName,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken
    }
  }
}

export function createGCSConfig(
  projectId: string,
  bucketName: string,
  keyFilename?: string,
  serviceAccountKey?: object
): StorageConfig {
  return {
    provider: 'gcs',
    bucketName,
    credentials: {
      projectId,
      keyFilename,
      credentials: serviceAccountKey
    }
  }
}

export function createAzureConfig(
  bucketName: string,
  connectionString?: string,
  accountName?: string,
  accountKey?: string
): StorageConfig {
  return {
    provider: 'azure',
    bucketName,
    credentials: {
      connectionString,
      accountName,
      accountKey
    }
  }
}

export function createLocalConfig(
  basePath: string,
  bucketName: string = 'default'
): StorageConfig {
  return {
    provider: 'local',
    bucketName,
    credentials: {
      basePath
    }
  }
}

// Export singleton factory instance
export const storageFactory = StorageFactory.getInstance()
