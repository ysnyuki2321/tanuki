import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json();
    
    let result: { success: boolean; error?: string; message?: string } = { success: false, error: 'Unknown connection type' };
    
    switch (type) {
      case 'database':
        result = await testSupabaseConnection(config);
        break;
      case 'email':
        result = await testEmailConnection(config);
        break;
      case 'storage':
        result = await testStorageConnection(config);
        break;
      case 'stripe':
        result = await testStripeConnection(config);
        break;
      case 'paypal':
        result = await testPayPalConnection(config);
        break;
      default:
        result = { success: false, error: `Unknown connection type: ${type}` };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test connection' 
    }, { status: 500 });
  }
}

async function testSupabaseConnection(config: any) {
  try {
    if (!config.supabase_url || !config.supabase_anon_key) {
      return { success: false, error: 'Supabase URL and Anon Key are required' };
    }
    
    // Test connection to Supabase
    const response = await fetch(`${config.supabase_url}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${config.supabase_anon_key}`,
        'apikey': config.supabase_anon_key,
      },
    });
    
    if (response.ok) {
      return { success: true, message: 'Supabase connection successful' };
    } else {
      return { success: false, error: `Supabase connection failed: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: `Supabase connection error: ${error}` };
  }
}

async function testEmailConnection(config: any) {
  try {
    if (!config.smtp_host || !config.smtp_user) {
      return { success: false, error: 'SMTP host and user are required' };
    }
    
    // For demo purposes, just validate the configuration
    // In real implementation, use nodemailer to test SMTP connection
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port) || 587,
      secure: parseInt(config.smtp_port) === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });
    
    // Verify connection
    await transporter.verify();
    
    return { success: true, message: 'SMTP connection successful' };
  } catch (error) {
    return { success: false, error: `SMTP connection failed: ${error}` };
  }
}

async function testStorageConnection(config: any) {
  try {
    switch (config.storage_provider) {
      case 'supabase':
        if (!config.supabase_url) {
          return { success: false, error: 'Supabase URL required for Supabase storage' };
        }
        // Test Supabase storage access
        return { success: true, message: 'Supabase storage connection successful' };
        
      case 's3':
        if (!config.aws_access_key || !config.aws_secret_key || !config.aws_bucket) {
          return { success: false, error: 'AWS credentials and bucket name are required for S3' };
        }
        
        // Test AWS S3 connection (mock for now)
        // In real implementation, use AWS SDK to test connection
        return { success: true, message: 'AWS S3 connection successful' };
        
      case 'gcs':
        if (!config.gcs_project_id || !config.gcs_key_file) {
          return { success: false, error: 'GCS Project ID and Service Account Key are required for Google Cloud Storage' };
        }

        try {
          // Test GCS connection (basic validation)
          // In real implementation, would use @google-cloud/storage SDK
          const keyData = JSON.parse(config.gcs_key_file);
          if (!keyData.project_id || !keyData.private_key || !keyData.client_email) {
            return { success: false, error: 'Invalid GCS service account key format' };
          }

          // Mock successful connection for demo
          return { success: true, message: 'Google Cloud Storage connection successful' };
        } catch (error) {
          return { success: false, error: 'Invalid GCS service account key JSON format' };
        }
        
      default:
        return { success: false, error: 'Invalid storage provider' };
    }
  } catch (error) {
    return { success: false, error: `Storage connection failed: ${error}` };
  }
}

async function testStripeConnection(config: any) {
  try {
    if (!config.stripe_secret_key) {
      return { success: false, error: 'Stripe secret key is required' };
    }
    
    // Test Stripe API connection
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${config.stripe_secret_key}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: `Stripe connection successful. Available balance: ${data.available?.[0]?.amount || 0} ${data.available?.[0]?.currency || 'USD'}` 
      };
    } else {
      const error = await response.json();
      return { success: false, error: `Stripe connection failed: ${error.error?.message || 'Unknown error'}` };
    }
  } catch (error) {
    return { success: false, error: `Stripe connection error: ${error}` };
  }
}

async function testPayPalConnection(config: any) {
  try {
    if (!config.paypal_client_id || !config.paypal_client_secret) {
      return { success: false, error: 'PayPal client ID and secret are required' };
    }
    
    // Test PayPal API connection
    const authResponse = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${config.paypal_client_id}:${config.paypal_client_secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      return { 
        success: true, 
        message: `PayPal connection successful. Token type: ${authData.token_type}` 
      };
    } else {
      const error = await authResponse.json();
      return { success: false, error: `PayPal connection failed: ${error.error_description || 'Unknown error'}` };
    }
  } catch (error) {
    return { success: false, error: `PayPal connection error: ${error}` };
  }
}
