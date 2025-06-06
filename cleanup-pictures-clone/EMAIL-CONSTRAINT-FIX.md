# Email 约束错误修复

## 问题诊断 ✅
错误：`关系"users"的"email"列中的空值违反了非空约束（代码：23502）`

## 问题原因
数据库表中 `email` 字段被设置为 `NOT NULL`，但应用逻辑中 `email` 是可选字段。

## 立即修复方案

### 在 Supabase SQL 编辑器中运行：

```sql
-- 修复 email 字段约束
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 验证修复
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 验证修复：

```sql
-- 测试插入（不提供email - 应该成功）
INSERT INTO users (username, password_hash) 
VALUES ('test_no_email_' || extract(epoch from now()), 'dGVzdA==');

-- 测试插入（提供email - 也应该成功）
INSERT INTO users (username, email, password_hash) 
VALUES ('test_with_email_' || extract(epoch from now()), 'test@example.com', 'dGVzdA==');

-- 查看结果
SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 3;

-- 清理测试数据
DELETE FROM users WHERE username LIKE 'test_%';
```

## 代码修复说明

我已经更新了以下文件：

### 1. `src/lib/supabase.ts`
- 修复了用户注册时 email 字段的处理
- 只有当 email 存在时才包含在插入数据中

### 2. `src/lib/test-db.ts` 
- 更新测试用例以匹配实际使用场景（不强制要求email）

## 完整的表结构应该是：

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,                    -- 允许为空
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 验证步骤

1. **运行修复SQL** - 在 Supabase 中执行上述 ALTER TABLE 命令
2. **重新测试** - 访问 `/debug` 页面并运行测试
3. **确认成功** - 用户插入测试应该通过
4. **功能测试** - 在主页尝试用户注册

## 其他必要表的创建

如果还没有创建其他表，也请创建：

```sql
-- 生成任务表
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

-- 用户IP形象表
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

-- 禁用RLS
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
```

修复完成后，整个用户注册和IP保存流程应该正常工作！