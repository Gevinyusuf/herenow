-- 更新 plans 表的配额配置，使用正确的独立配额 Key

-- 1. 清理旧数据（可选，开发阶段使用）
-- truncate table public.plans cascade;

-- 2. 更新 Free 套餐的配额配置
update public.plans
set limits = '{
  "quota_ai_text_generation": 10,
  "quota_ai_image_generation": 5,
  "quota_ai_chat": 20,
  "quota_ai_planning": 5,
  "quota_ai_import": 2,
  "feature_community": false,
  "feature_discover": false
}'::jsonb
where id = 'free';

-- 3. 更新 Pro 套餐的配额配置
update public.plans
set limits = '{
  "quota_ai_text_generation": 100,
  "quota_ai_image_generation": 50,
  "quota_ai_chat": 200,
  "quota_ai_planning": 50,
  "quota_ai_import": 20,
  "feature_community": true,
  "feature_discover": true
}'::jsonb
where id = 'pro_monthly';

-- 4. 更新 Beta 套餐的配额配置
update public.plans
set limits = '{
  "quota_ai_text_generation": 50,
  "quota_ai_image_generation": 25,
  "quota_ai_chat": 100,
  "quota_ai_planning": 25,
  "quota_ai_import": 10,
  "feature_community": false,
  "feature_discover": false
}'::jsonb
where id = 'beta_early_access';

-- 5. 验证更新结果
select id, name, limits from public.plans;
