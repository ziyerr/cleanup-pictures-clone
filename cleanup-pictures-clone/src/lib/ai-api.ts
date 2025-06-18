import { 
  supabase,
  uploadImageToSupabase,
  createGenerationTask,
  updateGenerationTask,
  getGenerationTask,
  getBatchTasks,
  getCharacterTasks,
  saveUserIPCharacter,
  type GenerationTask,
  type UserIPCharacter
} from './supabase';
import { generate3DModelFromImage, generate3DModelFromViews } from './tripo3d-api';
import { v4 as uuidv4 } from 'uuid';

// AI API integration for IP character generation
export interface AIGenerationRequest {
  image: File | Blob | string; // Can be File object, Blob, or base64 string
  prompt: string;
  model?: string;
  userId?: string;
}

// 演示模式已完全禁用 - 始终使用真实API生成
// const DEMO_MODE = false; // 已删除，防止意外启用

// 验证是否是演示图片URL
const isDemoImageUrl = (imageUrl: string): boolean => {
  if (!imageUrl) return true;
  
  const demoPatterns = [
    'filesystem.site',
    'example.com',
    'placeholder',
    'demo',
    'mock',
    'test-image',
    'unsplash.com',
    'picsum.photos',
    'via.placeholder.com',
    'dummyimage.com'
  ];
  
  const isDemo = demoPatterns.some(pattern => 
    imageUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isDemo) {
    console.warn('🚫 检测到演示图片URL:', imageUrl);
  }
  
  return isDemo;
};

export interface AIGenerationResponse {
  success: boolean;
  taskId?: string;
  data?: {
    url: string;
    id: string;
  };
  error?: string;
}

export interface TaskStatusResponse {
  success: boolean;
  task?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result_image_url?: string;
    result_data?: Record<string, unknown>;
    error_message?: string;
  };
  error?: string;
}

// API Configuration - APICore配置 (根据官方文档https://doc.apicore.ai/api-301177866更新)
// 强制使用gpt-4o-image模型进行所有图片生成
const AI_API_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.NEXT_PUBLIC_SPARROW_API_KEY || 'sk-FEtnKGEiUOj5Dv4kahtX2179RvK9OvaFGjfpf4o8Idbhk6Ql',
  baseUrl: process.env.AI_API_BASE_URL || 'https://api.apicore.ai/v1', // 使用官方文档中的正确API地址
  model: 'gpt-4o-image', // 强制使用gpt-4o-image进行图生图，不允许环境变量覆盖
  endpoint: '/chat/completions' // 使用chat格式
};

// 配置：使用官方APICore endpoint - 全部强制使用gpt-4o-image
const ALTERNATIVE_CONFIGS = [
  {
    name: 'gpt-4o-image-primary',
    apiKey: process.env.AI_API_KEY || process.env.NEXT_PUBLIC_SPARROW_API_KEY || 'sk-FEtnKGEiUOj5Dv4kahtX2179RvK9OvaFGjfpf4o8Idbhk6Ql',
    baseUrl: 'https://api.apicore.ai/v1',
    endpoint: '/chat/completions',
    model: 'gpt-4o-image' // 强制使用gpt-4o-image进行图生图
  }
];

// Convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/type;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// 优化的图片压缩函数 - 针对10M内图片，最大程度保持精度
const compressImage = async (file: File, maxSizeKB = 5120): Promise<File | Blob> => {
  // 对于小文件（2MB以下），直接跳过压缩
  if (file.size <= 2 * 1024 * 1024) {
    console.log('文件较小，跳过压缩:', file.size, 'bytes');
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算最优尺寸 - 保持原始比例
      let { width, height } = img;
      const maxDimension = 1536; // 降低最大维度，减少文件大小
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 高质量绘制
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // 从高质量开始，逐步降低直到符合大小要求
        const tryCompress = (quality: number) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || quality <= 0.2) {
                // 验证压缩效果，如果压缩后反而更大，使用原文件
                if (blob.size >= file.size) {
                  console.log('压缩后文件更大，使用原文件:', file.size, '→', blob.size);
                  resolve(file);
                } else {
                  // 创建压缩后的File对象，保持原始文件名
                  const compressedFile = new File(
                    [blob], 
                    file.name, 
                    { 
                      type: blob.type,
                      lastModified: Date.now()
                    }
                  );
                  console.log('压缩成功:', file.size, '→', blob.size, 'bytes');
                  resolve(compressedFile);
                }
              } else {
                // 质量递减步进更小，保持更好的精度
                tryCompress(quality - 0.1);
              }
            } else {
              resolve(file);
            }
          }, file.type, quality);
        };
        
        tryCompress(0.85); // 从85%质量开始，更保守
      } else {
        resolve(file);
      }
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB - 根据用户需求调整
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: '文件大小不能超过10MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '只支持JPG、PNG、WEBP格式的图片' };
  }

  return { valid: true };
};

