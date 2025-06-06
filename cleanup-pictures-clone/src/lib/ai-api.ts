import { 
  uploadImageToSupabase,
  createGenerationTask,
  updateGenerationTask,
  getGenerationTask,
  saveUserIPCharacter 
} from './supabase';
import { generate3DModelFromImage, generate3DModelFromViews } from './tripo3d-api';

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
    result_data?: Record<string, any>;
    error_message?: string;
  };
  error?: string;
}

// API Configuration - 麻雀API
const AI_API_CONFIG = {
  apiKey: 'sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke', // 麻雀API key
  baseUrl: 'https://api.apicore.ai', // 麻雀API 基础URL
  model: 'gpt-image-1'
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

    // 构建FormData
    const formData = new FormData();
    formData.append('prompt', fullPrompt);
    formData.append('model', request.model || AI_API_CONFIG.model);
    formData.append('response_format', 'url');
    formData.append('size', '1024x1024');
    formData.append('n', '1');
    if (request.image instanceof File) {
      formData.append('image', request.image);
    } else if (request.image instanceof Blob) {
      // Handle Blob objects (from fetch responses)
      formData.append('image', request.image, 'image.png');
    } else if (typeof request.image === 'string' && request.image.startsWith('data:image/')) {
      // base64转Blob
      const arr = request.image.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      formData.append('image', blob, 'upload.png');
    } else {
      throw new Error('图片格式不支持');
    }

    // 调用麻雀API图生图
    const response = await fetch(`${AI_API_CONFIG.baseUrl}/v1/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
        // 不要手动设置Content-Type，浏览器会自动设置
      },
      body: formData
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API错误响应:', errorData);
      throw new Error(`API请求失败: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    console.log('API返回结果:', result);

    // 兼容不同返回结构，优先找url字段
    let imageUrl = undefined;
    if (result.data) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        imageUrl = result.data[0].url || result.data[0].image_url || result.data[0].imageUrl;
        // 新增：兼容b64_json
        if (!imageUrl && result.data[0].b64_json) {
          imageUrl = `data:image/png;base64,${result.data[0].b64_json}`;
        }
      } else if (typeof result.data === 'object') {
        imageUrl = result.data.url || result.data.image_url || result.data.imageUrl;
        if (!imageUrl && result.data.b64_json) {
          imageUrl = `data:image/png;base64,${result.data.b64_json}`;
        }
      }
    } else if (result.url || result.image_url || result.imageUrl) {
      imageUrl = result.url || result.image_url || result.imageUrl;
    }

    if (imageUrl) {
      return {
        success: true,
        data: {
          url: imageUrl,
          id: `generated-${Date.now()}`
        }
      };
    }

    throw new Error('未生成任何图片，API原始返回：' + JSON.stringify(result));

  } catch (error) {
    console.error('AI API 错误详情:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

// Helper function to validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '请上传图片文件' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: '图片文件大小不能超过10MB' };
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: '支持的图片格式：JPEG, PNG, WebP' };
  }

  return { valid: true };
};

// Multi-view generation (left and back views)
export const generateMultiViews = async (originalImageUrl: string, prompt: string, userId?: string): Promise<{ leftViewTaskId: string; backViewTaskId: string }> => {
  const leftViewTask = await createGenerationTask('multi_view', `左视图: ${prompt}`, originalImageUrl, userId);
  const backViewTask = await createGenerationTask('multi_view', `后视图: ${prompt}`, originalImageUrl, userId);

  processGenerationTask(leftViewTask.id, { image: originalImageUrl, prompt: `生成左视图: ${prompt}` });
  processGenerationTask(backViewTask.id, { image: originalImageUrl, prompt: `生成后视图: ${prompt}` });

  return { leftViewTaskId: leftViewTask.id, backViewTaskId: backViewTask.id };
};

// Merchandise generation
export const generateMerchandise = async (
  originalImageUrl: string,
  prompt: string,
  userId?: string
): Promise<{ taskIds: Record<string, string> }> => {
  const merchandiseTypes = {
    tshirt: 'T恤',
    mug: '马克杯',
    phoneCase: '手机壳'
  };

  const taskIds: Record<string, string> = {};

  for (const [type, name] of Object.entries(merchandiseTypes)) {
    const task = await createGenerationTask('merchandise', `周边商品 ${name}: ${prompt}`, originalImageUrl, userId);
    processGenerationTask(task.id, { image: originalImageUrl, prompt: `将IP形象应用到${name}上: ${prompt}` });
    taskIds[type] = task.id;
  }

  return { taskIds };
};

// Generate 3D model from IP character views
export const generate3DModel = async (
  frontViewUrl: string,
  leftViewUrl?: string,
  backViewUrl?: string,
  prompt?: string,
  userId?: string
): Promise<string> => {
    const modelTask = await createGenerationTask('3d_model', prompt || '3D模型生成', frontViewUrl, userId);

    // This is a simplified flow. The actual 3D model generation is a complex async process.
    // We trigger a background task here.
    process3DModelTask(modelTask.id, frontViewUrl, leftViewUrl, backViewUrl, prompt);

    return modelTask.id;
};

// This would be the background processor for the 3D model task.
const process3DModelTask = async (
  taskId: string,
  frontViewUrl: string,
  leftViewUrl?: string,
  backViewUrl?: string,
  prompt?: string
) => {
  try {
    await updateGenerationTask(taskId, { status: 'processing' });

    let modelUrl: string;

    // Here you would integrate with a real 3D generation service like Tripo3D
    if (leftViewUrl && backViewUrl) {
      console.log('Generating 3D model from three views...');
      modelUrl = await generate3DModelFromViews(frontViewUrl, leftViewUrl, backViewUrl);
    } else {
      console.log('Generating 3D model from a single image...');
      modelUrl = await generate3DModelFromImage(frontViewUrl, prompt);
    }

    await updateGenerationTask(taskId, {
      status: 'completed',
      result_data: { model_url: modelUrl }
    });
  } catch (error) {
    console.error('3D model generation failed:', error);
    await updateGenerationTask(taskId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : '3D模型生成失败'
    });
  }
};
