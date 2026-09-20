import type { Boundary, Database } from './database.types'

type BlocksTable = {
  Row: {
    id: string
    blocker_user_id: string
    blocked_user_id: string
    created_at: string
  }
  Insert: {
    id?: string
    blocker_user_id: string
    blocked_user_id: string
    created_at?: string
  }
  Update: {
    id?: string
    blocker_user_id?: string
    blocked_user_id?: string
    created_at?: string
  }
  Relationships: []
}

type PublicProfilesView = {
  Row: {
    id: string
    name: string
    avatar_url: string | null
    bio: string
    location: string | null
    availability: string | null
    boundaries: Boundary[] | null
    rank: number | null
    created_at: string | null
    updated_at: string | null
  }
  Relationships: []
}

/**
 * Runtime schema overlay for migrations that landed after the last committed
 * generated Supabase type snapshot. This keeps request/service clients fully
 * typed without weakening queries with casts or `any` while the generated base
 * file remains a reproducible artifact.
 */
export type RuntimeDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Views'> & {
    Tables: Database['public']['Tables'] & {
      blocks: BlocksTable
    }
    Views: {
      public_profiles: PublicProfilesView
    }
  }
}
