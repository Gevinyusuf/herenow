-- v_user_entitlements 视图诊断脚本
-- 用于排查为什么视图查询不到数据

-- 1. 检查 subscriptions 表是否有数据
SELECT 
  'subscriptions 总数' as check_item,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ 没有订阅数据'
    ELSE '✅ 有订阅数据'
  END as status
FROM subscriptions

UNION ALL

-- 2. 检查 active 订阅数
SELECT 
  'active 订阅数',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ 没有活跃订阅'
    ELSE '✅ 有活跃订阅'
  END
FROM subscriptions
WHERE status = 'active'

UNION ALL

-- 3. 检查未过期订阅数
SELECT 
  '未过期订阅数',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ 所有订阅都已过期'
    ELSE '✅ 有未过期订阅'
  END
FROM subscriptions
WHERE status = 'active'
  AND (current_period_end IS NULL OR current_period_end > NOW())

UNION ALL

-- 4. 检查有对应套餐的订阅数
SELECT 
  '有对应套餐的订阅数',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ plan_id 在 plans 表中不存在'
    ELSE '✅ 套餐匹配'
  END
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW())

UNION ALL

-- 5. 检查视图返回数据数
SELECT 
  '视图返回数据数',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ 视图无数据'
    ELSE '✅ 视图有数据'
  END
FROM v_user_entitlements;

-- 详细诊断：查看 subscriptions 表的具体情况
SELECT 
  user_id,
  plan_id,
  status,
  current_period_end,
  CASE 
    WHEN status != 'active' THEN '❌ status 不是 active'
    WHEN current_period_end IS NOT NULL AND current_period_end < NOW() THEN '❌ 已过期'
    WHEN NOT EXISTS (SELECT 1 FROM plans WHERE id = subscriptions.plan_id) THEN '❌ plan_id 不存在'
    ELSE '✅ 正常'
  END as issue
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

