-- Popverse.ai Supabase 数据库结构
-- 最终版本 - 与生产环境完全对应
-- 执行时间：2024-12-10

-- ============================================
-- 第一部分：清理和准备
-- ============================================

-- 查看现有用户（调试用）
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 清理未确认的用户（解决429错误）
DELETE FROM auth.users WHERE email_confirmed_at IS NULL;

-- ============================================
-- 第二部分：核心业务表
-- ============================================

-- 1. 用户订阅表
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'personal', 'team', 'enterprise')) DEFAULT 'free',
    creem_subscription_id TEXT,
    creem_customer_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')) DEFAULT 'inactive',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户使用配额表
CREATE TABLE IF NOT EXISTS public.user_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    ip_characters_used INTEGER DEFAULT 0,
    ip_characters_limit INTEGER DEFAULT 2,
    merchandise_daily_used INTEGER DEFAULT 0,
    merchandise_daily_limit INTEGER DEFAULT 2,
    merchandise_monthly_used INTEGER DEFAULT 0,
    merchandise_monthly_limit INTEGER DEFAULT 2,
    models_monthly_used INTEGER DEFAULT 0,
    models_monthly_limit INTEGER DEFAULT 1,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    daily_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户IP形象表
CREATE TABLE IF NOT EXISTS public.user_ip_characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB DEFAULT '{}',
    merchandise_task_status TEXT CHECK (merchandise_task_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 生成任务表
CREATE TABLE IF NOT EXISTS public.generation_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    task_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    result_data JSONB DEFAULT '{}',
    error_message TEXT,
    batch_id UUID,
    parent_character_id UUID REFERENCES public.user_ip_characters(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 第三部分：性能优化
-- ============================================

-- 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creem_subscription_id ON public.user_subscriptions(creem_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_subscription_id ON public.user_quotas(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON public.user_ip_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_created_at ON public.user_ip_characters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_batch_id ON public.generation_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_parent_character_id ON public.generation_tasks(parent_character_id);

-- ============================================
-- 第四部分：安全策略
-- ============================================

-- 启用行级安全策略
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ip_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;

-- 清理可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.user_subscriptions;

DROP POLICY IF EXISTS "Users can view own quotas" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can insert own quotas" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can update own quotas" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can delete own quotas" ON public.user_quotas;

DROP POLICY IF EXISTS "Users can view own IP characters" ON public.user_ip_characters;
DROP POLICY IF EXISTS "Users can insert own IP characters" ON public.user_ip_characters;
DROP POLICY IF EXISTS "Users can update own IP characters" ON public.user_ip_characters;
DROP POLICY IF EXISTS "Users can delete own IP characters" ON public.user_ip_characters;

DROP POLICY IF EXISTS "Users can view own generation tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can insert own generation tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can update own generation tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can delete own generation tasks" ON public.generation_tasks;

-- 创建用户订阅表的RLS策略
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 创建用户配额表的RLS策略
CREATE POLICY "Users can view own quotas" ON public.user_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotas" ON public.user_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotas" ON public.user_quotas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotas" ON public.user_quotas
    FOR DELETE USING (auth.uid() = user_id);

-- 创建用户IP形象表的RLS策略
CREATE POLICY "Users can view own IP characters" ON public.user_ip_characters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IP characters" ON public.user_ip_characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IP characters" ON public.user_ip_characters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own IP characters" ON public.user_ip_characters
    FOR DELETE USING (auth.uid() = user_id);

-- 创建生成任务表的RLS策略
CREATE POLICY "Users can view own generation tasks" ON public.generation_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation tasks" ON public.generation_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation tasks" ON public.generation_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generation tasks" ON public.generation_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 第五部分：存储配置
-- ============================================

-- 创建图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- 存储桶访问策略
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Users can update own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 第六部分：验证和测试
-- ============================================

-- 验证表已创建
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_ip_characters', 'generation_tasks');

-- 验证策略已创建
SELECT 
    schemaname, 
    tablename, 
    policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_ip_characters', 'generation_tasks');

-- 验证存储桶已创建
SELECT id, name, public FROM storage.buckets WHERE id = 'generated-images';

-- ============================================
-- 备注和说明
-- ============================================

/*
数据库表说明：
1. auth.users - Supabase内置用户认证表
2. public.user_ip_characters - 用户创建的IP形象数据
3. public.generation_tasks - AI生成任务记录

表关系：
- user_ip_characters.user_id → auth.users.id
- generation_tasks.user_id → auth.users.id  
- generation_tasks.parent_character_id → user_ip_characters.id

安全策略：
- 启用RLS确保用户只能访问自己的数据
- 存储桶允许认证用户上传，公开访问图片

API集成：
- Sparrow API: sk-TFpWwowemj3EvpydtjwuIolhiuEgG8WW1LugZs3HHF4eb4z9
- Tripo3D API: tcli_e5aefcdde2314dacaf90390b4c38d2b4
- Supabase URL: https://wrfvysakckcmvquvwuei.supabase.co

最后更新：2024-12-10
状态：生产就绪 ✅
*/ 