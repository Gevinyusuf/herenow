-- 为 subscriptions 表添加 created_at 字段
-- 用于记录订阅创建时间，便于排序和查询

-- 添加 created_at 字段
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW();

-- 为已有数据设置默认值（如果字段刚添加且数据为空）
UPDATE public.subscriptions
SET created_at = NOW()
WHERE created_at IS NULL;

-- 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at 
ON public.subscriptions(created_at);

-- 验证字段添加成功
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'created_at';

