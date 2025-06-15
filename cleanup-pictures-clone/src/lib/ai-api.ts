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

// API Configuration - APICore配置
const AI_API_CONFIG = {
  apiKey: process.env.AI_API_KEY || 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
  baseUrl: process.env.AI_API_BASE_URL || 'https://ismaque.org/v1',
  model: process.env.AI_API_MODEL || 'gpt-image-1',
  endpoint: '/images/edits'
};

// Alternative API configurations for testing
const ALTERNATIVE_CONFIGS = {
  sparrow: {
    apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
    baseUrl: 'https://api.sparrow.org/v1',  // Alternative base URL
    endpoint: '/images/generations',         // Alternative endpoint
    model: 'gpt-image-1'
  },
  sparrow2: {
    apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke',
    baseUrl: 'https://ismaque.org',          // Without /v1
    endpoint: '/api/v1/images/edits',        // Alternative path
    model: 'gpt-image-1'
  }
};

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
const compressImage = async (file: File, maxSizeKB: number = 5120): Promise<File | Blob> => {
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

      // Save the character to the database if a user ID is provided
      if (request.userId) {
        try {
          // The name could be derived from the prompt or be a default
          const characterName = request.prompt.substring(0, 20) || '新IP形象';
          await saveUserIPCharacter(request.userId, characterName, finalImageUrl);
          console.log(`IP Character saved for user ${request.userId}`);
        } catch (saveError) {
            console.error('保存用户IP形象失败:', saveError);
            // Decide if this should fail the whole task. For now, we'll log it and continue.
        }
      }

      await updateGenerationTask(taskId, {
        status: 'completed',
        result_image_url: finalImageUrl
      });
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
export const generateIPCharacter = async (request: AIGenerationRequest): Promise<AIGenerationResponse> => {
  try {
    console.log('开始AI生成请求:', request);

    // 构建基于用户提示的描述
    const fullPrompt = `创建一个可爱的卡通IP形象，${request.prompt}。要求：1. 卡通风格，适合制作周边产品；2. 简洁明了的设计；3. 温暖友好的表情；4. 适合商业应用的形象设计`;

    console.log('完整提示词:', fullPrompt);

    // 优化图片处理逻辑
    let imageToUpload: File | Blob | undefined;
    
    if (typeof request.image === 'string') {
      if (request.image.startsWith('data:')) {
        // Base64 string
        const blob = await (await fetch(request.image)).blob();
        imageToUpload = blob;
      } else {
        // URL
        const response = await fetch(request.image);
        const blob = await response.blob();
        imageToUpload = blob;
      }
    } else {
      // File or Blob - 应用智能压缩
      if (request.image instanceof File) {
        // 对文件进行智能压缩，保持最大精度
        imageToUpload = await compressImage(request.image, 5120); // 5MB压缩目标
      } else {
        imageToUpload = request.image;
      }
    }

    // 根据APICore文档构建FormData - 使用图片编辑端点
    const formData = new FormData();
    formData.append('prompt', fullPrompt);
    formData.append('model', request.model || AI_API_CONFIG.model);
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'url');

    // 图片编辑API需要image参数（必需）
    if (imageToUpload) {
      formData.append('image', imageToUpload, 'image.png');
    } else {
      throw new Error('图片编辑API需要提供图片文件');
    }

    console.log('发送API请求到:', `${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`);
    console.log('请求参数检查:', {
      prompt: fullPrompt.substring(0, 100) + '...',
      model: request.model || AI_API_CONFIG.model,
      hasImage: !!imageToUpload,
      imageSize: imageToUpload ? imageToUpload.size : 0
    });

    // 优化的fetch请求 - 增加超时和错误处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('请求超时，中止连接');
      controller.abort();
    }, 120000); // 120秒超时
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}${AI_API_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        // 不设置Content-Type，让浏览器自动设置multipart/form-data
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI生成失败 - Status:', response.status);
      console.error('AI生成失败 - Response:', errorText);
      
      // 根据状态码提供更具体的错误信息
      if (response.status === 413) {
        throw new Error('图片文件过大，请选择更小的图片');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后重试');
      } else if (response.status === 503) {
        // 特殊处理503错误，提供更具体的信息
        if (errorText.includes('均无可用渠道')) {
          throw new Error('AI图像生成服务暂时维护中，请稍后重试或联系客服');
        } else {
          throw new Error('图像生成服务暂时不可用，请稍后重试');
        }
      } else if (response.status >= 500) {
        throw new Error('服务器暂时不可用，请稍后重试');
      } else {
        throw new Error('图片生成失败，请检查图片格式后重试');
      }
    }

    const result = await response.json();
    console.log('AI API响应成功，数据长度:', JSON.stringify(result).length);
    console.log('API完整响应结构:', result);

    // Check if the response is empty or null
    if (!result || typeof result !== 'object') {
      console.error('API返回了空响应或非对象响应:', result);
      throw new Error('服务器响应格式异常');
    }

    // Handle different possible response formats
    let imageUrl: string | undefined;
    let imageId: string | undefined;

    // 添加详细的调试信息
    console.log('响应字段检查:', {
      hasData: !!result.data,
      dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
      firstItem: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : 'no first item'
    });

    // Check for base64 data in response FIRST (优先检查base64格式)
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const firstItem = result.data[0];
      console.log('第一个数据项:', firstItem);
      console.log('数据项字段:', Object.keys(firstItem));
      
      // Check for base64 data first
      if (firstItem.b64_json) {
        const base64Data = firstItem.b64_json;
        imageUrl = `data:image/png;base64,${base64Data}`;
        imageId = firstItem.id || firstItem.image_id || uuidv4();
        console.log('从base64数据提取:', { hasBase64: !!base64Data, base64Length: base64Data.length, imageId });
      }
      // Fallback to URL fields
      else if (firstItem.url || firstItem.image_url || firstItem.image) {
        imageUrl = firstItem.url || firstItem.image_url || firstItem.image;
        imageId = firstItem.id || firstItem.image_id;
        console.log('从data数组URL字段提取:', { imageUrl, imageId });
      }
    }
    // Check for direct URL response
    else if (result.url) {
      imageUrl = result.url;
      imageId = result.id;
      console.log('从直接字段提取:', { imageUrl, imageId });
    }
    // Check for image field
    else if (result.image) {
      imageUrl = result.image;
      imageId = result.id;
      console.log('从image字段提取:', { imageUrl, imageId });
    }
    // Check for images array
    else if (result.images && Array.isArray(result.images) && result.images.length > 0) {
      imageUrl = result.images[0].url || result.images[0];
      imageId = result.images[0].id;
      console.log('从images数组提取:', { imageUrl, imageId });
    }

    if (!imageUrl) {
      console.error('无法从API响应中提取图片URL');
      console.error('响应结构:', Object.keys(result));
      console.error('完整响应数据:', JSON.stringify(result, null, 2));
      throw new Error('图片生成完成但无法获取结果');
    }

    console.log('最终提取的图片信息:', { imageUrl: imageUrl.substring(0, 100) + '...', imageId });

    return {
      success: true,
      data: {
        url: imageUrl,
        id: imageId || uuidv4()
      }
    };
  } catch (error) {
    console.error('generateIPCharacter错误:', error);
    
    // 简化错误处理，用户友好的错误信息
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '请求超时，请检查网络连接后重试'
        };
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: '网络连接中断，请稍后重试'
        };
      }
      if (error.message.includes('CONNECTION_RESET')) {
        return {
          success: false,
          error: '连接被重置，请检查图片大小后重试'
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片生成失败，请稍后重试'
    };
  }
};

