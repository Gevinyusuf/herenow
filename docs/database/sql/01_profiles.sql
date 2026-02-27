-- 1. 首先定义枚举类型
CREATE TYPE user_status AS ENUM ('pending', 'active', 'banned');

-- 2. 建表
CREATE TABLE profiles (
    -- 核心：主键直接使用 auth.users 的 UUID
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- 基础信息
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- UX 引导字段
    primary_intent TEXT DEFAULT 'HYBRID' CHECK (primary_intent IN ('CONSUMER', 'ORGANIZER', 'HYBRID')),
    
    -- 支付网关 ID
    billing_customer_id TEXT,

    -- 状态管理
    status user_status DEFAULT 'pending', 
    is_onboarded BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 必须开启
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: 自动同步
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        status
    )
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url',
        'pending'::user_status
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();