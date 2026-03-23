-- 为 plans 表添加 price 和 interval 字段

ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'month';

-- 更新套餐价格
UPDATE plans SET price = 0, interval = 'month' WHERE id = 'free';
UPDATE plans SET price = 9.99, interval = 'month' WHERE id = 'pro_monthly';
UPDATE plans SET price = 99.99, interval = 'year' WHERE id = 'pro_yearly';
UPDATE plans SET price = 0, interval = 'month' WHERE id = 'beta_tester';

-- 验证更新
SELECT id, name, price, interval FROM plans;
