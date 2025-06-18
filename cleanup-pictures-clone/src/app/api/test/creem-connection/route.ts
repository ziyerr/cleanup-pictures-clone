import { NextRequest, NextResponse } from 'next/server';
import { CREEM_CONFIG } from '@/lib/creem-config';

interface TestResult {
  endpoint?: string;
  product?: string;
  productId?: string;
  status?: number;
  success: boolean;
  statusText?: string;
  data?: any;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Creem API connection...');
    console.log('API Key:', CREEM_CONFIG.API_KEY ? `${CREEM_CONFIG.API_KEY.substring(0, 10)}...` : 'Not set');
    console.log('Base URL:', CREEM_CONFIG.BASE_URL);

    // Test basic API connectivity (based on official docs)
    const testEndpoints = [
      '/v1/products',        // Product management
      '/v1/customers',       // Customer management  
      '/v1/subscriptions',   // Subscription management
      '/v1/checkout',        // Checkout endpoints
      '/health',             // Health check
      '/ping',               // Basic connectivity
      '/api/v1/products',    // Alternative API path
      '/products',           // Simplified path
      '/'                    // Root endpoint
    ];

    const results: TestResult[] = [];

    for (const endpoint of testEndpoints) {
      try {
        const url = `${CREEM_CONFIG.BASE_URL}${endpoint}`;
        console.log(`Testing: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': CREEM_CONFIG.API_KEY,
            'Content-Type': 'application/json',
          },
        });

        const result: TestResult = {
          endpoint,
          status: response.status,
          success: response.ok,
          statusText: response.statusText,
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.data = data;
          } catch (jsonError) {
            result.data = 'Response not JSON';
          }
        } else {
          try {
            result.error = await response.text();
          } catch (textError) {
            result.error = 'Could not read error response';
          }
        }

        results.push(result);
        
        // If we get a successful response, log it
        if (response.ok) {
          console.log(`✅ ${endpoint} works!`, result);
        } else {
          console.log(`❌ ${endpoint} failed:`, result.status, result.error);
        }

      } catch (error) {
        const result: TestResult = {
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        };
        results.push(result);
        console.log(`💥 ${endpoint} network error:`, error);
      }
    }

    // Test with product IDs
    console.log('Testing with product IDs...');
    for (const [planName, planConfig] of Object.entries(CREEM_CONFIG.PLANS)) {
      try {
        const url = `${CREEM_CONFIG.BASE_URL}/v1/products/${planConfig.id}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': CREEM_CONFIG.API_KEY,
            'Content-Type': 'application/json',
          },
        });

        const result: TestResult = {
          product: planName,
          productId: planConfig.id,
          status: response.status,
          success: response.ok,
        };

        if (response.ok) {
          result.data = await response.json();
          console.log(`✅ Product ${planName} exists:`, result);
        } else {
          result.error = await response.text();
          console.log(`❌ Product ${planName} not found:`, result);
        }

        results.push(result);
      } catch (error) {
        console.log(`💥 Product ${planName} test failed:`, error);
        results.push({
          product: planName,
          productId: planConfig.id,
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Creem API connection test completed',
      config: {
        baseUrl: CREEM_CONFIG.BASE_URL,
        hasApiKey: !!CREEM_CONFIG.API_KEY,
        products: Object.keys(CREEM_CONFIG.PLANS),
      },
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    });

  } catch (error) {
    console.error('Creem API test failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Creem API test failed',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}