// Generate IP character with task tracking
export const generateIPCharacterWithTask = async (request: AIGenerationRequest): Promise<AIGenerationResponse> => {
  try {
    // Create task in database
    const task = await createGenerationTask(
      'ip_generation', 
      request.prompt,
      // If image is a string, it might be a URL or base64. For now, we don't store it as original_image_url
      // to avoid complexity. The actual generated image will be stored later.
      undefined,
      request.userId
    );

    // Start background processing
    processGenerationTask(task.id, request);

    return {
      success: true,
      taskId: task.id
    };
  } catch (error) {
    console.error('创建生成任务失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任务创建失败'
    };
  }
};

// Background task processing
const processGenerationTask = async (taskId: string, request: AIGenerationRequest) => {
  try {
    // Update task status to processing in database
    await updateGenerationTask(taskId, { status: 'processing' });

    // Call the actual AI generation
    const result = await generateIPCharacter(request);

    if (result.success && result.data?.url) {
      let finalImageUrl = result.data.url;
      
      // If the result is a URL (not base64), fetch it and upload to Supabase
      if (!result.data.url.startsWith('data:')) {
        try {
          console.log(`Fetching image from URL: ${result.data.url}`);
          const response = await fetch(result.data.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          const blob = await response.blob();
          const fileName = `ip_character_${taskId}.png`;
          console.log(`Uploading image to Supabase with filename: ${fileName}`);
          finalImageUrl = await uploadImageToSupabase(blob, fileName);
          console.log(`Image uploaded to Supabase, URL: ${finalImageUrl}`);
        } catch (uploadError) {
          console.error('图片上传到Supabase失败，将以降级模式处理:', uploadError);
          // In case of upload failure, we still mark task as failed.
          await updateGenerationTask(taskId, {
            status: 'failed',
            error_message: `生成成功但上传失败: ${uploadError instanceof Error ? uploadError.message : '未知上传错误'}`
          });
          return; // Stop processing
        }
      }

      // 验证图片URL不是演示图片，然后保存到数据库
      if (request.userId) {
        try {
          // 验证不是演示图片
          if (isDemoImageUrl(finalImageUrl)) {
            throw new Error('检测到演示图片URL，拒绝保存到数据库');
          }
          
          // The name could be derived from the prompt or be a default
          const characterName = request.prompt.substring(0, 20) || '新IP形象';
          await saveUserIPCharacter(request.userId, characterName, finalImageUrl);
          console.log(`✅ 真实IP形象已保存，用户: ${request.userId}, URL: ${finalImageUrl}`);
        } catch (saveError) {
            console.error('❌ 保存用户IP形象失败:', saveError);
            // 如果是演示图片，标记任务失败
            if (saveError instanceof Error && saveError.message.includes('演示图片')) {
              await updateGenerationTask(taskId, {
                status: 'failed',
                error_message: '生成的图片无效，请重试'
              });
              return;
            }
        }
      }

      // 最终验证：确保保存到数据库的URL不是演示图片
      if (isDemoImageUrl(finalImageUrl)) {
        console.error('🚫 拒绝保存演示图片URL到任务结果:', finalImageUrl);
        await updateGenerationTask(taskId, {
          status: 'failed',
          error_message: '生成的图片无效，请重试生成'
        });
      } else {
        await updateGenerationTask(taskId, {
          status: 'completed',
          result_image_url: finalImageUrl
        });
        console.log('✅ 真实图片URL已保存到任务结果:', finalImageUrl);
      }
    } else {
      await updateGenerationTask(taskId, {
        status: 'failed',
        error_message: result.error || '生成失败'
      });
    }
  } catch (error) {
    console.error('处理生成任务失败:', error);
    await updateGenerationTask(taskId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// Check task status
export const checkTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
  try {
    const task = await getGenerationTask(taskId);
    
    if (!task) {
      return {
        success: false,
        error: '任务不存在'
      };
    }

    return {
      success: true,
      task: {
        id: task.id,
        status: task.status,
        result_image_url: task.result_image_url,
        result_data: task.result_data,
        error_message: task.error_message
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询任务状态失败'
    };
  }
};

// Polling function for task completion
export const pollTaskCompletion = async (taskId: string, maxAttempts = 60): Promise<TaskStatusResponse> => {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      
      try {
        const status = await checkTaskStatus(taskId);
        
        if (!status.success) {
          resolve(status);
          return;
        }

        const task = status.task!;
        
        if (task.status === 'completed' || task.status === 'failed') {
          resolve(status);
          return;
        }

        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            error: '任务超时'
          });
          return;
        }

        // Continue polling every 10 seconds
        setTimeout(poll, 10000);
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : '轮询失败'
        });
      }
    };

    poll();
  });
};

