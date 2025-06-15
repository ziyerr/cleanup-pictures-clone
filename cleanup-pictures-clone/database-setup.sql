-- Popverse.ai 数据库表结构
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 用户IP形象表
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

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON public.user_ip_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_created_at ON public.user_ip_characters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_batch_id ON public.generation_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_parent_character_id ON public.generation_tasks(parent_character_id);

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE public.user_ip_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略 - 用户只能访问自己的数据
CREATE POLICY "Users can view own IP characters" ON public.user_ip_characters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IP characters" ON public.user_ip_characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IP characters" ON public.user_ip_characters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own IP characters" ON public.user_ip_characters
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generation tasks" ON public.generation_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation tasks" ON public.generation_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation tasks" ON public.generation_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generation tasks" ON public.generation_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建存储桶用于图片存储
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. 创建存储桶的RLS策略
CREATE POLICY "Users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Users can update own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]); 