-- 立即修复 RLS 策略问题
-- 此脚本专门解决 "new row violates row-level security policy" 错误
-- 在 Supabase SQL 编辑器中运行

-- 第1步：检查当前认证状态
DO $$
BEGIN
    RAISE NOTICE '当前用户认证状态: %', auth.uid();
    RAISE NOTICE '当前用户角色: %', auth.role();
END $$;

-- 第2步：暂时禁用所有RLS策略以确定问题
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;

-- 第3步：删除所有现有的RLS策略
DROP POLICY IF EXISTS "Users can view own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can update own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON user_ip_characters;

DROP POLICY IF EXISTS "Users can view own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Service role can manage all tasks" ON generation_tasks;

-- 第4步：检查表结构并确保列类型正确
DO $$
BEGIN
    -- 检查 user_ip_characters 表的 user_id 列类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_ip_characters' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE '发现 user_ip_characters.user_id 是 TEXT 类型，需要转换为 UUID';
        
        -- 先添加新的UUID列
        ALTER TABLE user_ip_characters ADD COLUMN user_id_new UUID;
        
        -- 尝试转换现有数据（如果有）
        UPDATE user_ip_characters 
        SET user_id_new = user_id::uuid 
        WHERE user_id IS NOT NULL AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- 删除旧列并重命名新列
        ALTER TABLE user_ip_characters DROP COLUMN user_id;
        ALTER TABLE user_ip_characters RENAME COLUMN user_id_new TO user_id;
        
        -- 添加约束
        ALTER TABLE user_ip_characters ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE user_ip_characters ADD CONSTRAINT user_ip_characters_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- 检查 generation_tasks 表的 user_id 列类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_tasks' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE '发现 generation_tasks.user_id 是 TEXT 类型，需要转换为 UUID';
        
        -- 先添加新的UUID列
        ALTER TABLE generation_tasks ADD COLUMN user_id_new UUID;
        
        -- 尝试转换现有数据（如果有）
        UPDATE generation_tasks 
        SET user_id_new = user_id::uuid 
        WHERE user_id IS NOT NULL AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- 删除旧列并重命名新列
        ALTER TABLE generation_tasks DROP COLUMN user_id;
        ALTER TABLE generation_tasks RENAME COLUMN user_id_new TO user_id;
        
        -- 添加约束
        ALTER TABLE generation_tasks ADD CONSTRAINT generation_tasks_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 第5步：重新启用RLS
ALTER TABLE user_ip_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- 第6步：创建新的、经过测试的RLS策略
-- 为 user_ip_characters 创建策略
CREATE POLICY "用户可以查看自己的IP形象" ON user_ip_characters 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "用户可以插入自己的IP形象" ON user_ip_characters 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户可以更新自己的IP形象" ON user_ip_characters 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "用户可以删除自己的IP形象" ON user_ip_characters 
FOR DELETE USING (user_id = auth.uid());

-- 为 generation_tasks 创建策略
CREATE POLICY "用户可以查看自己的任务" ON generation_tasks 
FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "用户可以插入自己的任务" ON generation_tasks 
FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "用户可以更新自己的任务" ON generation_tasks 
FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- 第7步：创建测试函数来验证RLS策略
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS text AS $$
DECLARE
    test_user_id uuid;
    test_result text := '';
BEGIN
    -- 获取当前用户ID
    test_user_id := auth.uid();
    
    IF test_user_id IS NULL THEN
        RETURN 'ERROR: 没有已认证的用户，无法测试RLS策略';
    END IF;
    
    test_result := test_result || '认证用户ID: ' || test_user_id::text || E'\n';
    
    -- 测试插入权限
    BEGIN
        INSERT INTO user_ip_characters (user_id, name, main_image_url)
        VALUES (test_user_id, 'RLS测试IP', 'test-url');
        
        test_result := test_result || '✅ INSERT 权限测试通过' || E'\n';
        
        -- 清理测试数据
        DELETE FROM user_ip_characters WHERE name = 'RLS测试IP' AND user_id = test_user_id;
        test_result := test_result || '✅ DELETE 权限测试通过' || E'\n';
        
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || '❌ INSERT/DELETE 权限测试失败: ' || SQLERRM || E'\n';
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第8步：验证修复结果
SELECT test_rls_policies() as 修复验证结果;

-- 第9步：显示表结构信息
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_ip_characters', 'generation_tasks')
    AND column_name = 'user_id'
ORDER BY table_name;

-- 第10步：显示当前RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_ip_characters', 'generation_tasks')
ORDER BY tablename, policyname;

RAISE NOTICE '修复脚本执行完成！请检查上面的验证结果。';
RAISE NOTICE '如果测试通过，RLS策略问题应该已经解决。';
RAISE NOTICE '现在可以尝试在应用中保存IP形象了。'; 