// Original function to generate IP character
// 生成演示图片 - 当API服务不可用时的备用方案
const generateDemoImage = async (prompt: string): Promise<string> => {
  // 创建一个带有用户提示的演示图片
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 512;
    canvas.height = 512;
    
    if (ctx) {
      // 渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#4ecdc4');
      gradient.addColorStop(1, '#45b7d1');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // 添加文本
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 白色背景矩形
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(50, 200, 412, 112);
      
      // 黑色文本
      ctx.fillStyle = '#333';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('AI生成演示', 256, 230);
      ctx.font = '16px Arial';
      ctx.fillText(`提示词: ${prompt.substring(0, 30)}...`, 256, 256);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText('这是一个演示图片', 256, 280);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      } else {
        resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
      }
    }, 'image/png');
  });
};

// 使用多个API配置进行故障转移的生成函数
const tryGenerateWithFallback = async (request: AIGenerationRequest): Promise<AIGenerationResponse> => {
  const fullPrompt = `创建一个可爱的卡通IP形象，${request.prompt}。要求：1. 卡通风格，适合制作周边产品；2. 简洁明了的设计；3. 温暖友好的表情；4. 适合商业应用的形象设计`;
  
  // 尝试所有API配置
  for (const config of ALTERNATIVE_CONFIGS) {
    try {
      console.log(`尝试使用配置: ${config.name}`);
      
      // 传递图片参数到API调用
      const response = await tryAPICall(config, fullPrompt, request.image);
      if (response) {
        return response;
      }
    } catch (error) {
      console.log(`配置 ${config.name} 失败:`, error);
      continue; // 尝试下一个配置
    }
  }
  
  // 所有API配置都失败，直接抛出错误，不使用演示模式
  throw new Error('所有API配置都失败，请检查网络连接或API配额');
};