// Helper to call Sparrow API for various tasks
async function triggerSparrowGeneration(prompt: string, imageUrl?: string) {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('model', AI_API_CONFIG.model);
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  formData.append('response_format', 'url');
  
  // 确保周边商品生成必须使用基础IP形象图作为输入
  if (imageUrl) {
    try {
      console.log('正在获取基础IP形象图:', imageUrl);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      formData.append('image', blob, 'image.png');
      console.log('✅ 基础IP形象图已添加到生成请求');
    } catch (error) {
      console.error('❌ 无法获取基础IP形象图:', error);
      throw new Error(`无法获取基础IP形象图: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  } else {
    // 2D周边图生成必须同时使用基础IP形象图和特定的周边商品提示词
    throw new Error('2D周边图生成必须提供基础IP形象图作为输入');
  }

  console.log('发送周边商品生成请求，提示词:', prompt);
  const response = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Sparrow API error: ${response.statusText}`, errorBody);
    throw new Error(`Failed to generate image for prompt: ${prompt}`);
  }
  
  const data = await response.json();
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error('API返回的数据格式无效');
  }
  
  // 提取生成的图片URL，与首页IP形象生成方式一致
  const resultData = data.data[0];
  if (resultData.b64_json) {
    return `data:image/png;base64,${resultData.b64_json}`;
  } else if (resultData.url) {
    return resultData.url;
  } else {
    throw new Error('无法从API响应中提取图片URL');
  }
}

