import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

// GET - Load current configuration
export async function GET() {
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

// Helper function to save config (implement based on your needs)
async function saveConfigToDatabase(config: any) {
  // In a real implementation, save to Supabase or database
  // For demo, we'll just validate the structure
  
  const configItems = [
    // Database
    { key: 'SUPABASE_URL', value: config.supabase_url || null },
    { key: 'SUPABASE_ANON_KEY', value: config.supabase_anon_key || null },
    { key: 'SUPABASE_SERVICE_KEY', value: config.supabase_service_key || null },
    
    // Email
    { key: 'SMTP_HOST', value: config.smtp_host || null },
    { key: 'SMTP_PORT', value: config.smtp_port || null },
    { key: 'SMTP_USER', value: config.smtp_user || null },
    { key: 'SMTP_PASS', value: config.smtp_pass || null },
    { key: 'FROM_EMAIL', value: config.from_email || null },
    { key: 'FROM_NAME', value: config.from_name || null },
    
    // Storage
    { key: 'STORAGE_PROVIDER', value: config.storage_provider || null },
    { key: 'AWS_ACCESS_KEY_ID', value: config.aws_access_key || null },
    { key: 'AWS_SECRET_ACCESS_KEY', value: config.aws_secret_key || null },
    { key: 'AWS_BUCKET', value: config.aws_bucket || null },
    { key: 'AWS_REGION', value: config.aws_region || null },
    
    // Payment
    { key: 'STRIPE_PUBLIC_KEY', value: config.stripe_public_key || null },
    { key: 'STRIPE_SECRET_KEY', value: config.stripe_secret_key || null },
    { key: 'PAYPAL_CLIENT_ID', value: config.paypal_client_id || null },
    { key: 'PAYPAL_CLIENT_SECRET', value: config.paypal_client_secret || null },
    
    // Security
    { key: 'JWT_SECRET', value: config.jwt_secret || generateSecureKey(64) },
    { key: 'ENCRYPTION_KEY', value: config.encryption_key || generateSecureKey(32) },
    
    // Features
    { key: 'ENABLE_REGISTRATION', value: config.enable_registration?.toString() || 'true' },
    { key: 'ENABLE_EMAIL_VERIFICATION', value: config.enable_email_verification?.toString() || 'true' },
    { key: 'ENABLE_FILE_SHARING', value: config.enable_file_sharing?.toString() || 'true' },
    { key: 'ENABLE_COLLABORATION', value: config.enable_collaboration?.toString() || 'true' },
    { key: 'ENABLE_VIRUS_SCAN', value: config.enable_virus_scan?.toString() || 'false' },
    { key: 'ENABLE_COMPRESSION', value: config.enable_compression?.toString() || 'true' },
    
    // Limits
    { key: 'DEFAULT_STORAGE_QUOTA', value: config.default_storage_quota || '1073741824' },
    { key: 'DEFAULT_FILE_LIMIT', value: config.default_file_limit || '1000' },
    { key: 'MAX_FILE_SIZE', value: config.max_file_size || '104857600' },
  ];
  
  // TODO: Implement actual database save
  // For now, just log what would be saved
  console.log('Would save config items:', configItems);
  
  // In real implementation:
  // await supabase.from('admin_config').upsert(configItems);
}

function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
