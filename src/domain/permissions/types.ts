// Capability types and system
// Centralized permission model for the application

export type Capability =
  // Profile capabilities
  | 'VIEW_PROFILE'
  | 'EDIT_PROFILE'
  | 'EDIT_OWN_PROFILE'
  | 'DELETE_PROFILE'
  
  // Media capabilities
  | 'VIEW_PRIVATE_MEDIA'
  | 'REQUEST_MEDIA_ACCESS'
  | 'GRANT_MEDIA_ACCESS'
  | 'SEND_MEDIA'
  | 'UPLOAD_MEDIA'
  
  // Need capabilities
  | 'VIEW_NEEDS'
  | 'CREATE_NEED'
  | 'EDIT_OWN_NEED'
  | 'DELETE_OWN_NEED'
  | 'RESPOND_TO_NEED'
  
  // Offer capabilities
  | 'VIEW_OFFERS'
  | 'CREATE_OFFER'
  | 'EDIT_OWN_OFFER'
  | 'DELETE_OWN_OFFER'
  | 'REQUEST_OFFER'
  
  // Proposal capabilities
  | 'CREATE_PROPOSAL'
  | 'RESPOND_TO_PROPOSAL'
  | 'WITHDRAW_PROPOSAL'
  | 'COUNTER_PROPOSAL'
  
  // Surrogacy capabilities
  | 'VIEW_SURROGACIES'
  | 'CREATE_SURROGACY'
  | 'MANAGE_OWN_SURROGACY'
  | 'END_SURROGACY'
  | 'VIEW_SURROGACY_HISTORY'
  
  // Moment capabilities
  | 'SCHEDULE_MOMENT'
  | 'MODIFY_MOMENT'
  | 'COMPLETE_MOMENT'
  | 'VIEW_MOMENT_HISTORY'
  
  // Message capabilities
  | 'SEND_MESSAGES'
  | 'VIEW_MESSAGES'
  | 'SEND_MEDIA_MESSAGES'
  | 'START_GROUP_CHAT'
  
  // Feedback capabilities
  | 'VIEW_FEEDBACK'
  | 'GIVE_FEEDBACK'
  | 'VIEW_OWN_FEEDBACK'
  
  // Progression capabilities
  | 'VIEW_RANK'
  | 'VIEW_XP'
  | 'VIEW_ACHIEVEMENTS'
  | 'EARN_XP'
  | 'ADVANCE_RANK'
  
  // Token capabilities
  | 'VIEW_TOKENS'
  | 'SPEND_TOKENS'
  | 'EARN_TOKENS'
  | 'VIEW_TOKEN_LEDGER'
  
  // Admin capabilities
  | 'VIEW_ADMIN'
  | 'VIEW_ADMIN_MEMBERS'
  | 'MODERATE_MEMBERS'
  | 'VIEW_ADMIN_REPORTS'
  | 'MODERATE_CONTENT'
  | 'VIEW_ADMIN_MODERATION'
  | 'MODERATE_MEDIA'
  | 'VIEW_ADMIN_TOKENS'
  | 'MANAGE_TOKENS'
  | 'VIEW_ADMIN_LEDGER'
  | 'VIEW_ADMIN_AUDIT'
  | 'VIEW_ADMIN_SETTINGS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_ADMIN_RANKS'
  | 'MANAGE_RANKS'
  | 'VIEW_ADMIN_XP'
  | 'VIEW_ADMIN_HEALTH'
  | 'VIEW_ADMIN_ACTIVITY';

export type Actor = {
  id: string;
  role: string;
  rank: number;
  capabilities?: Capability[];
  isSuspended?: boolean;
};

export type Resource = {
  type: 'profile' | 'need' | 'offer' | 'proposal' | 'surrogacy' | 'moment' | 'media' | 'message' | 'feedback';
  id?: string;
  ownerId?: string;
  visibility?: 'public' | 'members' | 'connections' | 'surrogates' | 'selected' | 'private';
  requirements?: {
    minRank?: number;
    minXP?: number;
    verificationRequired?: boolean;
    tokenCost?: number;
  };
};

export type Context = {
  timestamp: Date;
  environment: 'development' | 'staging' | 'production';
  userAgent?: string;
  ipAddress?: string;
};

export interface CapabilityCheckResult {
  allowed: boolean;
  reason?: string;
  unlockRequirement?: string;
  unlockCost?: number;
}

export interface PermissionResolver {
  can(
    capability: Capability,
    actor: Actor,
    resource?: Resource,
    context?: Context
  ): CapabilityCheckResult;
  canAll(
    capabilities: Capability[],
    actor: Actor,
    resource?: Resource,
    context?: Context
  ): CapabilityCheckResult;
  canAny(
    capabilities: Capability[],
    actor: Actor,
    resource?: Resource,
    context?: Context
  ): CapabilityCheckResult;
}

// Rank-based capability requirements
export const RANK_REQUIREMENTS: Record<string, number> = {
  SEND_MEDIA: 5,
  HOST_POD: 8,
  FEATURE_PROFILE: 3,
  VIEW_PRIVATE_MEDIA: 5,
  START_GROUP_CHAT: 4,
};

