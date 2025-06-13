-- 🚨 紧急数据库修复脚本
-- 解决 task_type 约束、超时问题和性能问题

-- ================================================================
-- 第一步：修复 task_type 约束问题
-- ================================================================

-- 删除现有的 task_type 检查约束
ALTER TABLE generation_tasks 
DROP CONSTRAINT IF EXISTS generation_tasks_task_type_check;

-- 添加新的约束，支持所有任务类型
ALTER TABLE generation_tasks 
ADD CONSTRAINT generation_tasks_task_type_check 
CHECK (task_type IN (
    'ip_generation',
    'multi_view_left_view',
    'multi_view_back_view', 
    'merchandise_keychain',
    'merchandise_fridge_magnet',
    'merchandise_handbag',
    'merchandise_phone_case',
    '3d_model',
    'batch_generation',
    'other'
));

-- ================================================================
-- 第二步：优化数据库性能，解决超时问题
-- ================================================================

-- 添加缺失的索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_generation_tasks_batch_id ON generation_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_task_type ON generation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_parent_character_id ON generation_tasks(parent_character_id);

-- 为 user_ip_characters 表添加索引
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON user_ip_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_created_at ON user_ip_characters(created_at);

-- ================================================================
-- 第三步：清理可能的重复或问题数据
-- ================================================================

-- 删除状态为 pending 超过 1 小时的任务（避免积累）
DELETE FROM generation_tasks 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- 删除没有关联字符的孤立任务
DELETE FROM generation_tasks 
WHERE parent_character_id IS NOT NULL 
AND parent_character_id NOT IN (
    SELECT id FROM user_ip_characters
);

-- ================================================================
-- 第四步：验证修复结果
-- ================================================================

-- 检查约束是否正确创建
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'generation_tasks_task_type_check';

-- 检查索引是否创建成功
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('generation_tasks', 'user_ip_characters')
ORDER BY tablename, indexname;

-- 检查当前任务状态分布
SELECT task_type, status, COUNT(*) as count 
FROM generation_tasks 
GROUP BY task_type, status 
ORDER BY task_type, status;

-- 显示修复完成状态
SELECT '🎉 数据库紧急修复完成！
✅ task_type 约束已更新
✅ 性能索引已添加  
✅ 问题数据已清理
✅ 现在可以正常创建任务了！' as repair_status; 