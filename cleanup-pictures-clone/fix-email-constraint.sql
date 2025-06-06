-- 修复 email 字段的非空约束问题
-- 在 Supabase SQL 编辑器中运行此脚本

-- 选项1: 修改现有表结构，允许 email 为空
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 验证表结构
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 测试插入（不提供email）
INSERT INTO users (username, password_hash) 
VALUES ('test_no_email_' || extract(epoch from now()), 'dGVzdA==');

-- 测试插入（提供email）
INSERT INTO users (username, email, password_hash) 
VALUES ('test_with_email_' || extract(epoch from now()), 'test@example.com', 'dGVzdA==');

-- 查看结果
SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5;

-- 清理测试数据
DELETE FROM users WHERE username LIKE 'test_%';