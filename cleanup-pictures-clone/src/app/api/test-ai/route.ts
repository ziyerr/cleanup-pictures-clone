import { NextRequest, NextResponse } from 'next/server';

// Test AI API endpoint
export async function GET() {
  try {
    // Test basic API connectivity
    const AI_API_CONFIG = {
      apiKey: process.env.AI_API_KEY || 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
      baseUrl: process.env.AI_API_BASE_URL || 'https://ismaque.org/v1',
      model: 'gpt-image-1'
    };

    console.log('Testing AI API with config:', {
      baseUrl: AI_API_CONFIG.baseUrl,
      hasApiKey: !!AI_API_CONFIG.apiKey,
      apiKeyPrefix: AI_API_CONFIG.apiKey.substring(0, 10) + '...'
    });

    // Test simple API call without image
    const testResponse = await fetch(`${AI_API_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseData = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      headers: Object.fromEntries(testResponse.headers.entries()),
      ok: testResponse.ok
    };

    let responseBody = null;
    try {
      responseBody = await testResponse.text();
    } catch (e) {
      responseBody = 'Could not read response body';
    }

    return NextResponse.json({
      success: testResponse.ok,
      config: {
        baseUrl: AI_API_CONFIG.baseUrl,
        hasApiKey: !!AI_API_CONFIG.apiKey,
        model: AI_API_CONFIG.model
      },
      response: responseData,
      body: responseBody,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const AI_API_CONFIG = {
      apiKey: process.env.AI_API_KEY || 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
      baseUrl: process.env.AI_API_BASE_URL || 'https://ismaque.org/v1',
      model: 'gpt-image-1'
    };

    // Test image generation endpoint
    const formData = new FormData();
    formData.append('prompt', '测试生成一个简单的卡通形象');
    formData.append('model', AI_API_CONFIG.model);
    formData.append('n', '1');
    formData.append('size', '512x512');
    formData.append('response_format', 'url');

    console.log('Testing image generation endpoint:', `${AI_API_CONFIG.baseUrl}/images/edits`);

    const testResponse = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
      },
      body: formData
    });

    const responseData = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      headers: Object.fromEntries(testResponse.headers.entries()),
      ok: testResponse.ok
    };

    let responseBody = null;
    try {
      responseBody = await testResponse.text();
    } catch (e) {
      responseBody = 'Could not read response body';
    }

    return NextResponse.json({
      success: testResponse.ok,
      config: {
        baseUrl: AI_API_CONFIG.baseUrl,
        hasApiKey: !!AI_API_CONFIG.apiKey,
        model: AI_API_CONFIG.model
      },
      response: responseData,
      body: responseBody,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API image test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
