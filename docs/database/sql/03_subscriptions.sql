create table public.subscriptions (
  user_id uuid references auth.users not null primary key,
  plan_id text references public.plans,
  status text, -- active, trailing, canceled
  current_period_end timestamptz -- 用于重置配额
);


-- 1. 创建触发器函数：处理新用户订阅逻辑
create or replace function public.handle_new_user_beta()
returns trigger
language plpgsql
security definer -- 关键：以管理员权限运行，确保必定能写入
set search_path = public -- 安全最佳实践
as $$
begin
  insert into public.subscriptions (user_id, plan_id, status)
  values (
    new.id,               -- 新注册用户的 UUID
    'beta_early_access',  -- 硬编码：默认给 beta 套餐
    'active'
  )
  -- 防御性编程：如果因为某种原因该用户已有记录，则不做操作，防止报错
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2. 创建触发器：绑定到 auth.users 表
-- 先删除旧的（如果存在），方便反复调试
drop trigger if exists on_auth_user_created_beta on auth.users;

create trigger on_auth_user_created_beta
  after insert on auth.users
  for each row execute procedure public.handle_new_user_beta();



-- 历史数据刷新
insert into public.subscriptions (user_id, plan_id, status)
select 
  id,                   -- 来自 auth.users 的用户ID
  'beta_early_access',  -- 默认给 beta 套餐
  'active'
from auth.users
-- 关键条件：只选择那些还没有订阅记录的用户
where not exists (
  select 1 from public.subscriptions 
  where user_id = auth.users.id
)
-- 双重保险：防止并发冲突
on conflict (user_id) do nothing;



-- 自己的账号测试
insert into public.subscriptions (user_id, plan_id, status)
values ('178f1f37-34f9-4bb3-a1ca-570e5e7af3bc', 'pro_monthly', 'active');