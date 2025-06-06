-- 确保 UUID 扩展已启用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 删除现有表（如果存在）以重新创建
DROP TABLE IF EXISTS user_ip_characters;
DROP TABLE IF EXISTS generation_tasks;
DROP TABLE IF EXISTS users;

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建生成任务表
CREATE TABLE generation_tasks (
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

-- 创建用户IP形象表
CREATE TABLE user_ip_characters (
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

-- 创建索引
CREATE INDEX idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX idx_generation_tasks_created_at ON generation_tasks(created_at);
CREATE INDEX idx_user_ip_characters_user_id ON user_ip_characters(user_id);

-- 禁用 RLS（开发环境）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;

-- 测试插入数据
INSERT INTO users (id, username, password_hash) 
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'dGVzdDEyMw==');

-- 验证插入
SELECT * FROM users WHERE username = 'test_user';

-- 清理测试数据
DELETE FROM users WHERE username = 'test_user';

-- 显示表结构
\d users;
\d generation_tasks;
\d user_ip_characters;