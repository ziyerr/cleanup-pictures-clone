// Tripo3D API integration for 3D model generation

const TRIPO3D_CONFIG = {
  apiKey: 'tsk_BSWrPgLgNGn1dUVsw7yJflHwmCHHY6ISUhRbYHNvIxq',
  baseUrl: 'https://api.tripo3d.ai/v2'
};

export interface Tripo3DGenerationRequest {
  type: 'text_to_model' | 'image_to_model' | 'multiview_to_model';
  file?: Blob;
  prompt?: string;
  face_limit?: number;
  texture?: boolean;
  pbr?: boolean;
}

export interface Tripo3DTask {
  task_id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  input: Record<string, unknown>;
  output?: {
    model?: string;
    rendered_image?: string;
  };
  progress: number;
  create_time: number;
}

export interface Tripo3DResponse {
  code: number;
  data: Tripo3DTask;
  message?: string;
}

// Create a new 3D model generation task
export const createTripo3DTask = async (request: Tripo3DGenerationRequest): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('type', request.type);
    
    if (request.file) {
      formData.append('file', request.file);
    }
    
    if (request.prompt) {
      formData.append('prompt', request.prompt);
    }
    
    // Optional parameters
    if (request.face_limit) {
      formData.append('face_limit', request.face_limit.toString());
    }
    
    formData.append('texture', (request.texture ?? true).toString());
    formData.append('pbr', (request.pbr ?? false).toString());

    const response = await fetch(`${TRIPO3D_CONFIG.baseUrl}/openapi/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO3D_CONFIG.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tripo3D API error: ${response.status} ${errorText}`);
    }

    const result: Tripo3DResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`Tripo3D API error: ${result.message || 'Unknown error'}`);
    }

    return result.data.task_id;
  } catch (error) {
    console.error('Tripo3D task creation failed:', error);
    throw error;
  }
};

// Get task status and result
export const getTripo3DTask = async (taskId: string): Promise<Tripo3DTask> => {
  try {
    const response = await fetch(`${TRIPO3D_CONFIG.baseUrl}/openapi/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TRIPO3D_CONFIG.apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tripo3D API error: ${response.status} ${errorText}`);
    }

    const result: Tripo3DResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`Tripo3D API error: ${result.message || 'Unknown error'}`);
    }

    return result.data;
  } catch (error) {
    console.error('Tripo3D task status check failed:', error);
    throw error;
  }
};

// Poll for task completion
export const pollTripo3DTask = async (taskId: string, maxAttempts = 120): Promise<Tripo3DTask> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      
      try {
        const task = await getTripo3DTask(taskId);
        
        if (task.status === 'success') {
          resolve(task);
          return;
        }
        
        if (task.status === 'failed') {
          reject(new Error('3D model generation failed'));
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('3D model generation timeout'));
          return;
        }
        
        // Poll every 30 seconds for 3D model generation (slower than image generation)
        setTimeout(poll, 30000);
      } catch (error) {
        reject(error);
      }
    };
    
    poll();
  });
};

// Generate 3D model from multiple views
export const generate3DModelFromViews = async (
  frontViewUrl: string,
  leftViewUrl: string,
  backViewUrl: string
): Promise<string> => {
  try {
    // Download images
    const [frontResponse, leftResponse, backResponse] = await Promise.all([
      fetch(frontViewUrl),
      fetch(leftViewUrl), 
      fetch(backViewUrl)
    ]);

    const [frontBlob, leftBlob, backBlob] = await Promise.all([
      frontResponse.blob(),
      leftResponse.blob(),
      backResponse.blob()
    ]);

    // Create multiview file (this might need to be adjusted based on Tripo3D's exact requirements)
    const formData = new FormData();
    formData.append('front', frontBlob, 'front.png');
    formData.append('left', leftBlob, 'left.png');
    formData.append('back', backBlob, 'back.png');

    // Create task
    const taskId = await createTripo3DTask({
      type: 'multiview_to_model',
      file: frontBlob, // Primary view
      texture: true,
      pbr: true,
      face_limit: 10000
    });

    // Poll for completion
    const completedTask = await pollTripo3DTask(taskId);
    
    if (!completedTask.output?.model) {
      throw new Error('No 3D model generated');
    }

    return completedTask.output.model;
  } catch (error) {
    console.error('3D model generation failed:', error);
    throw error;
  }
};

// Generate 3D model from single image
export const generate3DModelFromImage = async (imageUrl: string, prompt?: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const taskId = await createTripo3DTask({
      type: 'image_to_model',
      file: blob,
      prompt: prompt,
      texture: true,
      pbr: true,
      face_limit: 10000
    });

    const completedTask = await pollTripo3DTask(taskId);
    
    if (!completedTask.output?.model) {
      throw new Error('No 3D model generated');
    }

    return completedTask.output.model;
  } catch (error) {
    console.error('3D model generation failed:', error);
    throw error;
  }
};