// 单个API配置的调用函数 - 根据APICore文档修复
const tryAPICall = async (config: typeof ALTERNATIVE_CONFIGS[0], prompt: string, imageFile?: File | Blob | string): Promise<AIGenerationResponse | null> => {
  try {
    console.log(`尝试API调用 (${config.name}):`, {
      url: `${config.baseUrl}${config.endpoint}`,
      model: config.model,
      prompt: prompt.substring(0, 100) + '...',
      hasImage: !!imageFile
    });

    // 构建APICore gpt-4o-image的请求格式 - 根据官方文档更新
    let requestBody: any;
    
    if (imageFile) {
      // 图生图模式 - 包含图片和提示词
      let imageBase64: string;
      
      if (typeof imageFile === 'string') {
        if (imageFile.startsWith('data:image')) {
          imageBase64 = imageFile;
        } else {
          // URL格式，需要下载并转换
          const response = await fetch(imageFile);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          imageBase64 = `data:${blob.type};base64,${base64}`;
        }
      } else {
        // File或Blob对象
        const base64 = await fileToBase64(imageFile as File);
        const mimeType = (imageFile as File).type || 'image/png';
        imageBase64 = `data:${mimeType};base64,${base64}`;
      }

      // 根据APICore文档格式构建请求体
      requestBody = {
        stream: false,
        model: config.model,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n[IMAGE]${imageBase64}[/IMAGE]`
          }
        ]
      };
    } else {
      // 纯文生图
      requestBody = {
        stream: false,
        model: config.model,
        messages: [
          {
            role: "user", 
            content: prompt
          }
        ]
      };
    }

    let response;
    try {
      response = await fetch(`${config.baseUrl}${config.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000) // 增加到120秒超时，gpt-4o-image需要更长处理时间
      });
    } catch (fetchError) {
      console.error(`Fetch调用失败 (${config.name}):`, {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : '未知fetch错误',
        type: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError,
        url: `${config.baseUrl}${config.endpoint}`
      });
      throw fetchError;
    }

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = `无法读取错误响应: ${textError}`;
      }
      
      const errorInfo = {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${config.baseUrl}${config.endpoint}`,
        model: config.model
      };
      
      console.error(`API调用失败 (${config.name}):`, errorInfo);
      
      // 直接抛出错误，不使用演示模式
      throw new Error(`API调用失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`API响应成功 (${config.name}):`, result);
    
    // 解析gpt-4o-image的响应格式
    if (result.choices && result.choices.length > 0) {
      const choice = result.choices[0];
      const content = choice.message?.content;
      
      if (content) {
        // 从响应中提取图片URL
        const imageUrlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
        if (imageUrlMatch) {
          const imageUrl = imageUrlMatch[1];
          return {
            success: true,
            data: {
              url: imageUrl,
              id: uuidv4()
            }
          };
        }
        
        // 如果没有找到图片URL，检查是否有其他格式的图片链接
        const urlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/i);
        if (urlMatch) {
          return {
            success: true,
            data: {
              url: urlMatch[1],
              id: uuidv4()
            }
          };
        }
      }
    }
    
    console.error(`API响应格式错误 (${config.name}):`, result);
    throw new Error('API响应中未找到有效的图片URL');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`API调用异常 (${config.name}):`, {
      error: error,
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    // 抛出详细的错误信息
    throw new Error(`API调用异常 (${config.name}): ${errorMessage}`);
  }
};

export const generateIPCharacter = async (request: AIGenerationRequest): Promise<AIGenerationResponse> => {
  try {
    console.log('开始AI生成请求:', request);

    // 演示模式已禁用 - 强制使用真实API生成
    console.log('🚀 使用真实AI生成模式 - 不使用演示数据');

    // 使用故障转移机制
    return await tryGenerateWithFallback(request);
  } catch (error) {
    console.error('generateIPCharacter错误:', error);
    
    // 简化错误处理，用户友好的错误信息
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('signal timed out')) {
        return {
          success: false,
          error: '图片生成超时（120秒），请尝试简化提示词或稍后重试'
        };
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: '网络连接中断，请检查网络后重试'
        };
      }
      if (error.message.includes('CONNECTION_RESET')) {
        return {
          success: false,
          error: '连接被重置，请检查图片大小（建议小于5MB）后重试'
        };
      }
      if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
        return {
          success: false,
          error: 'API服务暂时不可用，请稍后重试'
        };
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return {
          success: false,
          error: 'API密钥无效，请联系管理员'
        };
      }
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return {
          success: false,
          error: 'API调用频率过高，请稍后重试'
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片生成失败，请稍后重试'
    };
  }
};

