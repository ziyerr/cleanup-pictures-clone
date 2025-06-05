import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface GenerationTask {
  id: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_type: 'ip_generation' | 'multi_view' | '3d_model' | 'merchandise';
  prompt: string;
  original_image_url?: string;
  result_image_url?: string;
  result_data?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface UserIPCharacter {
  id: string;
  user_id: string;
  name: string;
  main_image_url: string;
  left_view_url?: string;
  back_view_url?: string;
  model_3d_url?: string;
  merchandise_urls?: Record<string, string>;
  created_at: string;
}

// Task management functions
export const createGenerationTask = async (
  taskType: GenerationTask['task_type'],
  prompt: string,
  originalImageUrl?: string,
  userId?: string
): Promise<GenerationTask> => {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task: Partial<GenerationTask> = {
    id: taskId,
    user_id: userId,
    status: 'pending',
    task_type: taskType,
    prompt,
    original_image_url: originalImageUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('generation_tasks')
    .insert([task])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
};

export const updateGenerationTask = async (
  taskId: string,
  updates: Partial<GenerationTask>
): Promise<GenerationTask> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data;
};

export const getGenerationTask = async (taskId: string): Promise<GenerationTask | null> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Task not found
    }
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return data;
};

// Image upload function
export const uploadImageToSupabase = async (
  imageBlob: Blob,
  fileName: string,
  bucket: string = 'generated-images'
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, imageBlob, {
      contentType: imageBlob.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// User management functions
export const registerUser = async (username: string, password: string, email?: string): Promise<User> => {
  // Simple password hashing (in production, use bcrypt or similar)
  const passwordHash = btoa(password); // Base64 encoding for demo
  
  const user: Partial<User> = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username,
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('用户名已存在');
    }
    throw new Error(`注册失败: ${error.message}`);
  }

  return data;
};

export const loginUser = async (username: string, password: string): Promise<User> => {
  const passwordHash = btoa(password);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', passwordHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('用户名或密码错误');
    }
    throw new Error(`登录失败: ${error.message}`);
  }

  return data;
};

export const saveUserIPCharacter = async (
  userId: string,
  name: string,
  mainImageUrl: string
): Promise<UserIPCharacter> => {
  const character: Partial<UserIPCharacter> = {
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    name,
    main_image_url: mainImageUrl,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_ip_characters')
    .insert([character])
    .select()
    .single();

  if (error) {
    throw new Error(`保存IP形象失败: ${error.message}`);
  }

  return data;
};