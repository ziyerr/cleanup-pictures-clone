// 测试不同的API端点
const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: 'https://ismaque.org/v1'
};

async function testEndpoints() {
  console.log('🔍 测试不同的API端点...\n');
  
  const endpoints = [
    '/images/generations',
    '/chat/completions',
    '/completions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`🎯 测试端点: ${endpoint}`);
    
    if (endpoint === '/chat/completions') {
      await testChatCompletions(endpoint);
    } else if (endpoint === '/completions') {
      await testCompletions(endpoint);
    } else {
      await testImageGenerations(endpoint);
    }
    
    console.log(''); // 空行分隔
  }
}

async function testImageGenerations(endpoint) {
  try {
    const requestBody = {
      prompt: '生成一个简单的卡通猫咪',
      model: 'gpt-4o-dalle',
      n: 1,
      size: '512x512',
      response_format: 'url'
    };
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ ${endpoint} 可用!`);
      const data = await response.json();
      console.log(`   响应结构: ${Object.keys(data)}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${endpoint} 不可用`);
      if (errorText.length < 300) {
        console.log(`   错误: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ ${endpoint} 测试失败: ${error.message}`);
  }
}

async function testChatCompletions(endpoint) {
  try {
    const requestBody = {
      model: 'gpt-4o-dalle',
      messages: [
        {
          role: 'user',
          content: '请生成一个简单的卡通猫咪图片'
        }
      ],
      max_tokens: 100
    };
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ ${endpoint} 可用!`);
      const data = await response.json();
      console.log(`   响应结构: ${Object.keys(data)}`);
      if (data.choices && data.choices[0]) {
        console.log(`   内容预览: ${data.choices[0].message?.content?.substring(0, 100)}...`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${endpoint} 不可用`);
      if (errorText.length < 300) {
        console.log(`   错误: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ ${endpoint} 测试失败: ${error.message}`);
  }
}

async function testCompletions(endpoint) {
  try {
    const requestBody = {
      model: 'gpt-4o',
      prompt: '生成一个简单的卡通猫咪图片描述',
      max_tokens: 100
    };
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ ${endpoint} 可用!`);
      const data = await response.json();
      console.log(`   响应结构: ${Object.keys(data)}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${endpoint} 不可用`);
      if (errorText.length < 300) {
        console.log(`   错误: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ ${endpoint} 测试失败: ${error.message}`);
  }
}

testEndpoints().catch(console.error);