// Helper to call Sparrow API for 2D图生2D图 tasks using gpt-4o-image
// 强制使用gpt-4o-image模型进行周边图生成
async function triggerSparrowGeneration(prompt: string, imageUrl?: string) {
  if (!imageUrl) {
    throw new Error('2D图生2D图功能必须提供基础IP形象图作为输入');
  }

  try {
    console.log('🎨 强制使用gpt-4o-image模型生成周边图');
    console.log('正在获取基础IP形象图:', imageUrl);
    
    // 获取图片并转换为base64
    let imageBase64: string;
    if (imageUrl.startsWith('data:image')) {
      // 如果已经是base64格式，直接使用
      imageBase64 = imageUrl;
    } else {
      // 下载图片并转换为base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      imageBase64 = `data:${blob.type};base64,${base64}`;
    }

    console.log('✅ 基础IP形象图已准备完成');

    // 强制构建gpt-4o-image的请求格式，确保使用图生图功能
    const requestBody = {
      stream: false,
      model: 'gpt-4o-image', // 强制指定gpt-4o-image模型
      messages: [
        {
          role: "user",
          content: `使用提供的IP形象图片作为参考，${prompt}。要求：
1. 保持IP形象的核心特征和风格
2. 根据周边类型调整设计布局
3. 确保商品化效果良好
4. 生成高质量的产品设计图

参考图片：[IMAGE]${imageBase64}[/IMAGE]`
        }
      ]
    };

    console.log('🚀 发送gpt-4o-image请求 - 强制模型模式');
    console.log('提示词:', prompt.substring(0, 100) + '...');
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ gpt-4o-image API error: ${response.statusText}`, errorBody);
      throw new Error(`Failed to generate image with gpt-4o-image for prompt: ${prompt}`);
    }
    
    const data = await response.json();
    console.log('📦 gpt-4o-image API 响应接收完成');
    
    // 解析gpt-4o-image的响应格式
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('gpt-4o-image API返回的数据格式无效 - 缺少choices字段');
    }
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('gpt-4o-image API返回的数据格式无效 - 缺少content字段');
    }
    
    // 从响应内容中提取图片URL (gpt-4o-image返回Markdown格式，包含图片URL)
    const imageUrlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (imageUrlMatch && imageUrlMatch[1]) {
      console.log('✅ 成功提取gpt-4o-image生成的图片URL:', imageUrlMatch[1]);
      return imageUrlMatch[1];
    } else {
      // 尝试其他可能的URL格式
      const urlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/i);
      if (urlMatch) {
        console.log('✅ 成功提取gpt-4o-image生成的图片URL (备用格式):', urlMatch[1]);
        return urlMatch[1];
      }
      
      console.log('⚠️ gpt-4o-image响应内容:', content);
      throw new Error('无法从gpt-4o-image API响应中提取图片URL');
    }
    
  } catch (error) {
    console.error('❌ gpt-4o-image周边图生成失败:', error);
    throw new Error(`gpt-4o-image图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 生成多视图 - 增强版本，支持批量ID和字符关联
export const generateMultiViews = async (
  originalImageUrl: string,
  prompt: string,
  userId?: string,
  batchId?: string,
  characterId?: string,
  supabaseClient?: any // 可选的认证客户端
): Promise<{ [key: string]: string }> => {
  const views = [
    {
      type: 'left_view',
      prompt: `生成参考图片中IP角色的左侧视图。要求：1. 保持与正面图完全一致的角色特征、服装和配色；2. 展示角色的左侧轮廓，包括侧面的发型、服装细节；3. 保持相同的艺术风格和比例；4. 背景保持简洁或透明；5. 角色姿态自然，适合3D建模使用。原始角色描述：${prompt}`
    },
    {
      type: 'back_view', 
      prompt: `生成参考图片中IP角色的背面视图。要求：1. 保持与正面图完全一致的角色特征、服装和配色；2. 展示角色的背部轮廓，包括后脑勺、服装背面设计；3. 保持相同的艺术风格和比例；4. 背景保持简洁或透明；5. 角色姿态自然，与正面图协调一致。原始角色描述：${prompt}`
    }
  ];
  
  const tasks: Promise<GenerationTask>[] = [];

  for (const view of views) {
    const task = createGenerationTask(`multi_view_${view.type}`, view.prompt, originalImageUrl, userId, batchId, characterId, supabaseClient);
    tasks.push(task);
  }
  
  const createdTasks = await Promise.all(tasks);
  
  // 后台处理任务
  createdTasks.forEach(task => {
    processImageGenerationTask(task.id);
  });

  return createdTasks.reduce((acc, task) => {
    const view = task.task_type.replace('multi_view_', '');
    acc[view + '_task_id'] = task.id;
    return acc;
  }, {} as { [key: string]: string });
};

// 处理图像生成任务 - 通用函数
export const processImageGenerationTask = async (taskId: string) => {
   const task = await getGenerationTask(taskId);
   if (!task) {
     console.error(`Task ${taskId} not found for processing.`);
     return;
   }

   try {
     await updateGenerationTask(taskId, { status: 'processing' });
     const imageUrl = await triggerSparrowGeneration(task.prompt, task.original_image_url);
     
     const response = await fetch(imageUrl);
     if (!response.ok) throw new Error(`Failed to fetch generated image: ${response.statusText}`);
     
     const blob = await response.blob();
     const fileName = `generated_${taskId}.png`;
     const finalImageUrl = await uploadImageToSupabase(blob, fileName);
     
     const completedTask = await updateGenerationTask(taskId, { 
       status: 'completed', 
       result_image_url: finalImageUrl 
     });

     await updateCharacterOnTaskCompletion(completedTask);

   } catch (error) {
     console.error(`Task ${taskId} failed:`, error);
     await updateGenerationTask(taskId, { 
       status: 'failed', 
       error_message: error instanceof Error ? error.message : '未知错误' 
     });
   }
 };

export const generateMerchandise = async (
  originalImageUrl: string,
  prompt: string,
  userId?: string,
  batchId?: string,
  characterId?: string,
  supabaseClient?: any // 可选的认证客户端
): Promise<{ taskIds: Record<string, string> }> => {
  const merchandiseTypes = [
    { 
      type: 'keychain', 
      name: '钥匙扣',
      prompt: `设计一个可爱的钥匙扣商品，以参考图片中的IP形象为主角。设计要求：1. IP形象占据钥匙扣的主要视觉区域；2. 保持IP形象的原有特色和色彩；3. 适合小尺寸制作的简洁设计；4. 背景简洁或透明；5. 商品设计适合批量生产。原始角色描述：${prompt}` 
    },
    { 
      type: 'fridge_magnet', 
      name: '冰箱贴',
      prompt: `设计一个精美的冰箱贴商品，以参考图片中的IP形象为主角。设计要求：1. IP形象清晰可见，比例协调；2. 保持原有的可爱风格和配色方案；3. 适合方形或圆形冰箱贴的布局；4. 背景色彩温暖，与IP形象互补；5. 设计适合家庭装饰使用。原始角色描述：${prompt}` 
    },
    { 
      type: 'handbag', 
      name: '手提袋',
      prompt: `设计一个时尚的手提袋印花图案，以参考图片中的IP形象为核心元素。设计要求：1. IP形象作为主要图案元素，居中或偏上位置；2. 保持角色的识别度和吸引力；3. 配色方案适合日常使用；4. 图案大小适中，不会过于突兀；5. 整体设计具有商业美感。原始角色描述：${prompt}` 
    },
    { 
      type: 'phone_case', 
      name: '手机壳',
      prompt: `设计一个个性化手机壳图案，以参考图片中的IP形象为设计重点。设计要求：1. IP形象适配手机壳的长方形比例；2. 保持角色的特色表情和姿态；3. 背景设计不干扰摄像头区域；4. 颜色搭配年轻化，适合手机配件；5. 图案布局考虑手机握持的舒适性。原始角色描述：${prompt}` 
    }
  ];
  
  const tasks: Promise<GenerationTask>[] = [];

  for (const item of merchandiseTypes) {
    const task = createGenerationTask(
      `merchandise_${item.type}`,
      item.prompt,
      originalImageUrl,
      userId,
      batchId,
      characterId,
      supabaseClient
    );
    tasks.push(task);
  }
  
  const createdTasks = await Promise.all(tasks);

  // 后台处理任务
  createdTasks.forEach(task => {
    processImageGenerationTask(task.id);
  });

  const taskIds = createdTasks.reduce((acc, task) => {
    const type = task.task_type.replace('merchandise_', '');
    acc[type] = task.id;
    return acc;
  }, {} as Record<string, string>);
  
  return { taskIds };
};

export const generate3DModel = async (
  frontViewUrl: string,
  prompt?: string,
  userId?: string,
  leftViewUrl?: string,
  backViewUrl?: string,
  supabaseClient?: any // 可选的认证客户端
): Promise<string> => {
  const task = await createGenerationTask('3d_model', prompt || 'Generating 3D model', frontViewUrl, userId, undefined, undefined, supabaseClient);
  process3DModelTask(task.id);
  return task.id;
};

export const process3DModelTask = async (taskId: string) => {
  const task = await getGenerationTask(taskId);
  if (!task) {
     console.error(`Task ${taskId} not found for processing.`);
     return;
  }
  const { parent_character_id, prompt, original_image_url } = task;

  await updateGenerationTask(taskId, { status: 'processing' });
  try {
    
    // 3D模型生成必须在左视图和后视图全部生成完毕后才能开始
    const allTasks = parent_character_id ? await getCharacterTasks(parent_character_id) : [];
    const leftViewTask = allTasks.find(t => t.task_type === 'multi_view_left_view' && t.status === 'completed');
    const backViewTask = allTasks.find(t => t.task_type === 'multi_view_back_view' && t.status === 'completed');

    // 检查是否所有必需的视图都已完成
    if (!original_image_url) {
      throw new Error("3D建模必须提供正面视图图片");
    }
    
    if (!leftViewTask?.result_image_url) {
      throw new Error("3D建模必须等待左视图生成完成");
    }
    
    if (!backViewTask?.result_image_url) {
      throw new Error("3D建模必须等待后视图生成完成");
    }

    console.log('✅ 正面、左视图、后视图都已准备就绪，开始3D建模');
    console.log('正面图:', original_image_url);
    console.log('左视图:', leftViewTask.result_image_url);
    console.log('后视图:', backViewTask.result_image_url);

    // 将正、左、后三张图一起提交给Tripo3D API
    const modelUrl = await generate3DModelFromViews(
      original_image_url,
      leftViewTask.result_image_url,
      backViewTask.result_image_url
    );
    
    const completedTask = await updateGenerationTask(taskId, {
      status: 'completed',
      result_data: { model_url: modelUrl },
    });
    
    await updateCharacterOnTaskCompletion(completedTask);

  } catch (error) {
    console.error('3D模型生成失败:', error);
    await updateGenerationTask(taskId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : '未知3D模型生成错误',
    });
  }
};

// 批量生成所有周边商品 - 主要入口函数
export const generateAllMerchandise = async (
  characterId: string,
  originalImageUrl: string,
  characterName: string,
  characterDescription: string,
  userId: string,
  supabaseClient?: any // 可选的认证客户端
): Promise<{ batchId: string; taskIds: Record<string, string> }> => {
  // 生成一个临时的batch ID，实际使用时会由数据库生成UUID
  const batchId = uuidv4();
  const prompt = characterDescription || `IP character named ${characterName}`;
  
  try {
    // 1. 生成多视图
    const multiViewResult = await generateMultiViews(
      originalImageUrl,
      prompt,
      userId,
      batchId,
      characterId,
      supabaseClient
    );

    // 2. 生成周边商品
    const merchandiseResult = await generateMerchandise(
      originalImageUrl,
      prompt,
      userId,
      batchId,
      characterId,
      supabaseClient
    );

    // 3. 创建3D模型任务（等待多视图完成）
    const model3DTaskId = await generate3DModel(
      originalImageUrl,
      prompt,
      userId,
      undefined, // leftViewUrl - 稍后从多视图任务中获取
      undefined, // backViewUrl - 稍后从多视图任务中获取
      supabaseClient
    );
    
    // 合并所有任务ID
    const allTaskIds = {
      ...multiViewResult,
      ...merchandiseResult.taskIds,
      '3d_model': model3DTaskId
    };
    
    return {
      batchId,
      taskIds: allTaskIds
    };
  } catch (error) {
    console.error('批量生成失败:', error);
    throw error;
  }
};

// 轮询批量任务状态
export const pollBatchTasks = async (batchId: string): Promise<GenerationTask[]> => {
  try {
    const tasks = await getBatchTasks(batchId);
    return tasks;
  } catch (error) {
    console.error('轮询批量任务失败:', error);
    throw error;
  }
};

// ==================================================================
//               INTERNAL TASK PROCESSING LOGIC
// ==================================================================

// Helper to update the main character record based on task completion
const updateCharacterOnTaskCompletion = async (task: GenerationTask) => {
    if (!task.parent_character_id || (!task.result_image_url && !task.result_data?.model_url)) return;

    const characterId = task.parent_character_id;
    const updateData: Partial<UserIPCharacter> = {};

    if (task.task_type.startsWith('multi_view_')) {
        const viewType = task.task_type.replace('multi_view_', '');
        const key = `${viewType}_url` as keyof UserIPCharacter;
        (updateData as any)[key] = task.result_image_url; // Using any for dynamic keys
    } else if (task.task_type.startsWith('merchandise_')) {
        const itemType = task.task_type.replace('merchandise_', '');
        
        // Safely update JSONB field
        const { data: character, error } = await supabase
            .from('user_ip_characters')
            .select('merchandise_urls')
            .eq('id', characterId)
            .single();

        if (error) {
            console.error('Failed to fetch existing merchandise urls:', error);
            return;
        }

        const existingUrls = character?.merchandise_urls || {};
        const newUrls = { ...existingUrls, [itemType]: task.result_image_url };
        updateData.merchandise_urls = newUrls;
        
        console.log(`Updating merchandise_urls for character ${characterId}:`, {
          itemType,
          imageUrl: task.result_image_url,
          existingUrls,
          newUrls
        });
    } else if (task.task_type === '3d_model' && task.result_data?.model_url) {
        updateData.model_3d_url = task.result_data.model_url as string;
    }

    if (Object.keys(updateData).length > 0) {
        console.log(`Updating character ${characterId} with data:`, updateData);
        const { error: updateError } = await supabase
            .from('user_ip_characters')
            .update(updateData)
            .eq('id', characterId);
            
        if (updateError) {
            console.error('Failed to update character:', updateError);
        } else {
            console.log(`Successfully updated character ${characterId}`);
        }
    }
    
    // Check if all tasks for this character are done
    const allTasks = await getCharacterTasks(characterId);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const failedTasks = allTasks.filter(t => t.status === 'failed');
    const pendingOrProcessingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'processing');
    
    console.log(`Character ${characterId} task completion check:`, {
      total: allTasks.length,
      completed: completedTasks.length,
      failed: failedTasks.length,
      pendingOrProcessing: pendingOrProcessingTasks.length
    });
    
    // Mark as completed if all tasks are done (either completed or failed) and at least one completed
    if (pendingOrProcessingTasks.length === 0 && allTasks.length > 0 && completedTasks.length > 0) {
        console.log(`Marking character ${characterId} merchandise_task_status as completed`);
        const { error: updateError } = await supabase
            .from('user_ip_characters')
            .update({ merchandise_task_status: 'completed' })
            .eq('id', characterId);
            
        if (updateError) {
            console.error('Failed to update merchandise_task_status:', updateError);
        } else {
            console.log(`Successfully updated character ${characterId} status to completed`);
        }
    }
};

