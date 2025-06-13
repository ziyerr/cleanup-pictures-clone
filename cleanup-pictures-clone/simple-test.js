// 简单的AI API测试
const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: 'https://ismaque.org/v1',
  model: 'gpt-image-1'
};

async function testAPI() {
  console.log('🚀 开始测试AI API...\n');
  
  // 测试1: 基础连接
  console.log('📡 测试1: 基础API连接');
  try {
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`状态: ${response.statusText}`);
    
    const text = await response.text();
    console.log(`响应: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}\n`);
    
    if (!response.ok) {
      console.log('❌ 基础连接失败\n');
    } else {
      console.log('✅ 基础连接成功\n');
    }
  } catch (error) {
    console.log(`❌ 连接错误: ${error.message}\n`);
  }
  
  // 测试2: 图片生成（JSON格式）
  console.log('🎨 测试2: 图片生成 (JSON)');
  try {
    const requestBody = {
      prompt: '生成一个简单的卡通猫咪',
      model: AI_API_CONFIG.model,
      n: 1,
      size: '512x512',
      response_format: 'url'
    };
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`状态: ${response.statusText}`);
    
    const text = await response.text();
    console.log(`响应: ${text.substring(0, 300)}${text.length > 300 ? '...' : ''}\n`);
    
    if (!response.ok) {
      console.log('❌ JSON格式请求失败\n');
    } else {
      console.log('✅ JSON格式请求成功\n');
    }
  } catch (error) {
    console.log(`❌ JSON请求错误: ${error.message}\n`);
  }
  
  // 测试3: 尝试其他端点
  console.log('🔄 测试3: 尝试其他端点');
  const endpoints = [
    '/images/generations',
    '/v1/images/edits', 
    '/api/v1/images/edits'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${AI_API_CONFIG.baseUrl}${endpoint}`;
      console.log(`测试: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: '测试',
          model: AI_API_CONFIG.model
        })
      });
      
      console.log(`${endpoint} - 状态码: ${response.status}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} 可用!`);
        break;
      }
    } catch (error) {
      console.log(`${endpoint} - 错误: ${error.message}`);
    }
  }
  
  // 测试4: 尝试其他base URL
  console.log('\n🌐 测试4: 尝试其他base URL');
  const baseUrls = [
    'https://api.sparrow.org/v1',
    'https://ismaque.org',
    'https://api.ismaque.org/v1'
  ];
  
  for (const baseUrl of baseUrls) {
    try {
      console.log(`测试: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${baseUrl} - 状态码: ${response.status}`);
      
      if (response.ok) {
        console.log(`✅ ${baseUrl} 可用!`);
        break;
      }
    } catch (error) {
      console.log(`${baseUrl} - 错误: ${error.message}`);
    }
  }
  
  console.log('\n🏁 测试完成');
}

testAPI().catch(console.error);
