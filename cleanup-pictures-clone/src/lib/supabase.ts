import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface GenerationTask {
  id: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_type: string;
  prompt: string;
  original_image_url?: string;
  result_image_url?: string;
  result_data?: Record<string, unknown>;
  error_message?: string;
  batch_id?: string;
  parent_character_id?: string;
  created_at: string;
  updated_at: string;
}



export interface UserIPCharacter {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  main_image_url: string;
  left_view_url?: string;
  back_view_url?: string;
  model_3d_url?: string;
  merchandise_urls?: Record<string, string>;
  merchandise_task_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  created_at: string;
}

// Task management functions
export const createGenerationTask = async (
  taskType: GenerationTask['task_type'],
  prompt: string,
  originalImageUrl?: string,
  userId?: string,
  batchId?: string,
  parentCharacterId?: string
): Promise<GenerationTask> => {
  const task: Partial<GenerationTask> = {
    user_id: userId,
    status: 'pending',
    task_type: taskType,
    prompt,
    original_image_url: originalImageUrl,
    batch_id: batchId,
    parent_character_id: parentCharacterId,
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

// 批量获取任务状态
export const getBatchTasks = async (batchId: string): Promise<GenerationTask[]> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get batch tasks: ${error.message}`);
  }

  return data || [];
};

// 获取角色相关的所有任务
export const getCharacterTasks = async (characterId: string): Promise<GenerationTask[]> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('parent_character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get character tasks: ${error.message}`);
  }

  return data || [];
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
  bucket = 'generated-images'
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

// Enhanced User interface for Supabase Auth
export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  user_metadata?: {
    username?: string;
  };
  created_at: string;
}

// User management functions using Supabase Auth
export const registerUser = async (username: string, password: string, email?: string): Promise<AuthUser> => {
  try {
    console.log('开始用户注册:', { username, email: email ? '[PROVIDED]' : '[NOT PROVIDED]' });
    
    // Use email or generate a unique email for username-only registration
    const userEmail = email || `${username}@temp.local`;
    
    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password: password,
      options: {
        data: {
          username: username,
        }
      }
    });

    console.log('Supabase Auth 注册响应:', { 
      user: data.user ? { id: data.user.id, email: data.user.email } : null, 
      error 
    });

    if (error) {
      console.error('用户注册错误详情:', error);
      if (error.message.includes('already registered')) {
        throw new Error('用户已存在');
      }
      throw new Error(`注册失败: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('注册失败: 未返回用户数据');
    }

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      username: username,
      user_metadata: data.user.user_metadata,
      created_at: data.user.created_at || new Date().toISOString(),
    };

    console.log('用户注册成功:', { id: authUser.id, username: authUser.username });
    return authUser;
  } catch (err) {
    console.error('registerUser 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`注册失败: ${String(err)}`);
  }
};

export const loginUser = async (username: string, password: string): Promise<AuthUser> => {
  try {
    console.log('开始用户登录:', { username });
    
    // Try to login with username as email first
    let email = username;
    
    // If username doesn't contain @, try with temp email format
    if (!username.includes('@')) {
      email = `${username}@temp.local`;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('登录错误详情:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('用户名或密码错误');
      }
      throw new Error(`登录失败: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('登录失败: 未返回用户数据');
    }

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username || username,
      user_metadata: data.user.user_metadata,
      created_at: data.user.created_at || new Date().toISOString(),
    };

    console.log('用户登录成功:', { id: authUser.id, username: authUser.username });
    return authUser;
  } catch (err) {
    console.error('loginUser 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`登录失败: ${String(err)}`);
  }
};

// Get current authenticated user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('获取当前用户错误:', error);
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username,
      user_metadata: user.user_metadata,
      created_at: user.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('getCurrentUser 捕获错误:', err);
    return null;
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('登出错误:', error);
      throw new Error(`登出失败: ${error.message}`);
    }
    console.log('用户登出成功');
  } catch (err) {
    console.error('logoutUser 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`登出失败: ${String(err)}`);
  }
};

export const saveUserIPCharacter = async (
  userId: string,
  name: string,
  mainImageUrl: string
): Promise<UserIPCharacter> => {
  try {
    console.log('开始保存IP形象:', { userId, name, mainImageUrl });
    
    const character: Partial<UserIPCharacter> = {
      user_id: userId,
      name,
      main_image_url: mainImageUrl,
    };

    console.log('准备插入的数据:', character);

    const { data, error } = await supabase
      .from('user_ip_characters')
      .insert([character])
      .select()
      .single();

    console.log('Supabase响应:', { data, error });

    if (error) {
      console.error('Supabase错误详情:', error);
      throw new Error(`保存IP形象失败: ${error.message} (code: ${error.code})`);
    }

    if (!data) {
      throw new Error('保存IP形象失败: 未返回数据');
    }

    console.log('IP形象保存成功:', data);
    return data;
  } catch (err) {
    console.error('saveUserIPCharacter 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`保存IP形象失败: ${String(err)}`);
  }
};

export const getIPCharacterWithStatus = async (ipId: string) => {
  // 1. Fetch the IP character
  const { data: character, error: charError } = await supabase
    .from('user_ip_characters')
    .select('*')
    .eq('id', ipId)
    .single();

  if (charError) {
    if (charError.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch IP character: ${charError.message}`);
  }
  if (!character) return null;

  // 2. Find the original generation task using a partial match on the URL path
  let initialTask = null;
  try {
    const urlParts = new URL(character.main_image_url);
    const imagePath = urlParts.pathname.split('/').slice(4).join('/'); // Extracts path after /public/bucket-name/
    
    const { data, error } = await supabase
      .from('generation_tasks')
      .select('id, status')
      .like('result_image_url', `%${imagePath}`)
      .eq('task_type', 'ip_generation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    initialTask = data;
  } catch (e) {
    console.error("Error fetching initial task by URL, possibly invalid URL:", e);
  }


  // 3. Find the latest ongoing merchandise task for this character
  const { data: merchandiseTask, error: merchTaskError } = await supabase
    .from('generation_tasks')
    .select('id, status, task_type')
    .eq('prompt', character.id)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (merchTaskError && merchTaskError.code !== 'PGRST116') {
    console.error('Error fetching merchandise task:', merchTaskError);
  }

  return {
    ...character,
    initial_task_status: initialTask?.status || 'completed',
    merchandise_task_status: merchandiseTask?.status || null,
  };
};

export const getUserIPCharacters = async (userId: string): Promise<UserIPCharacter[]> => {
  try {
    console.log(`正在为用户 ${userId} 获取IP形象列表`);
    
    const { data, error } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户IP形象列表失败:', error);
      throw new Error(`获取IP形象列表失败: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('getUserIPCharacters 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`获取IP形象列表失败: ${String(err)}`);
  }
};

export const updateUserIPCharacterName = async (ipId: string, newName: string, userId: string): Promise<UserIPCharacter> => {
  try {
    console.log(`正在为用户 ${userId} 更新IP ${ipId} 的名称为 "${newName}"`);

    const { data, error } = await supabase
      .from('user_ip_characters')
      .update({ name: newName })
      .eq('id', ipId)
      .eq('user_id', userId) // Ensure user can only update their own IP
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for no rows found
        throw new Error('IP形象不存在或用户无权修改');
      }
      console.error('更新IP名称失败:', error);
      throw new Error(`更新IP名称失败: ${error.message}`);
    }

    console.log(`成功更新IP名称`);
    return data;
  } catch (err) {
    console.error('updateUserIPCharacterName 捕获错误:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`更新IP名称失败: ${String(err)}`);
  }
};