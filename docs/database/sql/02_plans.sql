create table public.plans (
  id text primary key, -- e.g., 'free', 'pro_monthly'
  name text,
  limits jsonb -- 核心设计：用JSONB存储各项限制
);
-- limits 示例: {"ai_calls": 10, "storage_gb": 1, "analytics_access": false}



-- 清理旧数据 (可选，开发阶段使用)
truncate table public.plans cascade;

insert into public.plans (id, name, limits)
values 
  -- 1. Free 套餐: 极其有限，用于吸引用户注册
  (
    'free', 
    'Free Plan', 
    '{
      "quota_ai_generations": 5,      
      "feature_community": false,
      "feature_discover": false
    }'::jsonb
  ),

  -- 2. Pro 套餐: 标准付费版
  (
    'pro_monthly', 
    'Pro Plan', 
    '{
      "quota_ai_generations": 100,
      "feature_community": true,
      "feature_discover": true
    }'::jsonb
  ),

  -- 3. Beta 套餐 (你要求的): 通常给早期种子用户，额度较高或全开，用于测试
  (
    'beta_early_access', 
    'Beta Tester', 
    '{
      "quota_ai_generations": 10,
      "feature_community": false,
      "feature_discover": false
    }'::jsonb
  );