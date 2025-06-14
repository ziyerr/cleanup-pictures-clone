// 测试新的API配置
const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: 'https://ismaque.org/v1',
  model: 'gpt-image-1',
  endpoint: '/images/edits'
};

async function testNewAPI() {
  console.log('🚀 测试新的API配置...\n');
  
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
    
    if (response.ok) {
      console.log('✅ 基础连接成功\n');
    } else {
      console.log('❌ 基础连接失败\n');
    }
  } catch (error) {
    console.log(`❌ 连接错误: ${error.message}\n`);
  }
  
  // 测试2: 图片编辑API（模拟FormData）
  console.log('🎨 测试2: 图片编辑API');
  try {
    // 创建一个简单的测试图片（1x1像素PNG）
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGbKdMDgAAAABJRU5ErkJggg==';
    const testImageBlob = new Blob([Uint8Array.from(atob(testImageData), c => c.charCodeAt(0))], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('prompt', '生成一个可爱的卡通猫咪');
    formData.append('model', AI_API_CONFIG.model);
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'url');
    formData.append('image', testImageBlob, 'test.png');
    
    console.log(`请求URL: ${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`);
    console.log('请求参数:', {
      prompt: '生成一个可爱的卡通猫咪',
      model: AI_API_CONFIG.model,
      n: '1',
      size: '1024x1024',
      response_format: 'url',
      hasImage: true
    });
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
      },
      body: formData
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`状态: ${response.statusText}`);
    
    const text = await response.text();
    console.log(`响应: ${text.substring(0, 300)}${text.length > 300 ? '...' : ''}\n`);
    
    if (response.ok) {
      console.log('✅ 图片编辑API调用成功!');
      try {
        const data = JSON.parse(text);
        console.log('响应结构:', Object.keys(data));
        if (data.data && Array.isArray(data.data)) {
          console.log('生成的图片数量:', data.data.length);
          if (data.data.length > 0) {
            console.log('第一张图片URL:', data.data[0].url?.substring(0, 50) + '...');
          }
        }
      } catch (parseError) {
        console.log('JSON解析失败:', parseError.message);
      }
    } else {
      console.log('❌ 图片编辑API调用失败');
      
      // 分析错误类型
      if (response.status === 503) {
        console.log('🔧 服务暂时不可用 - 这是临时问题');
      } else if (response.status === 400) {
        console.log('📝 请求参数错误 - 需要检查API参数');
      } else if (response.status === 401) {
        console.log('🔑 认证失败 - API密钥可能有问题');
      } else if (response.status === 413) {
        console.log('📦 文件过大 - 需要压缩图片');
      }
    }
  } catch (error) {
    console.log(`❌ API调用错误: ${error.message}`);
  }
  
  console.log('\n🏁 测试完成');
}

testNewAPI().catch(console.error);
