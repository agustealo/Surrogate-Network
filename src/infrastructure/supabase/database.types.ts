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
          name: string
          email: string
          avatar_url?: string
          bio: string
          location?: string
          availability?: string
          boundaries?: Boundary[]
          rank?: number
          xp?: number
          token_balance?: number
          verification_status: VerificationStatus
          is_suspended?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          avatar_url?: string
          bio: string
          location?: string
          availability?: string
          boundaries?: Boundary[]
          rank?: number
          xp?: number
          token_balance?: number
          verification_status?: VerificationStatus
          is_suspended?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string
          bio?: string
          location?: string
          availability?: string
          boundaries?: Boundary[]
          rank?: number
          xp?: number
          token_balance?: number
          verification_status?: VerificationStatus
          is_suspended?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      needs: {
        Row: {
          id: string
          title: string
          description: string
          category: SurrogateCategory
          tags: string[]
          location_mode: LocationMode
          timing?: string
          boundaries: Boundary[]
          urgency?: Urgency
          status: NeedStatus
          user_id: string
          user_name: string
          user_avatar?: string
          created_at: string
          expires_at?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: SurrogateCategory
          tags?: string[]
          location_mode: LocationMode
          timing?: string
          boundaries: Boundary[]
          urgency?: Urgency
          status?: NeedStatus
          user_id: string
          user_name: string
          user_avatar?: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: SurrogateCategory
          tags?: string[]
          location_mode?: LocationMode
          timing?: string
          boundaries?: Boundary[]
          urgency?: Urgency
          status?: NeedStatus
          user_id?: string
          user_name?: string
          user_avatar?: string
          created_at?: string
          expires_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          title: string
          description: string
          category: SurrogateCategory
          location_mode: LocationMode
          timing?: string
          boundaries: Boundary[]
          capacity?: number
          current_capacity?: number
          status: OfferStatus
          user_id: string
          user_name: string
          user_avatar?: string
          rating?: number
          review_count?: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: SurrogateCategory
          location_mode: LocationMode
          timing?: string
          boundaries: Boundary[]
          capacity?: number
          current_capacity?: number
          status?: OfferStatus
          user_id: string
          user_name: string
          user_avatar?: string
          rating?: number
          review_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: SurrogateCategory
          location_mode?: LocationMode
          timing?: string
          boundaries?: Boundary[]
          capacity?: number
          current_capacity?: number
          status?: OfferStatus
          user_id?: string
          user_name?: string
          user_avatar?: string
          rating?: number
          review_count?: number
          created_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          need_id: string
          offer_id: string
          proposing_user_id: string
          receiving_user_id: string
          proposed_date?: string
          duration?: string
          frequency?: string
          location_method?: string
          message?: string
          status: ProposalStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          need_id: string
          offer_id: string
          proposing_user_id: string
          receiving_user_id: string
          proposed_date?: string
          duration?: string
          frequency?: string
          location_method?: string
          message?: string
          status?: ProposalStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          need_id?: string
          offer_id?: string
          proposing_user_id?: string
          receiving_user_id?: string
          proposed_date?: string
          duration?: string
          frequency?: string
          location_method?: string
          message?: string
          status?: ProposalStatus
          created_at?: string
          updated_at?: string
        }
      }
      surrogacies: {
        Row: {
          id: string
          need_id: string
          offer_id: string
          partner_ids: string[]
          status: SurrogacyStatus
          started_at: string
          ended_at?: string
          agreement?: Json
        }
        Insert: {
          id?: string
          need_id: string
          offer_id: string
          partner_ids: string[]
          status?: SurrogacyStatus
          started_at?: string
          ended_at?: string
          agreement?: Json
        }
        Update: {
          id?: string
          need_id?: string
          offer_id?: string
          partner_ids?: string[]
          status?: SurrogacyStatus
          started_at?: string
          ended_at?: string
          agreement?: Json
        }
      }
      moments: {
        Row: {
          id: string
          surrogacy_id: string
          scheduled_time: string
          duration: number
          status: MomentStatus
          location?: string
          notes?: string
          created_at: string
        }
        Insert: {
          id?: string
          surrogacy_id: string
          scheduled_time: string
          duration: number
          status?: MomentStatus
          location?: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          surrogacy_id?: string
          scheduled_time?: string
          duration?: number
          status?: MomentStatus
          location?: string
          notes?: string
          created_at?: string
        }
      }
      exchanges: {
        Row: {
          id: string
          moment_id: string
          surrogacy_id: string
          completed_at: string
          status: ExchangeStatus
        }
        Insert: {
          id?: string
          moment_id: string
          surrogacy_id: string
          completed_at?: string
          status?: ExchangeStatus
        }
        Update: {
          id?: string
          moment_id?: string
          surrogacy_id?: string
          completed_at?: string
          status?: ExchangeStatus
        }
      }
      feedback: {
        Row: {
          id: string
          exchange_id: string
          surrogacy_id: string
          from_user_id: string
          to_user_id: string
          rating: number
          breakdown: Json
          comments?: string
          skill_endorsements?: string[]
          created_at: string
        }
        Insert: {
          id?: string
          exchange_id: string
          surrogacy_id: string
          from_user_id: string
          to_user_id: string
          rating: number
          breakdown: Json
          comments?: string
          skill_endorsements?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          exchange_id?: string
          surrogacy_id?: string
          from_user_id?: string
          to_user_id?: string
          rating?: number
          breakdown?: Json
          comments?: string
          skill_endorsements?: string[]
          created_at?: string
        }
      }
      media_assets: {
        Row: {
          id: string
          owner_id: string
          type: MediaType
          url: string
          access_level: MediaAccessLevel
          alt_text?: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          type: MediaType
          url: string
          access_level?: MediaAccessLevel
          alt_text?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          type?: MediaType
          url?: string
          access_level?: MediaAccessLevel
          alt_text?: string
          created_at?: string
        }
      }
      media_access_requests: {
        Row: {
          id: string
          media_id: string
          from_user_id: string
          to_user_id: string
          status: MediaGrantStatus
          requested_at: string
          responded_at?: string
          expires_at?: string
        }
        Insert: {
          id?: string
          media_id: string
          from_user_id: string
          to_user_id: string
          status?: MediaGrantStatus
          requested_at?: string
          responded_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          from_user_id?: string
          to_user_id?: string
          status?: MediaGrantStatus
          requested_at?: string
          responded_at?: string
          expires_at?: string
        }
      }
      media_access_grants: {
        Row: {
          id: string
          media_id: string
          from_user_id: string
          to_user_id: string
          status: MediaGrantStatus
          granted_at: string
          expires_at?: string
        }
        Insert: {
          id?: string
          media_id: string
          from_user_id: string
          to_user_id: string
          status?: MediaGrantStatus
          granted_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          from_user_id?: string
          to_user_id?: string
          status?: MediaGrantStatus
          granted_at?: string
          expires_at?: string
        }
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: TransactionType
          reason: string
          reference_id?: string
          reference_type?: ReferenceType
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: TransactionType
          reason: string
          reference_id?: string
          reference_type?: ReferenceType
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: TransactionType
          reason?: string
          reference_id?: string
          reference_type?: ReferenceType
          created_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: XPSource
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source: XPSource
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source?: XPSource
          description?: string
          created_at?: string
        }
      }
      member_progression: {
        Row: {
          id: string
          user_id: string
          current_rank: number
          total_xp: number
          achievements: string[]
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_rank?: number
          total_xp?: number
          achievements?: string[]
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_rank?: number
          total_xp?: number
          achievements?: string[]
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          data?: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          body?: string
          data?: Json
          read?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reported_user_id: string
          reporter_user_id: string
          type: ReportType
          severity: Severity
          description: string
          status: ReportStatus
          created_at: string
          resolved_at?: string
          action_taken?: string
        }
        Insert: {
          id?: string
          reported_user_id: string
          reporter_user_id: string
          type: ReportType
          severity: Severity
          description: string
          status?: ReportStatus
          created_at?: string
          resolved_at?: string
          action_taken?: string
        }
        Update: {
          id?: string
          reported_user_id?: string
          reporter_user_id?: string
          type?: ReportType
          severity?: Severity
          description?: string
          status?: ReportStatus
          created_at?: string
          resolved_at?: string
          action_taken?: string
        }
      }
      restrictions: {
        Row: {
          id: string
          user_id: string
          type: RestrictionType
          reason: string
          expires_at?: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: RestrictionType
          reason: string
          expires_at?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: RestrictionType
          reason?: string
          expires_at?: string
          active?: boolean
          created_at?: string
        }
      }
      audit_events: {
        Row: {
          id: string
          actor_id: string
          action: string
          target_id?: string
          target_type?: string
          before?: Json
          after?: Json
          reason?: string
          timestamp: string
          ip_address?: string
          user_agent?: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          target_id?: string
          target_type?: string
          before?: Json
          after?: Json
          reason?: string
          timestamp?: string
          ip_address?: string
          user_agent?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          target_id?: string
          target_type?: string
          before?: Json
          after?: Json
          reason?: string
          timestamp?: string
          ip_address?: string
          user_agent?: string
        }
      }
    }
  }
}

