import { NextRequest, NextResponse } from 'next/server';
import { generateIPCharacterWithTask, generateAllMerchandise, checkTaskStatus, pollTaskCompletion } from '@/lib/ai-api';

// 测试用的图片 URL
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400';
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_CHARACTER_ID = 'test-char-' + Date.now();

/**
 * 创建测试用的 File 对象（从URL下载图片）
 */
async function createTestImageFile(imageUrl: string): Promise<File | null> {
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
      
      // 轮询任务状态（简化版，只等待30秒）
      const finalResult = await pollTaskCompletion(result.taskId, 3); // 最多等待30秒
      
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
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 测试 generateAllMerchandise 函数的图生图功能
 */
async function testMerchandiseGenerationWithImage() {
  console.log('\n🧪 === 测试 generateAllMerchandise 图生图功能 ===');
  
  try {
    // 使用测试用的IP形象URL
    const ipImageUrl = TEST_IMAGE_URL;
    
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
      
      // 简化测试：只检查任务创建，不等待完成
      console.log('⏳ 检查任务状态（简化版）...');
      
      const taskStatuses: { [key: string]: any } = {};
      for (const [type, taskId] of Object.entries(result.taskIds)) {
        try {
          const status = await checkTaskStatus(taskId);
          taskStatuses[type] = status;
          console.log(`📋 ${type} 状态:`, status.task?.status || 'unknown');
        } catch (error) {
          console.error(`❌ ${type} 状态检查失败:`, error);
          taskStatuses[type] = { success: false, error: (error as Error).message };
        }
      }
      
      return {
        success: true,
        batchId: result.batchId,
        taskIds: result.taskIds,
        taskStatuses,
        message: '批量任务创建成功，任务正在后台处理'
      };
      
    } else {
      console.error('❌ 批量任务创建失败');
      return { success: false, error: '批量任务创建失败' };
    }
    
  } catch (error) {
    console.error('❌ testMerchandiseGenerationWithImage 异常:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'both';
  
  console.log('🚀 开始图生图功能测试');
  console.log('测试类型:', testType);
  console.log('测试时间:', new Date().toISOString());
  console.log('测试图片URL:', TEST_IMAGE_URL);
  
  const results: any = {
    testType,
    timestamp: new Date().toISOString(),
    testImageUrl: TEST_IMAGE_URL,
    testUserId: TEST_USER_ID,
    testCharacterId: TEST_CHARACTER_ID
  };
  
  try {
    if (testType === 'ip' || testType === 'both') {
      console.log('\n' + '='.repeat(60));
      results.ipGeneration = await testIPGenerationWithImage();
    }
    
    if (testType === 'merchandise' || testType === 'both') {
      console.log('\n' + '='.repeat(60));
      results.merchandiseGeneration = await testMerchandiseGenerationWithImage();
    }
    
    // 生成测试总结
    results.summary = {
      ipGenerationSuccess: results.ipGeneration?.success || false,
      merchandiseGenerationSuccess: results.merchandiseGeneration?.success || false,
      completedAt: new Date().toISOString()
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 === 测试报告 ===');
    console.log('IP形象生成:', results.ipGeneration?.success ? '✅ 成功' : '❌ 失败');
    console.log('周边商品生成:', results.merchandiseGeneration?.success ? '✅ 成功' : '❌ 失败');
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ 测试执行异常:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      data: results
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;
    
    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: '需要提供 taskId'
      }, { status: 400 });
    }
    
    console.log('🔍 检查任务状态:', taskId);
    const status = await checkTaskStatus(taskId);
    
    return NextResponse.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ 检查任务状态失败:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}