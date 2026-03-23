-- Mock 数据脚本
-- 为用户 ID: 2b47c0ca-b225-4575-a7cb-441ab9474db6 创建测试数据
-- 
-- 执行前提：
-- 1. 确保已执行 01_profiles.sql, 02_plans.sql, 03_subscriptions.sql, 05_communities.sql, 04_events.sql
-- 2. 确保该用户已在 auth.users 和 public.profiles 中存在

-- ============================================
-- 1. 确保用户 Profile 存在（如果不存在则创建）
-- ============================================
INSERT INTO public.profiles (id, email, full_name, avatar_url, primary_intent, is_onboarded)
VALUES (
    '2b47c0ca-b225-4575-a7cb-441ab9474db6',
    'test@herenow.com',
    'Test User',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    'HYBRID',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    primary_intent = EXCLUDED.primary_intent,
    is_onboarded = EXCLUDED.is_onboarded;

-- ============================================
-- 2. 获取或创建 Free Plan（如果不存在）
-- ============================================
DO $$
DECLARE
    v_free_plan_id UUID;
BEGIN
    -- 检查 Free Plan 是否存在
    SELECT id INTO v_free_plan_id FROM plans WHERE slug = 'free' LIMIT 1;
    
    -- 如果不存在，创建 Free Plan
    IF v_free_plan_id IS NULL THEN
        INSERT INTO plans (slug, name, description, price_amount, currency, interval, limits, is_active)
        VALUES (
            'free',
            'Free Plan',
            '免费套餐，适合个人用户',
            0,
            'USD',
            'month',
            '{"max_events": 3, "commission_rate": 0.10}'::jsonb,
            TRUE
        )
        RETURNING id INTO v_free_plan_id;
    END IF;
END $$;

-- ============================================
-- 3. 创建 Subscription（订阅关系）
-- ============================================
INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    gateway_subscription_id
)
SELECT 
    '2b47c0ca-b225-4575-a7cb-441ab9474db6'::UUID,
    p.id,
    'active',
    NOW() - INTERVAL '10 days',  -- 订阅开始于 10 天前
    NOW() + INTERVAL '20 days',  -- 订阅结束于 20 天后
    'mock_subscription_' || gen_random_uuid()::TEXT
FROM plans p
WHERE p.slug = 'free'
ON CONFLICT DO NOTHING;  -- 如果已存在订阅，不覆盖

-- ============================================
-- 4. 创建 Community（社群）
-- ============================================
DO $$
DECLARE
    v_community_id UUID;
    v_community_id_2 UUID;
    v_user_id UUID := '2b47c0ca-b225-4575-a7cb-441ab9474db6'::UUID;
BEGIN
    -- 创建第一个社群
    INSERT INTO public.communities (
        owner_id,
        name,
        slug,
        description,
        logo_url,
        cover_image_url,
        settings,
        members_count,
        events_count
    )
    VALUES (
        '2b47c0ca-b225-4575-a7cb-441ab9474db6'::UUID,
        'Tech Meetup Community',
        'tech-meetup-community',
        '一个专注于技术交流和学习的社群，定期举办技术分享会、编程马拉松等活动。',
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop',
        '{"social_links": {"twitter": "https://twitter.com/techmeetup", "github": "https://github.com/techmeetup"}, "contact_email": "contact@techmeetup.com", "color_theme": "#3b82f6"}'::jsonb,
        25,
        2
    )
    RETURNING id INTO v_community_id;
    
    -- 创建第二个社群
    INSERT INTO public.communities (
        owner_id,
        name,
        slug,
        description,
        logo_url,
        cover_image_url,
        settings,
        members_count,
        events_count
    )
    VALUES (
        '2b47c0ca-b225-4575-a7cb-441ab9474db6'::UUID,
        'Design Workshop',
        'design-workshop',
        '设计师社群，分享设计理念、工具使用和行业趋势。',
        'https://images.unsplash.com/photo-1561070791-2526daf94c69?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=400&fit=crop',
        '{"social_links": {"instagram": "https://instagram.com/designworkshop"}, "contact_email": "hello@designworkshop.com", "color_theme": "#ec4899"}'::jsonb,
        18,
        1
    );
END $$;

-- ============================================
-- 5. 创建 Events（活动）
-- ============================================
-- 获取刚创建的社群 ID
DO $$
DECLARE
    v_community_id UUID;
    v_user_id UUID := '2b47c0ca-b225-4575-a7cb-441ab9474db6'::UUID;
