-- 更新后的 v_user_entitlements 视图
-- 支持所有 AI 功能类型的配额查询
-- 保持向后兼容，保留旧的 quota_ai_generations 字段
-- 
-- 注意：需要先删除旧视图，因为列顺序可能不同

-- 第一步：删除旧视图
DROP VIEW IF EXISTS public.v_user_entitlements;

-- 第二步：创建新视图
CREATE VIEW
  "public"."v_user_entitlements" AS
SELECT
  s.user_id,
  p.name AS plan_name,
  p.id AS plan_id,
  s.status AS subscription_status,
  s.current_period_end,
  
  -- 1. 功能开关 (Feature Flags)
  COALESCE((p.limits->>'feature_community')::boolean, false) AS can_access_community,
  COALESCE((p.limits->>'feature_discover')::boolean, false) AS can_access_discover,
  
  -- 2. 旧的统一 AI 生成额度（向后兼容）
  COALESCE((p.limits->>'quota_ai_generations')::int, 0) AS quota_ai_limit,
  COALESCE(u_ai.count, 0) AS quota_ai_used,
  CASE
    WHEN (p.limits->>'quota_ai_generations')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_generations')::int - COALESCE(u_ai.count, 0))
  END AS quota_ai_remaining,
  
  -- 3. 文本生成配额
  COALESCE((p.limits->>'quota_ai_text_generation')::int, 0) AS quota_ai_text_generation_limit,
  COALESCE(u_text.count, 0) AS quota_ai_text_generation_used,
  CASE
    WHEN (p.limits->>'quota_ai_text_generation')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_text_generation')::int - COALESCE(u_text.count, 0))
  END AS quota_ai_text_generation_remaining,
  
  -- 4. 图片生成配额
  COALESCE((p.limits->>'quota_ai_image_generation')::int, 0) AS quota_ai_image_generation_limit,
  COALESCE(u_image.count, 0) AS quota_ai_image_generation_used,
  CASE
    WHEN (p.limits->>'quota_ai_image_generation')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_image_generation')::int - COALESCE(u_image.count, 0))
  END AS quota_ai_image_generation_remaining,
  
  -- 5. 对话聊天配额
  COALESCE((p.limits->>'quota_ai_chat')::int, 0) AS quota_ai_chat_limit,
  COALESCE(u_chat.count, 0) AS quota_ai_chat_used,
  CASE
    WHEN (p.limits->>'quota_ai_chat')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_chat')::int - COALESCE(u_chat.count, 0))
  END AS quota_ai_chat_remaining,
  
  -- 6. 活动规划配额
  COALESCE((p.limits->>'quota_ai_planning')::int, 0) AS quota_ai_planning_limit,
  COALESCE(u_planning.count, 0) AS quota_ai_planning_used,
  CASE
    WHEN (p.limits->>'quota_ai_planning')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_planning')::int - COALESCE(u_planning.count, 0))
  END AS quota_ai_planning_remaining,
  
  -- 7. 事件导入配额
  COALESCE((p.limits->>'quota_ai_import')::int, 0) AS quota_ai_import_limit,
  COALESCE(u_import.count, 0) AS quota_ai_import_used,
  CASE
    WHEN (p.limits->>'quota_ai_import')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_import')::int - COALESCE(u_import.count, 0))
  END AS quota_ai_import_remaining

FROM
  subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  -- 旧的统一配额使用量（向后兼容）
  LEFT JOIN usages u_ai ON s.user_id = u_ai.user_id
    AND u_ai.feature_key = 'quota_ai_generations'
  -- 文本生成使用量
  LEFT JOIN usages u_text ON s.user_id = u_text.user_id
    AND u_text.feature_key = 'quota_ai_text_generation'
  -- 图片生成使用量
  LEFT JOIN usages u_image ON s.user_id = u_image.user_id
    AND u_image.feature_key = 'quota_ai_image_generation'
  -- 对话聊天使用量
  LEFT JOIN usages u_chat ON s.user_id = u_chat.user_id
    AND u_chat.feature_key = 'quota_ai_chat'
  -- 活动规划使用量
  LEFT JOIN usages u_planning ON s.user_id = u_planning.user_id
    AND u_planning.feature_key = 'quota_ai_planning'
  -- 事件导入使用量
  LEFT JOIN usages u_import ON s.user_id = u_import.user_id
    AND u_import.feature_key = 'quota_ai_import'
WHERE
  s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

