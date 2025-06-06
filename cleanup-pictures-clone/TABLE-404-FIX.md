# 修复：user_ip_characters 表不存在 (404错误)

## 问题诊断 ✅
从日志可以看出：
- ✅ IP形象生成成功
- ✅ 用户登录成功  
- ❌ 保存失败：`POST 404 (Not Found)` 
- 错误URL：`/rest/v1/user_ip_characters` 

## 问题原因
`user_ip_characters` 表在数据库中不存在，导致 Supabase API 返回 404。

## 立即修复方案

### 在 Supabase SQL 编辑器中运行：

```sql
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

-- 创建生成任务表（也需要）
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

-- 禁用 RLS（开发环境）
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON user_ip_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
```

### 验证修复：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'generation_tasks', 'user_ip_characters')
ORDER BY table_name;

-- 测试插入
INSERT INTO user_ip_characters (user_id, name, main_image_url) 
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Test IP Character', 
    'data:image/png;base64,test'
);

-- 验证
SELECT * FROM user_ip_characters ORDER BY created_at DESC LIMIT 1;

-- 清理
DELETE FROM user_ip_characters WHERE name = 'Test IP Character';
```

## 验证步骤

1. **运行修复SQL** - 在 Supabase 中执行上述命令
2. **重新测试** - 访问 `/debug` 页面并运行完整测试
3. **确认成功** - 所有测试（用户插入 + IP形象插入）都应该通过
4. **功能测试** - 在主页面完整测试：注册 → 生成IP → 保存IP

## 预期结果

修复后的调试测试应该显示：
- ✅ 数据库连接测试通过
- ✅ 用户插入测试通过  
- ✅ IP形象插入测试通过

## 完整功能流程测试

1. **访问主页**
2. **上传图片并生成IP形象**
3. **点击"保存IP形象"**
4. **完成用户注册/登录**
5. **验证IP形象保存成功** ✅

## 存储桶设置（可选）

如果需要上传实际图片文件而不是base64：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
```

执行这些修复后，整个IP形象生成和保存流程应该完全正常工作！