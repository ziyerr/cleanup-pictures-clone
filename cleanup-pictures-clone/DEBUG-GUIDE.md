# 数据库错误调试指南

## 当前问题
`Error: 保存IP形象失败: undefined` 表明数据库操作失败，但错误信息不明确。

## 调试步骤

### 1. 访问调试页面
访问 http://localhost:3000/debug 来运行数据库连接测试

### 2. 检查数据库表是否存在
在 Supabase 仪表板的 SQL 编辑器中运行：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'generation_tasks', 'user_ip_characters');
```

### 3. 创建缺失的表
如果表不存在，运行以下 SQL 创建表：

```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建生成任务表
CREATE TABLE IF NOT EXISTS generation_tasks (
    id UUID PRIMARY KEY,
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
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 禁用RLS政策（开发环境）
```sql
-- 禁用所有表的RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
```

### 5. 创建存储桶
```sql
-- 创建图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
```

### 6. 设置存储政策
```sql
-- 存储政策
CREATE POLICY "Public can view generated images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Anyone can upload to generated images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'generated-images');
```

## 常见错误排查

### Error: undefined
- **原因**: 数据库表不存在或RLS阻止访问
- **解决**: 创建表并禁用RLS

### Error: relation does not exist
- **原因**: 表未创建
- **解决**: 运行上述CREATE TABLE语句

### Error: permission denied
- **原因**: RLS政策阻止访问
- **解决**: 禁用RLS或修改政策

### Error: uuid format
- **原因**: ID格式不是标准UUID
- **解决**: 已修复，使用 uuid v4

## 验证步骤

1. **运行调试页面测试**
   - 访问 /debug 页面
   - 点击"运行数据库测试"
   - 查看所有测试是否通过

2. **手动测试用户注册**
   - 点击头部用户图标
   - 尝试注册新用户
   - 检查浏览器控制台的日志

3. **测试IP形象保存**
   - 生成一个IP形象
   - 尝试保存
   - 检查控制台的详细错误信息

## 控制台日志说明

现在所有数据库操作都有详细的控制台日志：

- `开始用户注册:` - 用户注册开始
- `准备插入的用户数据:` - 将要插入的数据
- `用户注册Supabase响应:` - Supabase的响应
- `开始保存IP形象:` - IP形象保存开始
- `准备插入的数据:` - 将要插入的IP形象数据
- `Supabase响应:` - 保存IP形象的响应

## 快速修复命令

在 Supabase SQL 编辑器中一次性运行：

```sql
-- 快速修复脚本
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 禁用RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_ip_characters DISABLE ROW LEVEL SECURITY;

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
```

修复完成后，重新测试注册和保存功能。