// 生成多视图 - 增强版本，支持批量ID和字符关联
export const generateMultiViews = async (
  originalImageUrl: string,
  prompt: string,
  userId?: string,
  batchId?: string,
  characterId?: string
): Promise<{ leftViewTaskId?: string; backViewTaskId?: string }> => {
  const views = [
    {
      type: 'left',
      prompt: `生成参考图片中IP角色的左侧视图。要求：1. 保持与正面图完全一致的角色特征、服装和配色；2. 展示角色的左侧轮廓，包括侧面的发型、服装细节；3. 保持相同的艺术风格和比例；4. 背景保持简洁或透明；5. 角色姿态自然，适合3D建模使用。原始角色描述：${prompt}`
    },
    {
      type: 'back',
      prompt: `生成参考图片中IP角色的背面视图。要求：1. 保持与正面图完全一致的角色特征、服装和配色；2. 展示角色的背部轮廓，包括后脑勺、服装背面设计；3. 保持相同的艺术风格和比例；4. 背景保持简洁或透明；5. 角色姿态自然，与正面图协调一致。原始角色描述：${prompt}`
    }
  ];
  
  const tasks: Promise<GenerationTask>[] = [];

  for (const view of views) {
    const task = createGenerationTask(`multi_view_${view.type}`, view.prompt, originalImageUrl, userId, batchId, characterId);
    tasks.push(task);
  }
  
  const createdTasks = await Promise.all(tasks);
  
  // 后台处理任务
  createdTasks.forEach(task => {
    processImageGenerationTask(task.id);
  });

  return createdTasks.reduce((acc, task) => {
    const view = task.task_type.replace('multi_view_', '');
    if (view === 'left') {
      acc.leftViewTaskId = task.id;
    } else if (view === 'back') {
      acc.backViewTaskId = task.id;
    }
    return acc;
  }, {} as { leftViewTaskId?: string; backViewTaskId?: string });
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
  characterId?: string
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
      characterId
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
): Promise<string> => {
  const task = await createGenerationTask('3d_model', prompt || 'Generating 3D model', frontViewUrl, userId);
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
    const leftViewTask = allTasks.find(t => t.task_type === 'multi_view_left' && t.status === 'completed');
    const backViewTask = allTasks.find(t => t.task_type === 'multi_view_back' && t.status === 'completed');

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
  userId: string
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
      characterId
    );
    
    // 2. 生成周边商品
    const merchandiseResult = await generateMerchandise(
      originalImageUrl,
      prompt,
      userId,
      batchId,
      characterId
    );
    
    // 3. 创建3D模型任务（等待多视图完成）
    const model3DTaskId = await generate3DModel(
      originalImageUrl,
      prompt,
      userId,
      undefined, // leftViewUrl - 稍后从多视图任务中获取
      undefined  // backViewUrl - 稍后从多视图任务中获取
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
    } else if (task.task_type === '3d_model' && task.result_data?.model_url) {
        updateData.model_3d_url = task.result_data.model_url as string;
    }

    if (Object.keys(updateData).length > 0) {
        await supabase
            .from('user_ip_characters')
            .update(updateData)
            .eq('id', characterId);
    }
    
    // Check if all tasks for this character are done
    const allTasks = await getCharacterTasks(characterId);
    const allCompleted = allTasks.every(t => t.status === 'completed');
    if (allCompleted && allTasks.length > 0) {
        await supabase
            .from('user_ip_characters')
            .update({ merchandise_task_status: 'completed' })
            .eq('id', characterId);
    }
};

// Simple test function to debug the API response format
export const testAPIResponse = async () => {
  try {
    // Create a minimal test request with a small image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    const formData = new FormData();
    formData.append('prompt', 'test prompt');
    formData.append('image', blob, 'test.png');
    formData.append('model', AI_API_CONFIG.model);
    formData.append('response_format', 'url');
    formData.append('size', '1024x1024');
    formData.append('n', '1');
    
    console.log('Testing API with minimal request...');
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
      },
      body: formData
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
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
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

  // Test 2: Image editing endpoint
  try {
    // Create a minimal test request
    const testFormData = new FormData();
    testFormData.append('prompt', 'test');
    
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/images/edits`, {
      method: 'OPTIONS', // Use OPTIONS to test CORS/endpoint availability
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
      }
    });
    
    tests.push({
      test: 'images_edits_endpoint',
      accessible: response.ok || response.status === 405, // 405 means method not allowed but endpoint exists
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    tests.push({
      test: 'images_edits_endpoint', 
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
