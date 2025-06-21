import { createClient } from '@supabase/supabase-js';
import { UserSubscription, UsageQuota, SubscriptionPlan } from './creem-config';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // 启用会话持久化
    storageKey: 'cleanup-pictures-auth', // 自定义存储键
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // 使用localStorage
    flowType: 'pkce' // 使用PKCE流程，更安全
  },
  global: {
    fetch: (url, options = {}) => {
      console.log('Supabase fetch:', url);
      return fetch(url, {
        ...options,
        // 添加超时和重试机制
        signal: AbortSignal.timeout(10000), // 10秒超时
      }).catch(error => {
        console.error('Supabase fetch error:', error);
        throw error;
      });
    }
  }
});

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

export interface AuthUser {
  id: string;
  email?: string | null;
  username: string;
  user_metadata?: Record<string, any>;
  created_at: string;
}

// Task management functions
export const createGenerationTask = async (
  taskType: GenerationTask['task_type'],
  prompt: string,
  originalImageUrl?: string,
  userId?: string,
  batchId?: string,
  parentCharacterId?: string,
  supabaseClient?: any // 可选的认证客户端
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

  // 使用传入的客户端或默认客户端
  const client = supabaseClient || supabase;
  const { data, error } = await client
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

export const getBatchTasks = async (batchId: string): Promise<GenerationTask[]> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('batch_id', batchId);

  if (error) {
    throw new Error(`Failed to get batch tasks: ${error.message}`);
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
      return null; // No rows found
    }
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return data;
};

