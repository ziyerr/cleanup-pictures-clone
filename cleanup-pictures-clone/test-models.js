// 测试可用的模型
const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: 'https://ismaque.org/v1'
};

async function testModels() {
  console.log('🔍 获取可用模型列表...\n');
  
  try {
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 可用模型列表:');
      
      if (data.data && Array.isArray(data.data)) {
        const imageModels = data.data.filter(model => 
          model.id.includes('image') || 
          model.id.includes('dall') || 
          model.id.includes('midjourney') ||
          model.id.includes('stable') ||
          model.id.includes('gpt-4')
        );
        
        console.log('\n🎨 图像相关模型:');
        imageModels.forEach(model => {
          console.log(`- ${model.id}`);
        });
        
        // 测试每个图像模型
        console.log('\n🧪 测试图像模型可用性:');
        for (const model of imageModels.slice(0, 5)) { // 只测试前5个
          await testImageModel(model.id);
        }
        
        // 如果没有找到图像模型，显示所有模型
        if (imageModels.length === 0) {
          console.log('\n📝 所有可用模型:');
          data.data.forEach(model => {
            console.log(`- ${model.id}`);
          });
          
          // 测试一些通用模型
          const testModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
          for (const modelId of testModels) {
            const model = data.data.find(m => m.id.includes(modelId));
            if (model) {
              await testImageModel(model.id);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取模型列表失败:', error.message);
  }
}

async function testImageModel(modelId) {
  try {
    console.log(`\n🎯 测试模型: ${modelId}`);
    
    const requestBody = {
      prompt: '生成一个简单的卡通猫咪',
      model: modelId,
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
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ ${modelId} 可用!`);
      const data = await response.json();
      console.log(`   响应结构: ${Object.keys(data)}`);
      return modelId;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${modelId} 不可用: ${response.status}`);
      if (errorText.length < 200) {
        console.log(`   错误: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ ${modelId} 测试失败: ${error.message}`);
  }
  
  return null;
}

testModels().catch(console.error);
