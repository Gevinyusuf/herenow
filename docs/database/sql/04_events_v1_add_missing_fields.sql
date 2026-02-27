-- 为 events_v1 表添加缺失的字段
-- 用于存储票务配置和联合主办方信息

-- 添加 ticket_config JSONB 字段（存储票务信息）
ALTER TABLE events_v1 
ADD COLUMN IF NOT EXISTS ticket_config JSONB DEFAULT '{"tickets": []}'::jsonb;

-- 添加 co_hosts JSONB 字段（存储联合主办方）
ALTER TABLE events_v1 
ADD COLUMN IF NOT EXISTS co_hosts JSONB DEFAULT '[]'::jsonb;

-- 添加注释说明
COMMENT ON COLUMN events_v1.ticket_config IS '票务配置，存储票种、价格、数量等信息';
COMMENT ON COLUMN events_v1.co_hosts IS '联合主办方列表，存储主办方ID和相关信息';

