-- 更新套餐价格

UPDATE plans SET price = 0 WHERE id = 'free';
UPDATE plans SET price = 9.99 WHERE id = 'pro_monthly';
UPDATE plans SET price = 99.99 WHERE id = 'pro_yearly';
UPDATE plans SET price = 0 WHERE id = 'beta_tester';

-- 验证更新
SELECT id, name, price FROM plans;
