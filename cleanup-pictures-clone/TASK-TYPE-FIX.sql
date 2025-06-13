-- 修复 generation_tasks 表的 task_type 检查约束
-- 
-- 问题：当前的 task_type 约束不允许新的任务类型值
-- 解决方案：删除旧约束，添加新的约束支持所有必要的任务类型

-- 1. 首先删除现有的 task_type 检查约束
ALTER TABLE generation_tasks 
DROP CONSTRAINT IF EXISTS generation_tasks_task_type_check;

-- 2. 添加新的约束，支持所有必要的任务类型
ALTER TABLE generation_tasks 
ADD CONSTRAINT generation_tasks_task_type_check 
CHECK (task_type IN (
    'ip_generation',           -- IP形象生成
    'multi_view_left_view',    -- 左视图生成
    'multi_view_back_view',    -- 后视图生成
    'merchandise_keychain',    -- 钥匙扣商品
    'merchandise_fridge_magnet', -- 冰箱贴商品
    'merchandise_handbag',     -- 手提袋商品
    'merchandise_phone_case',  -- 手机壳商品
    '3d_model',               -- 3D模型生成
    'batch_generation',       -- 批量生成
    'other'                   -- 其他类型
));

-- 3. 验证修复
SELECT DISTINCT task_type, COUNT(*) as count 
FROM generation_tasks 
GROUP BY task_type;

-- 显示修复完成消息
SELECT '✅ task_type 约束修复完成！现在支持所有商品生成类型。' as status; 