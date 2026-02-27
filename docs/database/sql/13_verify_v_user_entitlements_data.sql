-- 验证 v_user_entitlements 视图数据内容
-- 用于检查配额字段是否正确显示

-- 1. 查看视图的所有数据（前5条）
SELECT * FROM v_user_entitlements LIMIT 5;

-- 2. 查看特定用户的配额信息
SELECT 
  user_id,
  plan_name,
  plan_id,
  subscription_status,
  current_period_end,
  -- 文本生成配额
  quota_ai_text_generation_limit,
  quota_ai_text_generation_used,
  quota_ai_text_generation_remaining,
  -- 图片生成配额
  quota_ai_image_generation_limit,
  quota_ai_image_generation_used,
  quota_ai_image_generation_remaining,
  -- 对话聊天配额
  quota_ai_chat_limit,
  quota_ai_chat_used,
  quota_ai_chat_remaining,
  -- 活动规划配额
  quota_ai_planning_limit,
  quota_ai_planning_used,
  quota_ai_planning_remaining,
  -- 事件导入配额
  quota_ai_import_limit,
  quota_ai_import_used,
  quota_ai_import_remaining
FROM v_user_entitlements
LIMIT 3;

-- 3. 统计各套餐的用户数
SELECT 
  plan_name,
  plan_id,
  COUNT(*) as user_count
FROM v_user_entitlements
GROUP BY plan_name, plan_id
ORDER BY user_count DESC;

-- 4. 检查配额配置是否完整
SELECT 
  plan_name,
  CASE 
    WHEN quota_ai_text_generation_limit > 0 OR quota_ai_text_generation_limit = -1 THEN '✅'
    ELSE '❌'
  END as text_gen,
  CASE 
    WHEN quota_ai_image_generation_limit > 0 OR quota_ai_image_generation_limit = -1 THEN '✅'
    ELSE '❌'
  END as image_gen,
  CASE 
    WHEN quota_ai_chat_limit > 0 OR quota_ai_chat_limit = -1 THEN '✅'
    ELSE '❌'
  END as chat,
  CASE 
    WHEN quota_ai_planning_limit > 0 OR quota_ai_planning_limit = -1 THEN '✅'
    ELSE '❌'
  END as planning,
  CASE 
    WHEN quota_ai_import_limit > 0 OR quota_ai_import_limit = -1 THEN '✅'
    ELSE '❌'
  END as import
FROM v_user_entitlements
GROUP BY plan_name, 
  quota_ai_text_generation_limit,
  quota_ai_image_generation_limit,
  quota_ai_chat_limit,
  quota_ai_planning_limit,
  quota_ai_import_limit;