// Simple test function to debug the gpt-4o-image API response format
export const testAPIResponse = async () => {
  try {
    // Create a minimal test request with a small image (red square)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    // Convert to base64
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const imageBase64 = `data:image/png;base64,${base64}`;
    
    const requestBody = {
      model: AI_API_CONFIG.model, // gpt-4o-image
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "基于提供的参考图片，生成一个测试图片。要求JSON格式响应：```json\n{\"prompt\": \"test prompt\", \"ratio\": \"1:1\"}\n```"
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
    
    console.log('Testing gpt-4o-image API...');
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Test API Response Status:', response.status);
    console.log('Test API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Test API Error:', errorText);
      return { success: false, error: errorText };
    }
    
    const result = await response.json();
    console.log('Test API Raw Response:', JSON.stringify(result, null, 2));
    
    return { success: true, response: result };
  } catch (error) {
    console.error('Test API Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test API connectivity for debugging
export const testAPIConnectivity = async () => {
  const tests = [];
  
  // Test 1: Basic connectivity
  try {
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    tests.push({
      test: 'models_endpoint',
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    tests.push({
      test: 'models_endpoint',
      accessible: false,
      error: error instanceof Error ? error.message : '连接失败'
    });
  }

  // Test 2: Chat completions endpoint for gpt-4o-image
  try {
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`, {
      method: 'OPTIONS', // Use OPTIONS to test CORS/endpoint availability
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    tests.push({
      test: 'chat_completions_endpoint',
      accessible: response.ok || response.status === 405, // 405 means method not allowed but endpoint exists
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    tests.push({
      test: 'chat_completions_endpoint', 
      accessible: false,
      error: error instanceof Error ? error.message : '连接失败'
    });
  }

  return {
    endpoint: AI_API_CONFIG.baseUrl,
    apiKey: AI_API_CONFIG.apiKey ? `${AI_API_CONFIG.apiKey.substring(0, 10)}...` : 'Not set',
    tests
  };
};
