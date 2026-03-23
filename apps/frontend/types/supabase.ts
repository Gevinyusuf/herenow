/**
 * Supabase Database 类型定义
 * 
 * 这是一个基础类型定义文件。
 * 在生产环境中，应该使用 Supabase CLI 自动生成：
 * npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          primary_intent: string | null
          status: 'pending' | 'active' | 'banned' | null
          is_onboarded: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          primary_intent?: string | null
          status?: 'pending' | 'active' | 'banned' | null
          is_onboarded?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          primary_intent?: string | null
          status?: 'pending' | 'active' | 'banned' | null
          is_onboarded?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          community_id: string | null
          organizer_id: string
          title: string
          slug: string
          description: Json | null
          cover_image_url: string | null
          start_at: string | null
          end_at: string | null
          timezone: string | null
          status: string | null
          is_public: boolean | null
          location_config: Json | null
          ticket_config: Json | null
          capacity: number | null
          registrations_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          community_id?: string | null
          organizer_id: string
          title: string
          slug: string
          description?: Json | null
          cover_image_url?: string | null
          start_at?: string | null
          end_at?: string | null
          timezone?: string | null
          status?: string | null
          is_public?: boolean | null
          location_config?: Json | null
          ticket_config?: Json | null
          capacity?: number | null
          registrations_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          community_id?: string | null
          organizer_id?: string
          title?: string
          slug?: string
          description?: Json | null
          cover_image_url?: string | null
          start_at?: string | null
          end_at?: string | null
          timezone?: string | null
          status?: string | null
          is_public?: boolean | null
          location_config?: Json | null
          ticket_config?: Json | null
          capacity?: number | null
          registrations_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      communities: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_image_url: string | null
          settings: Json | null
          members_count: number | null
          events_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          settings?: Json | null
          members_count?: number | null
          events_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          settings?: Json | null
          members_count?: number | null
          events_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      v_my_plan_features: {
        Row: {
          user_id: string
          plan_name: string
          plan_slug: string
          max_events: number | null
          commission_rate: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

