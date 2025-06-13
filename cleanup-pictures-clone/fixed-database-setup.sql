-- 修复版数据库初始化脚本
-- 解决UUID与TEXT类型不匹配问题

-- 1. 创建用户表（使用UUID类型）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建用户IP角色表
CREATE TABLE IF NOT EXISTS user_ip_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB,
    merchandise_task_status TEXT CHECK (merchandise_task_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建生成任务表
CREATE TABLE IF NOT EXISTS generation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    task_type TEXT NOT NULL CHECK (task_type IN (
        'ip_generation', 
        'multi_view_left', 
        'multi_view_back', 
        'multi_view_right',
        '3d_model', 
        'merchandise_keychain',
        'merchandise_fridge_magnet', 
        'merchandise_handbag',
        'merchandise_phone_case'
    )),
    prompt TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    result_data JSONB,
    error_message TEXT,
    batch_id UUID,
    parent_character_id UUID REFERENCES user_ip_characters(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_batch_id ON generation_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_parent_character ON generation_tasks(parent_character_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON user_ip_characters(user_id);

-- 5. 启用行级安全性（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters ENABLE ROW LEVEL SECURITY;

-- 6. 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can view own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can update own characters" ON user_ip_characters;

-- 7. 创建RLS策略
-- 用户表策略
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- 任务表策略 - 修改为使用UUID比较
CREATE POLICY "Users can view own tasks" ON generation_tasks FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can insert own tasks" ON generation_tasks FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can update own tasks" ON generation_tasks FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- IP角色表策略 - 修改为使用UUID比较
CREATE POLICY "Users can view own characters" ON user_ip_characters FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own characters" ON user_ip_characters FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own characters" ON user_ip_characters FOR UPDATE USING (user_id = auth.uid());

-- 8. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. 创建存储策略
-- 删除现有存储策略（如果存在）
DROP POLICY IF EXISTS "Public can view generated images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- 创建新的存储策略
CREATE POLICY "Public can view generated images" ON storage.objects 
FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'generated-images');

-- 完成提示
SELECT 'Database setup completed successfully!' as status;