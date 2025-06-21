/**
 * 测试图生图功能的脚本
 * 分别测试 generateIPCharacterWithTask 和 generateAllMerchandise 的图生图能力
 */

// 由于这是 Next.js 项目，我们将创建 API 测试路由
// 这个文件作为测试脚本的模板，实际测试将通过 API 路由进行

// 测试用的图片 URL（可以是本地文件或远程URL）
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400'; // 卡通风格的测试图片
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_CHARACTER_ID = 'test-char-' + Date.now();

/**
 * 创建测试用的 File 对象（从URL下载图片）
 */
async function createTestImageFile(imageUrl) {
  try {
    console.log('📥 下载测试图片:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    // 创建 File 对象
    const file = new File([blob], 'test-image.jpg', { 
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    console.log('✅ 测试图片已准备:', {
      name: file.name,
      size: (file.size / 1024).toFixed(1) + 'KB',
      type: file.type
    });
    
    return file;
  } catch (error) {
    console.error('❌ 创建测试图片失败:', error);
    return null;
  }
}

/**
 * 测试 generateIPCharacterWithTask 函数的图生图功能
 */
async function testIPGenerationWithImage() {
  console.log('\n🧪 === 测试 generateIPCharacterWithTask 图生图功能 ===');
  
  try {
    // 准备测试图片
    const testImage = await createTestImageFile(TEST_IMAGE_URL);
    if (!testImage) {
      throw new Error('无法创建测试图片');
    }
    
    // 测试请求
    const request = {
      image: testImage, // 传入 File 对象进行图生图
      prompt: '将这个图片转换为可爱的卡通IP形象，保持主要特征，添加温暖友好的表情',
      userId: TEST_USER_ID
    };
    
    console.log('📤 发送IP生成请求...');
    console.log('请求参数:', {
      hasImage: !!request.image,
      imageType: typeof request.image,
      prompt: request.prompt.substring(0, 50) + '...',
      userId: request.userId
    });
    
    // 调用函数
    const result = await generateIPCharacterWithTask(request);
    
    console.log('📋 IP生成响应:', result);
    
    if (result.success && result.taskId) {
      console.log('✅ 任务创建成功，开始轮询结果...');
      
      // 轮询任务状态
      const finalResult = await pollTaskCompletion(result.taskId, 30); // 最多等待5分钟
      
      console.log('🏁 IP生成最终结果:', finalResult);
      
      if (finalResult.success && finalResult.task?.result_image_url) {
        console.log('🎉 IP形象生成成功!');
        console.log('生成的图片URL:', finalResult.task.result_image_url);
        return {
          success: true,
          taskId: result.taskId,
          imageUrl: finalResult.task.result_image_url
        };
      } else {
        console.error('❌ IP生成失败:', finalResult.task?.error_message || finalResult.error);
        return { success: false, error: finalResult.task?.error_message || finalResult.error };
      }
    } else {
      console.error('❌ 任务创建失败:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ testIPGenerationWithImage 异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 测试 generateAllMerchandise 函数的图生图功能
 */
async function testMerchandiseGenerationWithImage() {
  console.log('\n🧪 === 测试 generateAllMerchandise 图生图功能 ===');
  
  try {
    // 使用一个测试用的IP形象URL
    const ipImageUrl = TEST_IMAGE_URL; // 实际使用中应该是第一个测试生成的结果
    
    console.log('📤 发送周边商品生成请求...');
    console.log('请求参数:', {
      characterId: TEST_CHARACTER_ID,
      originalImageUrl: ipImageUrl,
      characterName: '测试IP形象',
      characterDescription: '一个可爱的卡通角色，适合制作各种周边商品',
      userId: TEST_USER_ID
    });
    
    // 调用函数
    const result = await generateAllMerchandise(
      TEST_CHARACTER_ID,
      ipImageUrl,
      '测试IP形象',
      '一个可爱的卡通角色，适合制作各种周边商品',
      TEST_USER_ID
    );
    
    console.log('📋 周边商品生成响应:', result);
    
    if (result.batchId && result.taskIds) {
      console.log('✅ 批量任务创建成功，任务ID列表:');
      Object.entries(result.taskIds).forEach(([type, taskId]) => {
        console.log(`  - ${type}: ${taskId}`);
      });
      
      console.log('⏳ 开始轮询各个任务状态...');
      
      // 轮询所有任务的状态
      const taskResults = {};
      for (const [type, taskId] of Object.entries(result.taskIds)) {
        console.log(`\n🔄 轮询任务 ${type} (${taskId})...`);
        
        try {
          const taskResult = await pollTaskCompletion(taskId, 20); // 每个任务最多等待3.5分钟
          taskResults[type] = taskResult;
          
          if (taskResult.success && taskResult.task?.result_image_url) {
            console.log(`✅ ${type} 生成成功: ${taskResult.task.result_image_url}`);
          } else if (taskResult.success && taskResult.task?.result_data?.model_url) {
            console.log(`✅ ${type} 生成成功: ${taskResult.task.result_data.model_url}`);
          } else {
            console.error(`❌ ${type} 生成失败:`, taskResult.task?.error_message || taskResult.error);
          }
        } catch (pollError) {
          console.error(`❌ ${type} 轮询异常:`, pollError.message);
          taskResults[type] = { success: false, error: pollError.message };
        }
      }
      
      // 统计结果
      const successCount = Object.values(taskResults).filter(r => r.success).length;
      const totalCount = Object.keys(taskResults).length;
      
      console.log(`\n📊 周边商品生成结果统计:`);
      console.log(`成功: ${successCount}/${totalCount}`);
      console.log('详细结果:', taskResults);
      
      return {
        success: successCount > 0,
        batchId: result.batchId,
        taskResults,
        successCount,
        totalCount
      };
      
    } else {
      console.error('❌ 批量任务创建失败');
      return { success: false, error: '批量任务创建失败' };
    }
    
  } catch (error) {
    console.error('❌ testMerchandiseGenerationWithImage 异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 主测试函数
 */
async function runImageGenerationTests() {
  console.log('🚀 开始图生图功能测试');
  console.log('测试时间:', new Date().toISOString());
  console.log('测试图片URL:', TEST_IMAGE_URL);
  
  const results = {
    ipGeneration: null,
    merchandiseGeneration: null,
    summary: {}
  };
  
  try {
    // 测试1: IP形象生成
    console.log('\n' + '='.repeat(60));
    results.ipGeneration = await testIPGenerationWithImage();
    
    // 测试2: 周边商品生成  
    console.log('\n' + '='.repeat(60));
    results.merchandiseGeneration = await testMerchandiseGenerationWithImage();
    
    // 生成测试报告
    console.log('\n' + '='.repeat(60));
    console.log('📋 === 测试报告 ===');
    
    results.summary = {
      ipGenerationSuccess: results.ipGeneration?.success || false,
      merchandiseGenerationSuccess: results.merchandiseGeneration?.success || false,
      totalTasksCreated: results.merchandiseGeneration?.totalCount || 0,
      successfulTasks: results.merchandiseGeneration?.successCount || 0,
      testTime: new Date().toISOString()
    };
    
    console.log('IP形象生成:', results.ipGeneration?.success ? '✅ 成功' : '❌ 失败');
    if (results.ipGeneration?.imageUrl) {
      console.log('生成的IP形象:', results.ipGeneration.imageUrl);
    }
    if (results.ipGeneration?.error) {
      console.log('IP生成错误:', results.ipGeneration.error);
    }
    
    console.log('周边商品生成:', results.merchandiseGeneration?.success ? '✅ 成功' : '❌ 失败');
    if (results.merchandiseGeneration?.successCount) {
      console.log(`成功生成 ${results.merchandiseGeneration.successCount}/${results.merchandiseGeneration.totalCount} 个周边商品`);
    }
    if (results.merchandiseGeneration?.error) {
      console.log('周边生成错误:', results.merchandiseGeneration.error);
    }
    
    // 保存测试结果到文件
    const reportPath = path.join(__dirname, `test-results-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log('📄 测试结果已保存到:', reportPath);
    
    return results;
    
  } catch (error) {
    console.error('❌ 测试执行异常:', error);
    results.summary.error = error.message;
    return results;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runImageGenerationTests()
    .then(results => {
      console.log('\n🏁 测试完成');
      process.exit(results.summary.ipGenerationSuccess && results.summary.merchandiseGenerationSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 测试脚本异常:', error);
      process.exit(1);
    });
}

module.exports = {
  testIPGenerationWithImage,
  testMerchandiseGenerationWithImage,
  runImageGenerationTests
};