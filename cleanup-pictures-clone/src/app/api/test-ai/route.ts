import { NextRequest, NextResponse } from 'next/server';

// Test AI API endpoint
export async function GET() {
  try {
    // Test basic API connectivity
    const AI_API_CONFIG = {
      apiKey: process.env.AI_API_KEY || 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
      baseUrl: process.env.AI_API_BASE_URL || 'https://ismaque.org/v1',
      model: 'gpt-4o-image' // 更新为gpt-4o-image模型
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
      model: 'gpt-4o-image' // 更新为gpt-4o-image模型
    };

    // 创建一个测试图片 (红色方块)
    const canvas = new OffscreenCanvas(100, 100);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
    
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const imageBase64 = `data:image/png;base64,${base64}`;

    // Test gpt-4o-image endpoint with chat format
    const requestBody = {
      model: AI_API_CONFIG.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "基于提供的参考图片，生成一个测试图片。要求JSON格式响应：```json\n{\"prompt\": \"测试生成一个简单的卡通形象\", \"ratio\": \"1:1\"}\n```"
            },
            {
              type: "image_url", 
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      stream: false
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