export const getUserTasks = async (userId: string): Promise<GenerationTask[]> => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user tasks: ${error.message}`);
  }

  return data || [];
};

// IP Character management functions
export const saveUserIPCharacter = async (
  userId: string,
  name: string,
  mainImageUrl: string,
  description?: string
): Promise<UserIPCharacter> => {
  try {
    console.log('保存IP形象:', { userId, name, mainImageUrl });
    
    // 检查当前认证状态
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('当前认证用户:', user?.id, '目标用户:', userId);
    
    if (authError) {
      console.error('认证检查失败:', authError);
      throw new Error(`认证失败: ${authError.message}`);
    }
    
    if (!user) {
      console.error('用户未认证');
      throw new Error('用户未认证，请先登录');
    }
    
    if (user.id !== userId) {
      console.error('用户ID不匹配:', { authUserId: user.id, requestUserId: userId });
      throw new Error('用户ID不匹配');
    }

    const character: Partial<UserIPCharacter> = {
      user_id: userId,
      name,
      main_image_url: mainImageUrl,
      description,
    };

    console.log('准备插入数据:', character);

    const { data, error } = await supabase
      .from('user_ip_characters')
      .insert([character])
      .select()
      .single();

    if (error) {
      console.error('插入数据失败:', error);
      throw new Error(`保存IP形象失败: ${error.message}`);
    }

    console.log('IP形象保存成功:', data);
    return data;
  } catch (error) {
    console.error('saveUserIPCharacter 错误:', error);
    throw error;
  }
};

export const getUserIPCharacters = async (userId: string, retryCount = 0): Promise<UserIPCharacter[]> => {
  try {
    console.log(`正在为用户 ${userId} 获取IP形象列表 (尝试 ${retryCount + 1})`);
    
    // 检查当前认证状态
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('当前认证用户:', user?.id, '目标用户:', userId);
    
    if (authError) {
      console.error('认证检查失败:', authError);
      
      // 网络错误重试
      if (authError.message?.includes('Failed to fetch') && retryCount < 3) {
        console.log(`网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getUserIPCharacters(userId, retryCount + 1);
      }
      
      throw new Error(`认证失败: ${authError.message}`);
    }
    
    if (!user) {
      console.error('用户未认证');
      throw new Error('用户未认证，请先登录');
    }
    
    if (user.id !== userId) {
      console.error('用户ID不匹配:', { authUserId: user.id, requestUserId: userId });
      throw new Error('用户ID不匹配');
    }
    
    const { data, error } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // 网络错误重试
      if (error.message?.includes('Failed to fetch') && retryCount < 3) {
        console.log(`数据库查询网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getUserIPCharacters(userId, retryCount + 1);
      }
      
      throw new Error(`获取IP列表失败: ${error.message}`);
    }

    console.log(`从数据库获取到 ${data?.length || 0} 个IP形象`);
    return data || [];
  } catch (err) {
    console.error('getUserIPCharacters 捕获错误:', err);
    
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('获取IP列表失败: 未知错误');
  }
};

export const getIPCharacterWithStatus = async (ipId: string, retryCount = 0) => {
  try {
    console.log(`获取IP形象状态: ${ipId} (尝试 ${retryCount + 1})`);
    
    // 检查当前认证状态
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('当前认证用户:', user?.id);
    
    if (authError) {
      console.error('认证检查失败:', authError);
      
      // 网络错误重试
      if (authError.message?.includes('Failed to fetch') && retryCount < 3) {
        console.log(`认证网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getIPCharacterWithStatus(ipId, retryCount + 1);
      }
      
      throw new Error(`认证失败: ${authError.message}`);
    }
    
    if (!user) {
      console.error('用户未认证');
      throw new Error('用户未认证，请先登录');
    }
    
    const { data, error } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', ipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('IP形象不存在:', ipId);
        return null; // No rows found
      }
      
      // 网络错误重试
      if (error.message?.includes('Failed to fetch') && retryCount < 3) {
        console.log(`获取IP形象网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getIPCharacterWithStatus(ipId, retryCount + 1);
      }
      
      console.error('获取IP形象失败:', error);
      throw new Error(`获取IP形象失败: ${error.message}`);
    }
    
    // 验证用户是否有权访问这个IP
    if (data.user_id !== user.id) {
      console.error('用户无权访问此IP:', { ipUserId: data.user_id, currentUserId: user.id });
      throw new Error('无权访问此IP形象');
    }

    console.log('成功获取IP形象状态:', {
      id: data.id,
      name: data.name,
      merchandise_task_status: data.merchandise_task_status,
      merchandise_urls: data.merchandise_urls,
      merchandise_count: data.merchandise_urls ? Object.keys(data.merchandise_urls).length : 0
    });
    
    return {
      ...data,
      initial_task_status: 'completed',
      merchandise_task_status: data.merchandise_task_status || null,
    };
  } catch (error) {
    console.error('获取IP形象状态失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
};

export const updateIPCharacter = async (
  ipId: string,
  updates: Partial<UserIPCharacter>
): Promise<UserIPCharacter> => {
  const { data, error } = await supabase
    .from('user_ip_characters')
    .update(updates)
    .eq('id', ipId)
    .select()
    .single();

  if (error) {
    throw new Error(`更新IP形象失败: ${error.message}`);
  }

  return data;
};

export const deleteIPCharacter = async (ipId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_ip_characters')
    .delete()
    .eq('id', ipId);

  if (error) {
    throw new Error(`删除IP形象失败: ${error.message}`);
  }
};

// User management - now only used for getting current user info
export const getCurrentUser = (): AuthUser | null => {
  // This function is no longer used with Supabase auth
  // User info comes from Supabase session in UserContext
  return null;
};

// Batch operations
export const retryGenerationTask = async (taskId: string): Promise<GenerationTask> => {
  return updateGenerationTask(taskId, {
    status: 'pending',
    error_message: undefined,
    updated_at: new Date().toISOString(),
  });
};

export const generateMerchandiseForCharacter = async (
  characterId: string,
  userId: string
): Promise<string> => {
  // Create a batch for merchandise generation
  const batchId = `merchandise_${Date.now()}`;
  
  const merchandiseTypes = [
    'phone_case',
    'keychain', 
    'blind_box',
    'chat_sticker'
  ];

  // Create tasks for each merchandise type
  const tasks = await Promise.all(
    merchandiseTypes.map(type =>
      createGenerationTask(
        'merchandise_generation',
        `Generate ${type} design`,
        undefined,
        userId,
        batchId,
        characterId
      )
    )
  );

  console.log(`Created ${tasks.length} merchandise generation tasks for character ${characterId}`);
  return batchId;
};

// Image upload function for Supabase Storage
export const uploadImageToSupabase = async (
  file: File | Blob,
  fileName: string,
  bucket: string = 'generated-images'
): Promise<string> => {
  try {
    console.log(`正在上传图片到Supabase Storage: ${fileName}`);
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('上传到Supabase Storage失败:', error);
      throw new Error(`图片上传失败: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    console.log(`图片上传成功，URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('uploadImageToSupabase 错误:', error);
    throw error instanceof Error ? error : new Error('图片上传失败');
  }
};

// Get tasks for a specific character
export const getCharacterTasks = async (characterId: string, retryCount = 0): Promise<GenerationTask[]> => {
  try {
    console.log(`正在获取角色 ${characterId} 的相关任务 (尝试 ${retryCount + 1})`);
    
    const { data, error } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('parent_character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      // 网络错误重试
      if (error.message?.includes('Failed to fetch') && retryCount < 3) {
        console.log(`获取任务网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getCharacterTasks(characterId, retryCount + 1);
      }
      
      throw new Error(`获取角色任务失败: ${error.message}`);
    }

    console.log(`找到 ${data?.length || 0} 个相关任务`);
    return data || [];
  } catch (error) {
    console.error('getCharacterTasks 错误:', error);
    throw error instanceof Error ? error : new Error('获取角色任务失败');
  }
};

