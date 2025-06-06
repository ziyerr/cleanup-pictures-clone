-- 创建缺失的表：user_ip_characters 和 generation_tasks
-- 在 Supabase SQL 编辑器中运行此脚本

-- 确保 UUID 扩展已启用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户IP形象表
CREATE TABLE IF NOT EXISTS user_ip_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建生成任务表
CREATE TABLE IF NOT EXISTS generation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    task_type TEXT NOT NULL CHECK (task_type IN ('ip_generation', 'multi_view', '3d_model', 'merchandise')),
    prompt TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON user_ip_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at);

-- 禁用 RLS（开发环境）
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;

-- 验证表已创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'generation_tasks', 'user_ip_characters')
ORDER BY table_name;

-- 测试插入到 user_ip_characters 表
INSERT INTO user_ip_characters (user_id, name, main_image_url) 
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Test IP Character', 
    'data:image/png;base64,test'
);

-- 验证插入成功
SELECT * FROM user_ip_characters ORDER BY created_at DESC LIMIT 1;

-- 清理测试数据
DELETE FROM user_ip_characters WHERE name = 'Test IP Character';

-- 显示所有表的结构
\d user_ip_characters;
\d generation_tasks;
\d users;