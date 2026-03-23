-- 按功能类型展开的配额视图（推荐使用）
-- 每个 AI 功能类型返回一行记录，便于查询特定功能的配额

CREATE OR REPLACE VIEW
  "public"."v_user_entitlements_by_feature" AS
SELECT
  s.user_id,
  p.id AS plan_id,
  p.name AS plan_name,
  s.status AS subscription_status,
  s.current_period_end,
  feature.feature_key,
  feature.feature_name,
  -- 配额上限（从 plans.limits 读取）
  COALESCE(
    (p.limits ->> feature.feature_key)::integer,
    0
  ) AS quota_limit,
  -- 已使用量（从 usages 表读取）
  COALESCE(u.count, 0) AS quota_used,
  -- 剩余配额
  CASE
    WHEN (
      (p.limits ->> feature.feature_key)::integer
    ) = '-1'::integer THEN -1  -- -1 表示无限配额
    ELSE GREATEST(
      0,
      (
        (p.limits ->> feature.feature_key)::integer
      ) - COALESCE(u.count, 0)
    )
  END AS quota_remaining,
  -- 是否无限配额
  (
    (p.limits ->> feature.feature_key)::integer
  ) = '-1'::integer AS is_unlimited
FROM
  subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  -- 使用 CROSS JOIN 展开所有 AI 功能类型
  CROSS JOIN (
    VALUES
      ('quota_ai_text_generation', '文本生成'),
      ('quota_ai_image_generation', '图片生成'),
      ('quota_ai_chat', '对话聊天'),
      ('quota_ai_planning', '活动规划'),
      ('quota_ai_import', '事件导入'),
      ('quota_ai_generations', 'AI生成（统一）')  -- 向后兼容
  ) AS feature(feature_key, feature_name)
  -- 关联使用量
  LEFT JOIN usages u ON s.user_id = u.user_id
    AND u.feature_key = feature.feature_key
WHERE
  s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- 使用示例：
-- 查询用户所有 AI 功能的配额
-- SELECT * FROM v_user_entitlements_by_feature WHERE user_id = 'user-uuid';

-- 查询用户特定功能的配额
-- SELECT * FROM v_user_entitlements_by_feature 
-- WHERE user_id = 'user-uuid' AND feature_key = 'quota_ai_text_generation';
