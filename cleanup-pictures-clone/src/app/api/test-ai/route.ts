import { type NextRequest, NextResponse } from 'next/server';

// Test AI API endpoint
export async function GET() {
  try {
    // Test basic API connectivity - 使用正确的APICore配置
    const AI_API_CONFIG = {
      apiKey: process.env.AI_API_KEY || process.env.NEXT_PUBLIC_SPARROW_API_KEY || 'sk-FEtnKGEiUOj5Dv4kahtX2179RvK9OvaFGjfpf4o8Idbhk6Ql',
      baseUrl: process.env.AI_API_BASE_URL || 'https://api.apicore.ai/v1',
      model: 'gpt-4o-image' // 强制使用gpt-4o-image
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
      apiKey: process.env.AI_API_KEY || process.env.NEXT_PUBLIC_SPARROW_API_KEY || 'sk-FEtnKGEiUOj5Dv4kahtX2179RvK9OvaFGjfpf4o8Idbhk6Ql',
      baseUrl: process.env.AI_API_BASE_URL || 'https://api.apicore.ai/v1',
      model: 'gpt-4o-image' // 强制使用gpt-4o-image
    };

    // 创建一个简单的测试图片base64 (1x1像素红色PNG)
    const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    // Test gpt-4o-image endpoint with APICore format
    const requestBody = {
      stream: false,
      model: AI_API_CONFIG.model,
      messages: [
        {
          role: "user",
          content: `基于提供的参考图片，生成一个测试图片。要求JSON格式响应：\`\`\`json\n{"prompt": "测试生成一个简单的卡通形象", "ratio": "1:1"}\n\`\`\`\n\n[IMAGE]${imageBase64}[/IMAGE]`
        }
      ]
    };

    console.log('Testing gpt-4o-image endpoint:', `${AI_API_CONFIG.baseUrl}/chat/completions`);

    const testResponse = await fetch(`${AI_API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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