BEGIN
    -- 获取第一个社群 ID
    SELECT id INTO v_community_id 
    FROM communities 
    WHERE owner_id = v_user_id 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- 创建第一个活动（已发布）
    INSERT INTO public.events (
        community_id,
        organizer_id,
        title,
        slug,
        description,
        cover_image_url,
        start_at,
        end_at,
        timezone,
        status,
        is_public,
        location_config,
        ticket_config,
        capacity,
        registrations_count
    )
    VALUES (
        v_community_id,
        v_user_id,
        'React 18 新特性分享会',
        'react-18-features-2025',
        '{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "深入探讨 React 18 的新特性，包括 Concurrent Rendering、Suspense 改进、自动批处理等。适合有一定 React 基础的开发者。"}]}]}'::jsonb,
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop',
        NOW() + INTERVAL '7 days',  -- 7 天后开始
        NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
        'Asia/Shanghai',
        'PUBLISHED',
        TRUE,
        '{"type": "offline", "address": "北京市朝阳区科技园区创新大厦 3 层", "lat": 39.9042, "lng": 116.4074}'::jsonb,
        '{"tickets": [{"name": "早鸟票", "price": 0, "limit": 50, "sold": 25}, {"name": "标准票", "price": 0, "limit": 50, "sold": 10}]}'::jsonb,
        100,
        35
    );
    
    -- 创建第二个活动（草稿）
    INSERT INTO public.events (
        community_id,
        organizer_id,
        title,
        slug,
        description,
        cover_image_url,
        start_at,
        end_at,
        timezone,
        status,
        is_public,
        location_config,
        ticket_config,
        capacity,
        registrations_count
    )
    VALUES (
        v_community_id,
        v_user_id,
        'TypeScript 进阶实战',
        'typescript-advanced-2025',
        '{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "从类型系统到高级类型，从工具类型到实战应用，全面掌握 TypeScript。"}]}]}'::jsonb,
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=600&fit=crop',
        NOW() + INTERVAL '30 days',  -- 30 天后开始
        NOW() + INTERVAL '30 days' + INTERVAL '4 hours',
        'Asia/Shanghai',
        'DRAFT',
        TRUE,
        '{"type": "online", "platform": "Zoom", "link": "https://zoom.us/j/123456789"}'::jsonb,
        '{"tickets": [{"name": "免费票", "price": 0, "limit": 200, "sold": 0}]}'::jsonb,
        200,
        0
    );
    
    -- 如果还有第二个社群，为其创建一个活动
    SELECT id INTO v_community_id 
    FROM communities 
    WHERE owner_id = v_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF v_community_id IS NOT NULL THEN
        INSERT INTO public.events (
            community_id,
            organizer_id,
            title,
            slug,
            description,
            cover_image_url,
            start_at,
            end_at,
            timezone,
            status,
            is_public,
            location_config,
            ticket_config,
            capacity,
            registrations_count
        )
        VALUES (
            v_community_id,
            v_user_id,
            'UI/UX 设计工作坊',
            'ui-ux-workshop-2025',
            '{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "学习现代 UI/UX 设计原则，实践设计工具的使用，完成一个完整的项目设计。"}]}]}'::jsonb,
            'https://images.unsplash.com/photo-1561070791-2526daf94c69?w=1200&h=600&fit=crop',
            NOW() + INTERVAL '14 days',
            NOW() + INTERVAL '14 days' + INTERVAL '6 hours',
            'Asia/Shanghai',
            'PUBLISHED',
            TRUE,
            '{"type": "offline", "address": "上海市徐汇区设计创意园区 A 座 5 层", "lat": 31.2304, "lng": 121.4737}'::jsonb,
            '{"tickets": [{"name": "学生票", "price": 50, "limit": 20, "sold": 8}, {"name": "标准票", "price": 100, "limit": 30, "sold": 12}]}'::jsonb,
            50,
            20
        );
    END IF;
END $$;

-- ============================================
-- 6. 验证数据
-- ============================================
-- 查询创建的数据
SELECT 
    'Profile' as table_name,
    id,
    email,
    full_name
FROM profiles
WHERE id = '2b47c0ca-b225-4575-a7cb-441ab9474db6'

UNION ALL

SELECT 
    'Subscription' as table_name,
    s.id::TEXT,
    p.name as email,
    s.status as full_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = '2b47c0ca-b225-4575-a7cb-441ab9474db6'

UNION ALL

SELECT 
    'Community' as table_name,
    id::TEXT,
    name as email,
    slug as full_name
FROM communities
WHERE owner_id = '2b47c0ca-b225-4575-a7cb-441ab9474db6'

UNION ALL

SELECT 
    'Event' as table_name,
    id::TEXT,
    title as email,
    status as full_name
FROM events
WHERE organizer_id = '2b47c0ca-b225-4575-a7cb-441ab9474db6';

-- ============================================
-- 完成
-- ============================================
-- 已为用户 2b47c0ca-b225-4575-a7cb-441ab9474db6 创建：
-- 1. Profile 记录（如果不存在）
-- 2. Free Plan 订阅（active 状态）
-- 3. 2 个 Communities（社群）
-- 4. 3 个 Events（活动，包含已发布和草稿状态）

