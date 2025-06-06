# 立即修复：用户插入失败问题

## 当前状态
- ✅ 数据库连接正常
- ❌ 用户插入测试失败

## 问题分析
基于测试结果，数据库连接正常但用户插入失败，这通常意味着：
1. `users` 表不存在
2. 表结构不正确
3. RLS 政策阻止插入
4. 权限问题

## 立即解决方案

### 步骤 1: 在 Supabase 中创建表
在 Supabase 仪表板的 SQL 编辑器中运行：

```sql
-- 确保 UUID 扩展已启用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 禁用 RLS（开发环境）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 测试插入
INSERT INTO users (username, password_hash) 
VALUES ('test_user_' || extract(epoch from now()), 'dGVzdDEyMw==');

-- 验证
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

### 步骤 2: 创建其他必要的表
```sql
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

-- 禁用所有表的 RLS
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
```

### 步骤 3: 创建存储桶
```sql
-- 创建图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
```

### 步骤 4: 重新测试
1. 访问 http://localhost:3000/debug
2. 点击"运行数据库测试"
3. 确保用户插入测试通过

## 验证步骤

### 1. 检查表是否存在
在 Supabase SQL 编辑器中运行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'generation_tasks', 'user_ip_characters');
```

### 2. 检查表结构
```sql
\d users;
```

### 3. 测试手动插入
```sql
INSERT INTO users (username, password_hash) 
VALUES ('manual_test', 'dGVzdA==');

SELECT * FROM users WHERE username = 'manual_test';

DELETE FROM users WHERE username = 'manual_test';
```

## 常见错误及解决方案

### Error: relation "users" does not exist
- **解决**: 运行上述 CREATE TABLE 语句

### Error: permission denied for table users
- **解决**: 运行 `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`

### Error: function uuid_generate_v4() does not exist
- **解决**: 运行 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

## 完成后的测试

1. **数据库测试**: 在 /debug 页面确保所有测试通过
2. **用户注册**: 尝试在主页注册新用户
3. **IP保存**: 生成IP形象并尝试保存

## 备用方案

如果上述方案不工作，可以使用 `create-tables.sql` 文件中的完整脚本，该脚本会删除并重新创建所有表。

执行完这些步骤后，用户注册和IP保存功能应该正常工作。