// ============================================
// Subscription Management Functions
// ============================================

// Create user subscription
export const createUserSubscription = async (
  userId: string,
  plan: SubscriptionPlan,
  creemSubscriptionId?: string,
  creemCustomerId?: string
): Promise<UserSubscription> => {
  try {
    console.log('创建用户订阅:', { userId, plan, creemSubscriptionId });
    
    const subscription: Partial<UserSubscription> = {
      user_id: userId,
      plan,
      creem_subscription_id: creemSubscriptionId,
      creem_customer_id: creemCustomerId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) {
      throw new Error(`创建订阅失败: ${error.message}`);
    }

    // Create initial quota for the user
    await createUserQuota(userId, data.id, plan);

    console.log('订阅创建成功:', data);
    return data;
  } catch (error) {
    console.error('createUserSubscription 错误:', error);
    throw error instanceof Error ? error : new Error('创建订阅失败');
  }
};

// Get user subscription
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    console.log(`正在获取用户 ${userId} 的订阅信息`);
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('用户无活跃订阅');
        return null;
      }
      throw new Error(`获取订阅失败: ${error.message}`);
    }

    console.log('获取订阅成功:', data);
    return data;
  } catch (error) {
    console.error('getUserSubscription 错误:', error);
    return null;
  }
};

// Update user subscription
export const updateUserSubscription = async (
  subscriptionId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新订阅失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('updateUserSubscription 错误:', error);
    throw error instanceof Error ? error : new Error('更新订阅失败');
  }
};

// Create user quota
export const createUserQuota = async (
  userId: string,
  subscriptionId: string,
  plan: SubscriptionPlan
): Promise<UsageQuota> => {
  try {
    console.log('创建用户配额:', { userId, subscriptionId, plan });

    // Set limits based on plan
    let limits = {
      ip_characters_limit: 2,
      merchandise_daily_limit: 2,
      merchandise_monthly_limit: 2,
      models_monthly_limit: 1,
    };

    if (plan === 'personal') {
      limits = {
        ip_characters_limit: 10,
        merchandise_daily_limit: 100, // No daily limit for paid plans
        merchandise_monthly_limit: 100,
        models_monthly_limit: 10,
      };
    } else if (plan === 'team') {
      limits = {
        ip_characters_limit: 100,
        merchandise_daily_limit: 1000, // No daily limit for paid plans
        merchandise_monthly_limit: 1000,
        models_monthly_limit: 50,
      };
    }

    const quota: Partial<UsageQuota> = {
      user_id: userId,
      subscription_id: subscriptionId,
      ip_characters_used: 0,
      merchandise_daily_used: 0,
      merchandise_monthly_used: 0,
      models_monthly_used: 0,
      ...limits,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daily_reset_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('user_quotas')
      .insert([quota])
      .select()
      .single();

    if (error) {
      throw new Error(`创建配额失败: ${error.message}`);
    }

    console.log('配额创建成功:', data);
    return data;
  } catch (error) {
    console.error('createUserQuota 错误:', error);
    throw error instanceof Error ? error : new Error('创建配额失败');
  }
};

// Get user quota
export const getUserQuota = async (userId: string): Promise<UsageQuota | null> => {
  try {
    console.log(`正在获取用户 ${userId} 的配额信息`);
    
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('用户无配额记录，创建默认免费配额');
        // Create default free quota
        const subscription = await createUserSubscription(userId, 'free');
        return await getUserQuota(userId);
      }
      throw new Error(`获取配额失败: ${error.message}`);
    }

    console.log('获取配额成功:', data);
    return data;
  } catch (error) {
    console.error('getUserQuota 错误:', error);
    return null;
  }
};

