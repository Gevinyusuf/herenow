# 数据库 SQL 文件说明

本目录包含 HereNow 数据库的 SQL 建表脚本，按模块组织。

## 文件执行顺序

请按照以下顺序执行 SQL 文件：

1. **01_users.sql** - 用户表
2. **02_plans.sql** - 套餐表（包含初始数据）
3. **03_subscriptions.sql** - 订阅表（依赖 users 和 plans）
4. **05_communities.sql** - 社群表（依赖 users）
5. **04_events.sql** - 活动表（依赖 communities 和 users）

## 使用说明

### 方式一：使用 psql 命令行

```bash
# 连接到数据库
psql -h localhost -U your_user -d your_database

# 按顺序执行
\i docs/database/sql/01_users.sql
\i docs/database/sql/02_plans.sql
\i docs/database/sql/03_subscriptions.sql
\i docs/database/sql/05_communities.sql
\i docs/database/sql/04_events.sql
```

### 方式二：使用 Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 按顺序复制粘贴每个 SQL 文件的内容并执行

### 方式三：使用数据库迁移工具

如果使用 Prisma、Alembic 等迁移工具，请将这些 SQL 转换为对应的迁移文件。

## 重要说明

### Supabase Auth 集成

- `users` 表中的 `supabase_user_id` 字段用于关联 Supabase Auth 系统
- 当用户通过 Google 登录时，Supabase Auth 会创建认证记录
- 应用层需要在用户首次登录时，将 Supabase Auth 的用户 ID 同步到 `users.supabase_user_id`

### 初始数据

- `02_plans.sql` 包含三个默认套餐（Free、Pro、Enterprise）
- 新用户注册时，应用层应自动创建 Free 套餐的订阅记录

### 触发器

所有表都包含 `updated_at` 自动更新触发器，使用 `update_updated_at_column()` 函数。

### 外键约束

- 所有外键都设置了 `ON DELETE CASCADE` 或适当的删除策略
- 删除用户时，相关订阅会级联删除
- 删除社群时，相关活动会级联删除

## 后续步骤

执行完这些 SQL 文件后，还需要：

1. 创建 `community_members` 表（社群成员关系表）
2. 创建 `registrations` 表（报名/订单表）
3. 配置 Row Level Security (RLS) 策略（Supabase）
4. 设置数据库备份策略

## 注意事项

- 生产环境执行前，请在测试环境验证
- 建议使用事务执行，确保原子性
- 执行前备份现有数据（如有）
- 检查数据库用户权限，确保有 CREATE TABLE、CREATE INDEX 等权限

