export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_jobs: {
        Row: {
          attempt_count: number
          auth_deleted_at: string | null
          last_error: string | null
          prepared_at: string
          requested_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          auth_deleted_at?: string | null
          last_error?: string | null
          prepared_at?: string
          requested_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          auth_deleted_at?: string | null
          last_error?: string | null
          prepared_at?: string
          requested_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          id: string
          ip_address: string | null
          reason: string | null
          target_id: string | null
          target_type: string | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      command_idempotency: {
        Row: {
          actor_id: string | null
          aggregate_id: string | null
          command_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          key: string
          result: Json | null
        }
        Insert: {
          actor_id?: string | null
          aggregate_id?: string | null
          command_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key: string
          result?: Json | null
        }
        Update: {
          actor_id?: string | null
          aggregate_id?: string | null
          command_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "command_idempotency_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_idempotency_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchanges: {
        Row: {
          completed_at: string | null
          id: string
          moment_id: string
          status: Database["public"]["Enums"]["exchange_status"] | null
          surrogacy_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          moment_id: string
          status?: Database["public"]["Enums"]["exchange_status"] | null
          surrogacy_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          moment_id?: string
          status?: Database["public"]["Enums"]["exchange_status"] | null
          surrogacy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_surrogacy_id_fkey"
            columns: ["surrogacy_id"]
            isOneToOne: false
            referencedRelation: "surrogacies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          breakdown: Json
          comments: string | null
          created_at: string | null
          exchange_id: string
          from_user_id: string
          id: string
          rating: number
          skill_endorsements: string[] | null
          surrogacy_id: string
          to_user_id: string
        }
        Insert: {
          breakdown: Json
          comments?: string | null
          created_at?: string | null
          exchange_id: string
          from_user_id: string
          id?: string
          rating: number
          skill_endorsements?: string[] | null
          surrogacy_id: string
          to_user_id: string
        }
        Update: {
          breakdown?: Json
          comments?: string | null
          created_at?: string | null
          exchange_id?: string
          from_user_id?: string
          id?: string
          rating?: number
          skill_endorsements?: string[] | null
          surrogacy_id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_surrogacy_id_fkey"
            columns: ["surrogacy_id"]
            isOneToOne: false
            referencedRelation: "surrogacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_progression: {
        Row: {
          achievements: string[] | null
          created_at: string | null
          current_rank: number | null
          id: string
          level: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          created_at?: string | null
          current_rank?: number | null
          id?: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          created_at?: string | null
          current_rank?: number | null
          id?: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_progression_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_progression_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          created_at: string | null
          duration: number
          id: string
          location: string | null
          notes: string | null
          scheduled_time: string
          status: Database["public"]["Enums"]["moment_status"] | null
          surrogacy_id: string
        }
        Insert: {
          created_at?: string | null
          duration: number
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_time: string
          status?: Database["public"]["Enums"]["moment_status"] | null
          surrogacy_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_time?: string
          status?: Database["public"]["Enums"]["moment_status"] | null
          surrogacy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_surrogacy_id_fkey"
            columns: ["surrogacy_id"]
            isOneToOne: false
            referencedRelation: "surrogacies"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          boundaries: Database["public"]["Enums"]["boundary"][]
          category: Database["public"]["Enums"]["surrogate_category"]
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          location_mode: Database["public"]["Enums"]["location_mode"]
          status: Database["public"]["Enums"]["need_status"] | null
          tags: string[] | null
          timing: string | null
          title: string
          urgency: Database["public"]["Enums"]["urgency"] | null
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          boundaries?: Database["public"]["Enums"]["boundary"][]
          category: Database["public"]["Enums"]["surrogate_category"]
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          status?: Database["public"]["Enums"]["need_status"] | null
          tags?: string[] | null
          timing?: string | null
          title: string
          urgency?: Database["public"]["Enums"]["urgency"] | null
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          boundaries?: Database["public"]["Enums"]["boundary"][]
          category?: Database["public"]["Enums"]["surrogate_category"]
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          status?: Database["public"]["Enums"]["need_status"] | null
          tags?: string[] | null
          timing?: string | null
          title?: string
          urgency?: Database["public"]["Enums"]["urgency"] | null
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "needs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          boundaries: Database["public"]["Enums"]["boundary"][]
          capacity: number | null
          category: Database["public"]["Enums"]["surrogate_category"]
          created_at: string | null
          current_capacity: number | null
          description: string
          id: string
          location_mode: Database["public"]["Enums"]["location_mode"]
          rating: number | null
          review_count: number | null
          status: Database["public"]["Enums"]["offer_status"] | null
          timing: string | null
          title: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          boundaries?: Database["public"]["Enums"]["boundary"][]
          capacity?: number | null
          category: Database["public"]["Enums"]["surrogate_category"]
          created_at?: string | null
          current_capacity?: number | null
          description: string
          id?: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          rating?: number | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          timing?: string | null
          title: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          boundaries?: Database["public"]["Enums"]["boundary"][]
          capacity?: number | null
          category?: Database["public"]["Enums"]["surrogate_category"]
          created_at?: string | null
          current_capacity?: number | null
          description?: string
          id?: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          rating?: number | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          timing?: string | null
          title?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_events: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number | null
          event_type: string
          id: string
          last_error: string | null
          occurred_at: string | null
          payload: Json
          processed_at: string | null
          processing_until: string | null
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number | null
          event_type: string
          id?: string
          last_error?: string | null
          occurred_at?: string | null
          payload: Json
          processed_at?: string | null
          processing_until?: string | null
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number | null
          event_type?: string
          id?: string
          last_error?: string | null
          occurred_at?: string | null
          payload?: Json
          processed_at?: string | null
          processing_until?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string
          boundaries: Database["public"]["Enums"]["boundary"][] | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          location: string | null
          name: string
          rank: number | null
          token_balance: number | null
          trial_age_confirmed_at: string | null
          trial_deactivated_at: string | null
          trial_deleted_at: string | null
          trial_privacy_accepted_at: string | null
          trial_privacy_version: string | null
          trial_terms_accepted_at: string | null
          trial_terms_version: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          xp: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string
          boundaries?: Database["public"]["Enums"]["boundary"][] | null
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          location?: string | null
          name: string
          rank?: number | null
          token_balance?: number | null
          trial_age_confirmed_at?: string | null
          trial_deactivated_at?: string | null
          trial_deleted_at?: string | null
          trial_privacy_accepted_at?: string | null
          trial_privacy_version?: string | null
          trial_terms_accepted_at?: string | null
          trial_terms_version?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          xp?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string
          boundaries?: Database["public"]["Enums"]["boundary"][] | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          location?: string | null
          name?: string
          rank?: number | null
          token_balance?: number | null
          trial_age_confirmed_at?: string | null
          trial_deactivated_at?: string | null
          trial_deleted_at?: string | null
          trial_privacy_accepted_at?: string | null
          trial_privacy_version?: string | null
          trial_terms_accepted_at?: string | null
          trial_terms_version?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          xp?: number | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          countered_by_user_id: string | null
          created_at: string | null
          duration: string | null
          frequency: string | null
          id: string
          location_method: string | null
          message: string | null
          need_id: string
          offer_id: string
          proposed_date: string | null
          proposing_user_id: string
          receiving_user_id: string
          status: Database["public"]["Enums"]["proposal_status"] | null
          updated_at: string | null
        }
        Insert: {
          countered_by_user_id?: string | null
          created_at?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          location_method?: string | null
          message?: string | null
          need_id: string
          offer_id: string
          proposed_date?: string | null
          proposing_user_id: string
          receiving_user_id: string
          status?: Database["public"]["Enums"]["proposal_status"] | null
          updated_at?: string | null
        }
        Update: {
          countered_by_user_id?: string | null
          created_at?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          location_method?: string | null
          message?: string | null
          need_id?: string
          offer_id?: string
          proposed_date?: string | null
          proposing_user_id?: string
          receiving_user_id?: string
          status?: Database["public"]["Enums"]["proposal_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_countered_by_user_id_fkey"
            columns: ["countered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_countered_by_user_id_fkey"
            columns: ["countered_by_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_proposing_user_id_fkey"
            columns: ["proposing_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_proposing_user_id_fkey"
            columns: ["proposing_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_receiving_user_id_fkey"
            columns: ["receiving_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_receiving_user_id_fkey"
            columns: ["receiving_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string | null
          description: string
          id: string
          reported_user_id: string
          reporter_user_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity"]
          status: Database["public"]["Enums"]["report_status"] | null
          type: Database["public"]["Enums"]["report_type"]
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          description: string
          id?: string
          reported_user_id: string
          reporter_user_id: string
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["report_status"] | null
          type: Database["public"]["Enums"]["report_type"]
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          description?: string
          id?: string
          reported_user_id?: string
          reporter_user_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["report_status"] | null
          type?: Database["public"]["Enums"]["report_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restrictions: {
        Row: {
          active: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          reason: string
          type: Database["public"]["Enums"]["restriction_type"]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason: string
          type: Database["public"]["Enums"]["restriction_type"]
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string
          type?: Database["public"]["Enums"]["restriction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surrogacies: {
        Row: {
          agreement: Json | null
          ended_at: string | null
          id: string
          need_id: string
          offer_id: string
          partner_ids: string[]
          started_at: string | null
          status: Database["public"]["Enums"]["surrogacy_status"] | null
        }
        Insert: {
          agreement?: Json | null
          ended_at?: string | null
          id?: string
          need_id: string
          offer_id: string
          partner_ids: string[]
          started_at?: string | null
          status?: Database["public"]["Enums"]["surrogacy_status"] | null
        }
        Update: {
          agreement?: Json | null
          ended_at?: string | null
          id?: string
          need_id?: string
          offer_id?: string
          partner_ids?: string[]
          started_at?: string | null
          status?: Database["public"]["Enums"]["surrogacy_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "surrogacies_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surrogacies_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      surrogacy_participants: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          surrogacy_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string
          surrogacy_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          surrogacy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surrogacy_participants_surrogacy_id_fkey"
            columns: ["surrogacy_id"]
            isOneToOne: false
            referencedRelation: "surrogacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surrogacy_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surrogacy_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_action_rate_limits: {
        Row: {
          action_count: number
          action_key: string
          user_id: string
          window_started_at: string
        }
        Insert: {
          action_count: number
          action_key: string
          user_id: string
          window_started_at: string
        }
        Update: {
          action_count?: number
          action_key?: string
          user_id?: string
          window_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_action_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_action_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          source?: Database["public"]["Enums"]["xp_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          boundaries: Database["public"]["Enums"]["boundary"][] | null
          created_at: string | null
          id: string | null
          location: string | null
          name: string | null
          rank: number | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          boundaries?: Database["public"]["Enums"]["boundary"][] | null
          created_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rank?: number | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          boundaries?: Database["public"]["Enums"]["boundary"][] | null
          created_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rank?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_current_trial_policy: {
        Args: {
          p_age_confirmed: boolean
          p_privacy_version: string
          p_terms_version: string
        }
        Returns: undefined
      }
      accept_current_trial_policy_trusted: {
        Args: {
          p_age_confirmed: boolean
          p_privacy_version: string
          p_terms_version: string
          p_user_id: string
        }
        Returns: undefined
      }
      accept_proposal_for_trial: {
        Args: { p_proposal_id: string }
        Returns: string
      }
      accept_proposal_for_trial_trusted: {
        Args: { p_actor_id: string; p_proposal_id: string }
        Returns: string
      }
      admin_update_profile: {
        Args: {
          p_availability?: string
          p_avatar_url?: string
          p_bio?: string
          p_boundaries?: Database["public"]["Enums"]["boundary"][]
          p_email?: string
          p_id: string
          p_is_suspended?: boolean
          p_location?: string
          p_name?: string
          p_rank?: number
          p_token_balance?: number
          p_verification_status?: Database["public"]["Enums"]["verification_status"]
          p_xp?: number
        }
        Returns: {
          availability: string | null
          avatar_url: string | null
          bio: string
          boundaries: Database["public"]["Enums"]["boundary"][] | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          location: string | null
          name: string
          rank: number | null
          token_balance: number | null
          trial_age_confirmed_at: string | null
          trial_deactivated_at: string | null
          trial_deleted_at: string | null
          trial_privacy_accepted_at: string | null
          trial_privacy_version: string | null
          trial_terms_accepted_at: string | null
          trial_terms_version: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          xp: number | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      are_users_blocked: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      cancel_moment_for_trial: {
        Args: { p_moment_id: string }
        Returns: undefined
      }
      cancel_moment_for_trial_trusted: {
        Args: { p_actor_id: string; p_moment_id: string }
        Returns: undefined
      }
      cleanup_expired_idempotency: { Args: never; Returns: number }
      complete_moment_for_trial: {
        Args: {
          p_exchange_status?: Database["public"]["Enums"]["exchange_status"]
          p_moment_id: string
        }
        Returns: string
      }
      complete_moment_for_trial_trusted: {
        Args: {
          p_actor_id: string
          p_exchange_status?: Database["public"]["Enums"]["exchange_status"]
          p_moment_id: string
        }
        Returns: string
      }
      consume_trial_action_budget: {
        Args: {
          p_action_key: string
          p_limit: number
          p_user_id: string
          p_window: string
        }
        Returns: undefined
      }
      create_moment_for_trial: {
        Args: {
          p_duration: number
          p_location?: string
          p_notes?: string
          p_scheduled_time: string
          p_surrogacy_id: string
        }
        Returns: string
      }
      create_moment_for_trial_trusted: {
        Args: {
          p_actor_id: string
          p_duration: number
          p_location?: string
          p_notes?: string
          p_scheduled_time: string
          p_surrogacy_id: string
        }
        Returns: string
      }
      has_current_trial_consent: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      is_active_member: { Args: { p_user_id?: string }; Returns: boolean }
      is_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      moderate_report_for_trial: {
        Args: {
          p_action_taken?: string
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status"]
          p_suspend_reported_user?: boolean
        }
        Returns: undefined
      }
      moderate_report_for_trial_trusted: {
        Args: {
          p_action_taken?: string
          p_admin_id: string
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status"]
          p_suspend_reported_user?: boolean
        }
        Returns: undefined
      }
      prepare_trial_account_deletion: { Args: never; Returns: undefined }
      prepare_trial_account_deletion_trusted: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      record_trial_auth_deletion_attempt: {
        Args: { p_auth_deleted: boolean; p_error?: string; p_user_id: string }
        Returns: undefined
      }
      set_trial_account_participation: {
        Args: { p_active: boolean }
        Returns: undefined
      }
      set_trial_account_participation_trusted: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: undefined
      }
      submit_feedback_for_trial: {
        Args: {
          p_breakdown: Json
          p_comments?: string
          p_exchange_id: string
          p_rating: number
          p_skill_endorsements?: string[]
          p_to_user_id: string
        }
        Returns: string
      }
      submit_feedback_for_trial_trusted: {
        Args: {
          p_actor_id: string
          p_breakdown: Json
          p_comments?: string
          p_exchange_id: string
          p_rating: number
          p_skill_endorsements?: string[]
          p_to_user_id: string
        }
        Returns: string
      }
      transition_proposal_for_trial: {
        Args: {
          p_duration?: string
          p_frequency?: string
          p_location_method?: string
          p_message?: string
          p_new_status: Database["public"]["Enums"]["proposal_status"]
          p_proposal_id: string
          p_proposed_date?: string
        }
        Returns: Database["public"]["Enums"]["proposal_status"]
      }
      transition_proposal_for_trial_trusted: {
        Args: {
          p_actor_id: string
          p_duration?: string
          p_frequency?: string
          p_location_method?: string
          p_message?: string
          p_new_status: Database["public"]["Enums"]["proposal_status"]
          p_proposal_id: string
          p_proposed_date?: string
        }
        Returns: Database["public"]["Enums"]["proposal_status"]
      }
      update_token_balance: {
        Args: {
          p_amount: number
          p_reason: string
          p_transaction_type: Database["public"]["Enums"]["transaction_type"]
          p_user_id: string
        }
        Returns: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "token_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_xp: {
        Args: {
          p_amount: number
          p_description: string
          p_source: Database["public"]["Enums"]["xp_source"]
          p_user_id: string
        }
        Returns: {
          amount: number
          created_at: string | null
          description: string
          id: string
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "xp_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_admin_role: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      boundary:
        | "platonic"
        | "romantic"
        | "physical"
        | "virtual"
        | "one-off"
        | "recurring"
      exchange_status: "completed" | "partial" | "disputed"
      location_mode: "remote" | "local" | "either"
      moment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "missed"
      need_status: "active" | "fulfilled" | "paused" | "expired"
      notification_type:
        | "message"
        | "proposal"
        | "surrogacy"
        | "schedule"
        | "media"
        | "feedback"
        | "token"
        | "rank"
        | "reward"
        | "moderation"
        | "system"
      offer_status: "active" | "paused" | "full"
      proposal_status:
        | "pending"
        | "accepted"
        | "declined"
        | "countered"
        | "withdrawn"
      reference_type: "exchange" | "feedback" | "proposal" | "grant" | "penalty"
      report_status: "pending" | "investigating" | "resolved" | "dismissed"
      report_type:
        | "harassment"
        | "inappropriate_content"
        | "boundary_violation"
        | "spam"
        | "impersonation"
        | "other"
      restriction_type:
        | "suspension"
        | "temporary_ban"
        | "feature_restriction"
        | "posting_ban"
      severity: "low" | "medium" | "high"
      surrogacy_status: "active" | "paused" | "ended" | "completed"
      surrogate_category: "personal" | "utilitarian_business" | "casual"
      transaction_type: "earned" | "spent" | "granted" | "penalty"
      urgency: "low" | "medium" | "high"
      verification_status:
        | "unverified"
        | "email_verified"
        | "phone_verified"
        | "photo_verified"
        | "identity_verified"
        | "fully_verified"
      xp_source:
        | "exchange"
        | "feedback"
        | "login"
        | "profile_completion"
        | "referral"
        | "achievement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      boundary: [
        "platonic",
        "romantic",
        "physical",
        "virtual",
        "one-off",
        "recurring",
      ],
      exchange_status: ["completed", "partial", "disputed"],
      location_mode: ["remote", "local", "either"],
      moment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "missed",
      ],
      need_status: ["active", "fulfilled", "paused", "expired"],
      notification_type: [
        "message",
        "proposal",
        "surrogacy",
        "schedule",
        "media",
        "feedback",
        "token",
        "rank",
        "reward",
        "moderation",
        "system",
      ],
      offer_status: ["active", "paused", "full"],
      proposal_status: [
        "pending",
        "accepted",
        "declined",
        "countered",
        "withdrawn",
      ],
      reference_type: ["exchange", "feedback", "proposal", "grant", "penalty"],
      report_status: ["pending", "investigating", "resolved", "dismissed"],
      report_type: [
        "harassment",
        "inappropriate_content",
        "boundary_violation",
        "spam",
        "impersonation",
        "other",
      ],
      restriction_type: [
        "suspension",
        "temporary_ban",
        "feature_restriction",
        "posting_ban",
      ],
      severity: ["low", "medium", "high"],
      surrogacy_status: ["active", "paused", "ended", "completed"],
      surrogate_category: ["personal", "utilitarian_business", "casual"],
      transaction_type: ["earned", "spent", "granted", "penalty"],
      urgency: ["low", "medium", "high"],
      verification_status: [
        "unverified",
        "email_verified",
        "phone_verified",
        "photo_verified",
        "identity_verified",
        "fully_verified",
      ],
      xp_source: [
        "exchange",
        "feedback",
        "login",
        "profile_completion",
        "referral",
        "achievement",
      ],
    },
  },
} as const