// Update user quota
export const updateUserQuota = async (
  quotaId: string,
  updates: Partial<UsageQuota>
): Promise<UsageQuota> => {
  try {
    const { data, error } = await supabase
      .from('user_quotas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quotaId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新配额失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('updateUserQuota 错误:', error);
    throw error instanceof Error ? error : new Error('更新配额失败');
  }
};

// Reset daily quota if needed
const resetDailyQuotaIfNeeded = async (quota: UsageQuota): Promise<UsageQuota> => {
  const today = new Date().toISOString().split('T')[0];
  const quotaDate = new Date(quota.daily_reset_date).toISOString().split('T')[0];
  
  if (today !== quotaDate) {
    console.log('重置每日配额');
    const updatedQuota = await updateUserQuota(quota.id, {
      merchandise_daily_used: 0,
      daily_reset_date: today,
    });
    return updatedQuota;
  }
  
  return quota;
};

// Check if user can perform action
export const checkUserQuota = async (
  userId: string,
  action: 'ip_character' | 'merchandise' | 'model'
): Promise<{ canProceed: boolean; quota?: UsageQuota; message?: string }> => {
  try {
    let quota = await getUserQuota(userId);
    if (!quota) {
      return { canProceed: false, message: '无法获取用户配额信息' };
    }

    // Reset daily quota if needed
    quota = await resetDailyQuotaIfNeeded(quota);

    let canProceed = false;
    let message = '';

    switch (action) {
      case 'ip_character':
        canProceed = quota.ip_characters_used < quota.ip_characters_limit;
        message = canProceed ? '' : `IP角色生成已达上限 (${quota.ip_characters_limit})`;
        break;
      case 'merchandise':
        // Check both daily and monthly limits for free users
        const subscription = await getUserSubscription(userId);
        const isFreeUser = !subscription || subscription.plan === 'free';
        
        if (isFreeUser) {
          const dailyLimitReached = quota.merchandise_daily_used >= quota.merchandise_daily_limit;
          canProceed = !dailyLimitReached;
          message = canProceed ? '' : `今日周边生成已达上限 (${quota.merchandise_daily_limit})`;
        } else {
          canProceed = quota.merchandise_monthly_used < quota.merchandise_monthly_limit;
          message = canProceed ? '' : `本月周边生成已达上限 (${quota.merchandise_monthly_limit})`;
        }
        break;
      case 'model':
        canProceed = quota.models_monthly_used < quota.models_monthly_limit;
        message = canProceed ? '' : `本月3D模型生成已达上限 (${quota.models_monthly_limit})`;
        break;
    }

    return { canProceed, quota, message };
  } catch (error) {
    console.error('checkUserQuota 错误:', error);
    return { canProceed: false, message: '检查配额时发生错误' };
  }
};

// Increment usage quota
export const incrementUserQuota = async (
  userId: string,
  action: 'ip_character' | 'merchandise' | 'model'
): Promise<void> => {
  try {
    let quota = await getUserQuota(userId);
    if (!quota) {
      throw new Error('无法获取用户配额信息');
    }

    // Reset daily quota if needed
    quota = await resetDailyQuotaIfNeeded(quota);

    const updates: Partial<UsageQuota> = {};
    
    switch (action) {
      case 'ip_character':
        updates.ip_characters_used = quota.ip_characters_used + 1;
        break;
      case 'merchandise':
        // Increment both daily and monthly for free users, only monthly for paid users
        const subscription = await getUserSubscription(userId);
        const isFreeUser = !subscription || subscription.plan === 'free';
        
        if (isFreeUser) {
          updates.merchandise_daily_used = quota.merchandise_daily_used + 1;
        }
        updates.merchandise_monthly_used = quota.merchandise_monthly_used + 1;
        break;
      case 'model':
        updates.models_monthly_used = quota.models_monthly_used + 1;
        break;
    }

    await updateUserQuota(quota.id, updates);
    console.log(`用户 ${userId} 的 ${action} 配额已递增`);
  } catch (error) {
    console.error('incrementUserQuota 错误:', error);
    throw error instanceof Error ? error : new Error('更新配额使用量失败');
  }
};

// Initialize free user quota for new users
export const initializeFreeUserQuota = async (userId: string): Promise<void> => {
  try {
    console.log(`为新用户 ${userId} 初始化免费配额`);
    
    // Check if user already has a subscription
    const existingSubscription = await getUserSubscription(userId);
    if (existingSubscription) {
      console.log('用户已有订阅，跳过初始化');
      return;
    }

    // Create free subscription
    const subscription = await createUserSubscription(userId, 'free');
    console.log(`用户 ${userId} 的免费配额初始化完成`);
  } catch (error) {
    console.error('initializeFreeUserQuota 错误:', error);
    // Don't throw error to avoid blocking user registration
  }
};