export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: { user_id: string; article_slug: string; saved_at: string }
        Insert: { user_id: string; article_slug: string; saved_at?: string }
        Update: { user_id?: string; article_slug?: string; saved_at?: string }
        Relationships: []
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          title: string
          summary: string
          topic: string
          tags: string[]
          references: string[]
          content: string
          article_slug: string | null
          saved_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          summary?: string
          topic?: string
          tags?: string[]
          references?: string[]
          content?: string
          article_slug?: string | null
          saved_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          summary?: string
          topic?: string
          tags?: string[]
          references?: string[]
          content?: string
          article_slug?: string | null
          saved_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: { id: string; display_name: string; bio: string; wallet_address: string | null; updated_at: string }
        Insert: { id: string; display_name?: string; bio?: string; wallet_address?: string | null; updated_at?: string }
        Update: { id?: string; display_name?: string; bio?: string; wallet_address?: string | null; updated_at?: string }
        Relationships: []
      }
      user_preferences: {
        Row: { user_id: string; theme: 'light' | 'dark' | 'system'; updated_at: string }
        Insert: { user_id: string; theme?: 'light' | 'dark' | 'system'; updated_at?: string }
        Update: { user_id?: string; theme?: 'light' | 'dark' | 'system'; updated_at?: string }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: { id: string; display_name: string; bio: string; updated_at: string }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