// Verification-based capability requirements
export const VERIFICATION_REQUIREMENTS: Capability[] = [
  'CREATE_OFFER',
  'VIEW_PRIVATE_MEDIA',
  'SEND_MEDIA_MESSAGES',
];

// Admin capabilities by role
export const ADMIN_CAPABILITIES: Record<string, Capability[]> = {
  super_admin: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_MEMBERS',
    'MODERATE_MEMBERS',
    'VIEW_ADMIN_REPORTS',
    'MODERATE_CONTENT',
    'VIEW_ADMIN_MODERATION',
    'MODERATE_MEDIA',
    'VIEW_ADMIN_TOKENS',
    'MANAGE_TOKENS',
    'VIEW_ADMIN_LEDGER',
    'VIEW_ADMIN_AUDIT',
    'VIEW_ADMIN_SETTINGS',
    'MANAGE_SETTINGS',
    'VIEW_ADMIN_RANKS',
    'MANAGE_RANKS',
    'VIEW_ADMIN_XP',
    'VIEW_ADMIN_HEALTH',
    'VIEW_ADMIN_ACTIVITY',
  ],
  moderator: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_REPORTS',
    'MODERATE_CONTENT',
    'VIEW_ADMIN_MODERATION',
    'MODERATE_MEDIA',
    'VIEW_ADMIN_MEMBERS',
  ],
  trust_safety: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_REPORTS',
    'MODERATE_CONTENT',
    'VIEW_ADMIN_MODERATION',
    'MODERATE_MEDIA',
  ],
  community_manager: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_MEMBERS',
    'VIEW_ADMIN_ACTIVITY',
  ],
  economy_admin: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_TOKENS',
    'MANAGE_TOKENS',
    'VIEW_ADMIN_LEDGER',
  ],
  support: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_MEMBERS',
    'VIEW_ADMIN_REPORTS',
  ],
  analyst: [
    'VIEW_ADMIN',
    'VIEW_ADMIN_ACTIVITY',
    'VIEW_ADMIN_HEALTH',
  ],
};

export const isCapability = (capability: string): capability is Capability => {
  const allCapabilities: Capability[] = [
    // Profile
    'VIEW_PROFILE', 'EDIT_PROFILE', 'EDIT_OWN_PROFILE', 'DELETE_PROFILE',
    // Media
    'VIEW_PRIVATE_MEDIA', 'REQUEST_MEDIA_ACCESS', 'GRANT_MEDIA_ACCESS', 'SEND_MEDIA', 'UPLOAD_MEDIA',
    // Needs
    'VIEW_NEEDS', 'CREATE_NEED', 'EDIT_OWN_NEED', 'DELETE_OWN_NEED', 'RESPOND_TO_NEED',
    // Offers
    'VIEW_OFFERS', 'CREATE_OFFER', 'EDIT_OWN_OFFER', 'DELETE_OWN_OFFER', 'REQUEST_OFFER',
    // Proposals
    'CREATE_PROPOSAL', 'RESPOND_TO_PROPOSAL', 'WITHDRAW_PROPOSAL', 'COUNTER_PROPOSAL',
    // Surrogacies
    'VIEW_SURROGACIES', 'CREATE_SURROGACY', 'MANAGE_OWN_SURROGACY', 'END_SURROGACY', 'VIEW_SURROGACY_HISTORY',
    // Moments
    'SCHEDULE_MOMENT', 'MODIFY_MOMENT', 'COMPLETE_MOMENT', 'VIEW_MOMENT_HISTORY',
    // Messages
    'SEND_MESSAGES', 'VIEW_MESSAGES', 'SEND_MEDIA_MESSAGES', 'START_GROUP_CHAT',
    // Feedback
    'VIEW_FEEDBACK', 'GIVE_FEEDBACK', 'VIEW_OWN_FEEDBACK',
    // Progression
    'VIEW_RANK', 'VIEW_XP', 'VIEW_ACHIEVEMENTS', 'EARN_XP', 'ADVANCE_RANK',
    // Tokens
    'VIEW_TOKENS', 'SPEND_TOKENS', 'EARN_TOKENS', 'VIEW_TOKEN_LEDGER',
    // Admin
    'VIEW_ADMIN', 'VIEW_ADMIN_MEMBERS', 'MODERATE_MEMBERS', 'VIEW_ADMIN_REPORTS',
    'MODERATE_CONTENT', 'VIEW_ADMIN_MODERATION', 'MODERATE_MEDIA', 'VIEW_ADMIN_TOKENS',
    'MANAGE_TOKENS', 'VIEW_ADMIN_LEDGER', 'VIEW_ADMIN_AUDIT', 'VIEW_ADMIN_SETTINGS',
    'MANAGE_SETTINGS', 'VIEW_ADMIN_RANKS', 'MANAGE_RANKS', 'VIEW_ADMIN_XP',
    'VIEW_ADMIN_HEALTH', 'VIEW_ADMIN_ACTIVITY',
  ];
  
  return allCapabilities.includes(capability as Capability);
};