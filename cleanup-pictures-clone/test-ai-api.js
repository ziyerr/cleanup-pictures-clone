// 本地测试AI API连接性
// 使用Node.js 18+内置的fetch API

const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: 'https://ismaque.org/v1',
  model: 'gpt-image-1'
};

// 测试1: 基础API连接
async function testBasicConnection() {
  console.log('🔍 测试1: 基础API连接...');

  try {
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('响应内容:', text);

    return response.ok;
  } catch (error) {
    console.error('❌ 基础连接失败:', error.message);
    return false;
  }
}

// 测试2: 图片生成端点
async function testImageGeneration() {
  console.log('\n🎨 测试2: 图片生成端点...');
  
  try {
    const formData = new FormData();
    formData.append('prompt', '生成一个简单的卡通猫咪');
    formData.append('model', AI_API_CONFIG.model);
    formData.append('n', '1');
    formData.append('size', '512x512');
    formData.append('response_format', 'url');

    console.log('请求URL:', `${AI_API_CONFIG.baseUrl}/images/edits`);
    console.log('请求参数:', {
      prompt: '生成一个简单的卡通猫咪',
      model: AI_API_CONFIG.model,
      n: '1',
      size: '512x512',
      response_format: 'url'
    });

    const response = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
      },
      body: formData
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('响应内容:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        console.log('✅ JSON解析成功');
        console.log('响应结构:', Object.keys(json));
        if (json.data && Array.isArray(json.data)) {
          console.log('数据数组长度:', json.data.length);
          if (json.data.length > 0) {
            console.log('第一项字段:', Object.keys(json.data[0]));
          }
        }
      } catch (parseError) {
        console.log('❌ JSON解析失败:', parseError.message);
      }
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ 图片生成测试失败:', error.message);
    return false;
  }
}

// 测试3: 尝试其他端点
async function testAlternativeEndpoints() {
  console.log('\n🔄 测试3: 尝试其他可能的端点...');
  
  const endpoints = [
    '/images/generations',
    '/v1/images/edits',
    '/api/v1/images/edits',
    '/images/create'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n测试端点: ${AI_API_CONFIG.baseUrl}${endpoint}`);
      
      const formData = new FormData();
      formData.append('prompt', '测试');
      formData.append('model', AI_API_CONFIG.model);
      
      const response = await fetch(`${AI_API_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        },
        body: formData
      });

      console.log(`${endpoint} - 状态码:`, response.status);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} 可用!`);
        const text = await response.text();
        console.log('响应预览:', text.substring(0, 200));
        return endpoint;
      }
    } catch (error) {
      console.log(`${endpoint} - 错误:`, error.message);
    }
  }
  
  return null;
}

// 测试4: 检查不同的base URL
async function testAlternativeBaseUrls() {
  console.log('\n🌐 测试4: 尝试其他可能的base URL...');
  
  const baseUrls = [
    'https://api.sparrow.org/v1',
    'https://ismaque.org',
    'https://api.ismaque.org/v1',
    'https://sparrow-api.com/v1'
  ];

  for (const baseUrl of baseUrls) {
    try {
      console.log(`\n测试base URL: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${baseUrl} - 状态码:`, response.status);
      
      if (response.ok) {
        console.log(`✅ ${baseUrl} 可用!`);
        return baseUrl;
      }
    } catch (error) {
      console.log(`${baseUrl} - 错误:`, error.message);
    }
  }
  
  return null;
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始AI API本地测试...\n');
  
  const basicOk = await testBasicConnection();
  const imageOk = await testImageGeneration();
  
  if (!basicOk && !imageOk) {
    console.log('\n❌ 主要端点都不可用，尝试其他选项...');
    
    const workingEndpoint = await testAlternativeEndpoints();
    const workingBaseUrl = await testAlternativeBaseUrls();
    
    if (workingEndpoint) {
      console.log(`\n✅ 找到可用端点: ${workingEndpoint}`);
    }
    
    if (workingBaseUrl) {
      console.log(`\n✅ 找到可用base URL: ${workingBaseUrl}`);
    }
    
    if (!workingEndpoint && !workingBaseUrl) {
      console.log('\n❌ 所有测试都失败，API可能暂时不可用或配置有误');
    }
  } else {
    console.log('\n✅ API测试完成');
  }
}

// 运行测试
runTests().catch(console.error);
