import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { getSupabaseAdmin, getCurrentUser } from '@/lib/supabase-client';
import type { DbAdminConfig } from '@/lib/database-schema';

// GET - Load current configuration
export async function GET(request: NextRequest) {
  // Require admin authentication
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }
  try {
    const config = getConfig();
    
    // Return safe config (no sensitive data)
    const safeConfig = {
      // Database
      supabase_url: config.supabase_url || '',
      supabase_anon_key: config.supabase_anon_key || '',
      // Don't return service key for security
      
      // App settings
      app_name: config.app_name,
      app_url: config.app_url,
      app_description: config.app_description,
      
      // Email (mask sensitive fields)
      smtp_host: config.smtp_host || '',
      smtp_port: config.smtp_port?.toString() || '587',
      smtp_user: config.smtp_user || '',
      // Don't return password
      from_email: config.from_email || '',
      from_name: config.from_name || '',
      
      // Storage
      storage_provider: config.storage_provider || 'supabase',
      aws_bucket: config.aws_bucket || '',
      aws_region: config.aws_region || 'us-east-1',
      // Don't return AWS keys
      
      // Payment (mask secrets)
      stripe_public_key: config.stripe_public_key || '',
      paypal_client_id: config.paypal_client_id || '',
      // Don't return secret keys
      
      // Features
      enable_registration: config.enable_registration,
      enable_email_verification: config.enable_email_verification,
      enable_file_sharing: config.enable_file_sharing,
      enable_collaboration: config.enable_collaboration,
      enable_virus_scan: config.enable_virus_scan,
      enable_compression: config.enable_compression,
      
      // Limits
      default_storage_quota: config.default_storage_quota.toString(),
      default_file_limit: config.default_file_limit.toString(),
      max_file_size: config.max_file_size.toString(),
      
      // Security (don't return actual keys)
      jwt_secret: config.jwt_secret ? '***configured***' : '',
      encryption_key: config.encryption_key ? '***configured***' : '',
    };
    
    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Error loading config:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

// POST - Save configuration
export async function POST(request: NextRequest) {
  // Require admin authentication
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    
    // Validate required fields (but allow nulls per our design)
    const errors: string[] = [];
    
    // Basic validation - check format, not required
    if (body.supabase_url && !body.supabase_url.startsWith('https://')) {
      errors.push('Supabase URL must start with https://');
    }
    
    if (body.smtp_port && (isNaN(parseInt(body.smtp_port)) || parseInt(body.smtp_port) < 1 || parseInt(body.smtp_port) > 65535)) {
      errors.push('SMTP port must be a valid port number (1-65535)');
    }
    
    if (body.from_email && body.from_email.includes('@') === false) {
      errors.push('From email must be a valid email address');
    }
    
    if (body.default_storage_quota && isNaN(parseInt(body.default_storage_quota))) {
      errors.push('Default storage quota must be a number');
    }
    
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }
    
    // Save to environment variables (in real app, save to database or config file)
    // For now, we'll save to a JSON file or use a database
    await saveConfigToDatabase(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ 
      success: false, 
      errors: ['Failed to save configuration'] 
    }, { status: 500 });
  }
}