// Type enums
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring'
export type SurrogateCategory = 'personal' | 'utilitarian_business' | 'casual'
export type LocationMode = 'remote' | 'local' | 'either'
export type Urgency = 'low' | 'medium' | 'high'
export type NeedStatus = 'active' | 'fulfilled' | 'paused' | 'expired'
export type OfferStatus = 'active' | 'paused' | 'full'
export type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn'
export type SurrogacyStatus = 'active' | 'paused' | 'ended' | 'completed'
export type MomentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed'
export type ExchangeStatus = 'completed' | 'partial' | 'disputed'
export type MediaType = 'image' | 'video' | 'audio' | 'document'
export type MediaAccessLevel = 'public' | 'private' | 'request_required'
export type MediaGrantStatus = 'pending' | 'granted' | 'denied' | 'expired'
export type TransactionType = 'earned' | 'spent' | 'granted' | 'penalty'
export type ReferenceType = 'exchange' | 'feedback' | 'proposal' | 'grant' | 'penalty'
export type XPSource = 'exchange' | 'feedback' | 'login' | 'profile_completion' | 'referral' | 'achievement'
export type NotificationType = 'message' | 'proposal' | 'surrogacy' | 'schedule' | 'media' | 'feedback' | 'token' | 'rank' | 'reward' | 'moderation' | 'system'
export type ReportType = 'harassment' | 'inappropriate_content' | 'boundary_violation' | 'spam' | 'impersonation' | 'other'
export type Severity = 'low' | 'medium' | 'high'
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed'
export type RestrictionType = 'suspension' | 'temporary_ban' | 'feature_restriction' | 'posting_ban'
export type VerificationStatus = 'unverified' | 'email_verified' | 'phone_verified' | 'photo_verified' | 'identity_verified' | 'fully_verified'