// Helper function to save config to database
async function saveConfigToDatabase(config: any) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    throw new Error('Database admin client not available. Please configure Supabase connection first.');
  }

  const configItems: Array<{
    key: string;
    value: any;
    data_type: string;
    category: string;
    is_sensitive: boolean;
    description?: string;
  }> = [
    // Database
    {
      key: 'SUPABASE_URL',
      value: config.supabase_url || null,
      data_type: 'string',
      category: 'database',
      is_sensitive: false,
      description: 'Supabase project URL'
    },
    {
      key: 'SUPABASE_ANON_KEY',
      value: config.supabase_anon_key || null,
      data_type: 'string',
      category: 'database',
      is_sensitive: true,
      description: 'Supabase anonymous key'
    },
    {
      key: 'SUPABASE_SERVICE_KEY',
      value: config.supabase_service_key || null,
      data_type: 'string',
      category: 'database',
      is_sensitive: true,
      description: 'Supabase service role key'
    },

    // Email
    {
      key: 'SMTP_HOST',
      value: config.smtp_host || null,
      data_type: 'string',
      category: 'email',
      is_sensitive: false,
      description: 'SMTP server hostname'
    },
    {
      key: 'SMTP_PORT',
      value: config.smtp_port ? parseInt(config.smtp_port) : null,
      data_type: 'number',
      category: 'email',
      is_sensitive: false,
      description: 'SMTP server port'
    },
    {
      key: 'SMTP_USER',
      value: config.smtp_user || null,
      data_type: 'string',
      category: 'email',
      is_sensitive: false,
      description: 'SMTP username'
    },
    {
      key: 'SMTP_PASS',
      value: config.smtp_pass || null,
      data_type: 'string',
      category: 'email',
      is_sensitive: true,
      description: 'SMTP password'
    },
    {
      key: 'FROM_EMAIL',
      value: config.from_email || null,
      data_type: 'string',
      category: 'email',
      is_sensitive: false,
      description: 'Default from email address'
    },
    {
      key: 'FROM_NAME',
      value: config.from_name || null,
      data_type: 'string',
      category: 'email',
      is_sensitive: false,
      description: 'Default from name'
    },

    // Storage
    {
      key: 'STORAGE_PROVIDER',
      value: config.storage_provider || 'supabase',
      data_type: 'string',
      category: 'storage',
      is_sensitive: false,
      description: 'Primary storage provider'
    },
    {
      key: 'AWS_ACCESS_KEY_ID',
      value: config.aws_access_key || null,
      data_type: 'string',
      category: 'storage',
      is_sensitive: true,
      description: 'AWS access key for S3 storage'
    },
    {
      key: 'AWS_SECRET_ACCESS_KEY',
      value: config.aws_secret_key || null,
      data_type: 'string',
      category: 'storage',
      is_sensitive: true,
      description: 'AWS secret key for S3 storage'
    },
    {
      key: 'AWS_BUCKET',
      value: config.aws_bucket || null,
      data_type: 'string',
      category: 'storage',
      is_sensitive: false,
      description: 'AWS S3 bucket name'
    },
    {
      key: 'AWS_REGION',
      value: config.aws_region || 'us-east-1',
      data_type: 'string',
      category: 'storage',
      is_sensitive: false,
      description: 'AWS region'
    },

    // Payment
    {
      key: 'STRIPE_PUBLIC_KEY',
      value: config.stripe_public_key || null,
      data_type: 'string',
      category: 'payment',
      is_sensitive: false,
      description: 'Stripe publishable key'
    },
    {
      key: 'STRIPE_SECRET_KEY',
      value: config.stripe_secret_key || null,
      data_type: 'string',
      category: 'payment',
      is_sensitive: true,
      description: 'Stripe secret key'
    },
    {
      key: 'PAYPAL_CLIENT_ID',
      value: config.paypal_client_id || null,
      data_type: 'string',
      category: 'payment',
      is_sensitive: false,
      description: 'PayPal client ID'
    },
    {
      key: 'PAYPAL_CLIENT_SECRET',
      value: config.paypal_client_secret || null,
      data_type: 'string',
      category: 'payment',
      is_sensitive: true,
      description: 'PayPal client secret'
    },

    // Security
    {
      key: 'JWT_SECRET',
      value: config.jwt_secret || generateSecureKey(64),
      data_type: 'string',
      category: 'security',
      is_sensitive: true,
      description: 'JWT signing secret'
    },
    {
      key: 'ENCRYPTION_KEY',
      value: config.encryption_key || generateSecureKey(32),
      data_type: 'string',
      category: 'security',
      is_sensitive: true,
      description: 'Data encryption key'
    },

    // Features
    {
      key: 'ENABLE_REGISTRATION',
      value: config.enable_registration !== undefined ? config.enable_registration : true,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Allow new user registration'
    },
    {
      key: 'ENABLE_EMAIL_VERIFICATION',
      value: config.enable_email_verification !== undefined ? config.enable_email_verification : true,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Require email verification'
    },
    {
      key: 'ENABLE_FILE_SHARING',
      value: config.enable_file_sharing !== undefined ? config.enable_file_sharing : true,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Enable file sharing features'
    },
    {
      key: 'ENABLE_COLLABORATION',
      value: config.enable_collaboration !== undefined ? config.enable_collaboration : true,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Enable collaboration features'
    },
    {
      key: 'ENABLE_VIRUS_SCAN',
      value: config.enable_virus_scan !== undefined ? config.enable_virus_scan : false,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Enable virus scanning'
    },
    {
      key: 'ENABLE_COMPRESSION',
      value: config.enable_compression !== undefined ? config.enable_compression : true,
      data_type: 'boolean',
      category: 'features',
      is_sensitive: false,
      description: 'Enable file compression'
    },

    // Limits
    {
      key: 'DEFAULT_STORAGE_QUOTA',
      value: config.default_storage_quota ? parseInt(config.default_storage_quota) : 1073741824,
      data_type: 'number',
      category: 'limits',
      is_sensitive: false,
      description: 'Default storage quota in bytes (1GB)'
    },
    {
      key: 'DEFAULT_FILE_LIMIT',
      value: config.default_file_limit ? parseInt(config.default_file_limit) : 1000,
      data_type: 'number',
      category: 'limits',
      is_sensitive: false,
      description: 'Default file count limit'
    },
    {
      key: 'MAX_FILE_SIZE',
      value: config.max_file_size ? parseInt(config.max_file_size) : 104857600,
      data_type: 'number',
      category: 'limits',
      is_sensitive: false,
      description: 'Maximum file size in bytes (100MB)'
    },
  ];

  // Filter out null values and prepare for upsert
  const configToSave = configItems
    .filter(item => item.value !== null)
    .map(item => ({
      key: item.key,
      value: item.value,
      data_type: item.data_type,
      category: item.category,
      is_sensitive: item.is_sensitive,
      description: item.description,
      editable_by_tenant: true,
      requires_restart: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'].includes(item.key),
      updated_at: new Date().toISOString()
    }));

  try {
    // Use upsert to insert or update existing config items
    const { error } = await supabaseAdmin
      .from('admin_config')
      .upsert(configToSave, {
        onConflict: 'key',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Database error saving config:', error);
      throw new Error(`Failed to save configuration: ${error.message}`);
    }

    console.log(`Successfully saved ${configToSave.length} configuration items`);
  } catch (error) {
    console.error('Error saving config to database:', error);
    throw error;
  }
}

function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
