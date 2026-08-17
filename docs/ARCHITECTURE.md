# Surrogate Companion - Architecture Documentation

## Overview

Surrogate Companion is a Next.js application that facilitates needs-based relationships between members. The platform connects people who have needs with those who can fulfill them through structured surrogacy relationships.

## Technology Stack

**Frontend**:
- Next.js 15
- React
- TypeScript
- TanStack Query
- Radix UI / shadcn components
- Tailwind CSS

**Backend Platform**:
- Supabase (PostgreSQL, Auth, Storage, Realtime, Row Level Security)

**Architecture**:
- Domain-driven design
- Repository pattern
- Service layer orchestration
- RLS-based security

## Core Application Model

The platform follows this lifecycle: **Need → Offer → Discovery → Proposal → Surrogacy → Moment → Exchange → Feedback**

### Application Surfaces

The application is divided into three distinct surfaces with separate routing and layouts:

### 1. Public Application `(public)/`
**Purpose**: Explains the platform and converts visitors into members.

**Routes**:
- `/` - Landing page with value proposition
- `/how-it-works` - Platform explanation
- `/explore` - Public browse (if enabled)
- `/principles` - Core principles
- `/safety` - Safety information
- `/login` - Authentication
- `/join` - Registration/onboarding

**Navigation**: Public header with Sign In/Join actions only

### 2. Member Application `(member)/`
**Purpose**: Core member experience for finding connections and managing relationships.

**Routes**:
- `/home` - Personal relationship landscape (formerly `/dashboard`)
- `/discover` - Intent-based discovery (formerly `/matches`)
- `/needs` - View and manage your needs
- `/needs/create` - Create a new need
- `/offers` - View and manage your offers  
- `/offers/create` - Create a new offer
- `/surrogacies` - Active relationships
- `/surrogacies/[id]` - Individual surrogacy workspace
- `/messages` - Context-aware messaging (formerly `/chat`)
- `/messages/[id]` - Individual conversation
- `/rewards` - Rank progression and achievements
- `/profile` - Your profile
- `/profile/[id]` - View another member's profile
- `/settings` - Account and preferences

**Navigation**: 
- Desktop: Sidebar navigation with member sections
- Mobile: Bottom navigation with center "Create" action

### 3. Admin Application `admin/`
**Purpose**: Administrative console for platform management.

**Routes**:
- `/admin` - Dashboard overview
- `/admin/members` - Member management
- `/admin/needs` - Content moderation - needs
- `/admin/offers` - Content moderation - offers
- `/admin/surrogacies` - Active relationship oversight
- `/admin/feedback` - Feedback review
- `/admin/reports` - Safety reports management
- `/admin/moderation` - Moderation queue
- `/admin/media` - Media content review
- `/admin/tokens` - Token economy management
- `/admin/ledger` - Transaction ledger
- `/admin/ranks` - Rank system management
- `/admin/xp` - XP progression oversight
- `/admin/audit` - Audit log
- `/admin/settings` - Platform configuration

**Navigation**: Collapsible sidebar with role-based access control

## Component Architecture

### UI Components Hierarchy

```
src/components/
├── ui/              # Primitive reusable components (Radix-based)
├── shared/          # Cross-surface reusable components
├── public/          # Public surface specific components
├── member/          # Member surface specific components
└── admin/           # Admin surface specific components
```

### Domain Components

The platform uses domain-specific components that reflect the core vocabulary:

#### Need/Offer Components
- `NeedCard` - Displays a need request
- `OfferCard` - Displays an offer with compatibility
- `BoundaryChip` - Shows boundary types
- `AvailabilityChip` - Shows timing/location preferences

#### Profile Components  
- `ProfileHeader` - Top section with media and identity
- `ProfileMedia` - Profile images and blur states
- `BlurredAvatar` - Avatar with permission-based blur
- `RankBadge` - Display current rank
- `TrustBadge` - Verification and trust indicators
- `CompatibilityMeter` - Visual compatibility score

#### Feedback Components
- `FeedbackSummary` - Compact feedback overview
- `RatingBreakdown` - Detailed rating dimensions
- `EmptyState` - Consistent empty state across surfaces

#### Permission Components
- `PermissionGate` - Capability-based content gating
- `TokenAmount` - Token balance display

## State Management Philosophy

**Pages render. Components present. Services orchestrate. Domains decide. Repositories persist.**

React pages do not become containers for substantial business logic. The architecture follows:

```
Page → Feature hook/controller → Application service → Repository → Supabase
```

### Layer Responsibilities

- **App/Components** - Render the product and handle user interaction
- **Application** - Perform use cases and orchestrate domain operations  
- **Domain** - Contain business logic and truth
- **Repositories** - Define persistence contracts
- **Infrastructure** - Implement repositories with Supabase

## Mobile-First Design

Primary design breakpoint priority:
1. Mobile
2. Desktop  
3. Tablet refinements

Mobile navigation uses bottom navigation with center "Create" action that opens:
- Create Need
- Create Offer
- Create Pod (disabled/coming soon)
- Create Event (disabled/coming soon)

## Core Domain Vocabulary

### Primary Entities
- **Need** - Something the member wants fulfilled
- **Offer** - Something the member is willing to provide
- **Proposal** - A request to establish a Surrogacy around a Need and Offer
- **Surrogacy** - The active relationship arrangement
- **Moment** - A scheduled occurrence of the Surrogacy
- **Exchange** - A completed Moment or recorded fulfillment
- **Feedback** - Contextual evaluation of the completed Exchange

### Supporting Concepts
- **Grant** - Permission to access private information or media
- **Token** - Spendable network resource
- **XP** - Permanent progression resource
- **Rank** - Earned capability level

## Permission System

The platform uses capability-based access control rather than simple role checks. Capabilities include:

- `SEND_MEDIA`, `REQUEST_MEDIA_ACCESS`, `CREATE_OFFER`, `HOST_POD`
- `VIEW_PRIVATE_MEDIA`, `FEATURE_PROFILE`, `ADMIN_VIEW_MEMBERS`, etc.

UI components check capabilities through a canonical interface rather than scattered conditional logic.

## Route Migration

| Old Route | New Route | Status |
|-----------|-----------|--------|
| `/dashboard` | `/home` | Completed |
| `/matches` | `/discover` | Completed |
| `/chat` | `/messages` | Completed |
| `/profile/[id]` | `/profile/[id]` | Preserved |
| `/profile/create` | Onboarding flow | Planned |
| `/needs/create` | `/needs/create` | Preserved |
| `/feedback/submit` | Contextual flow | Planned |

## Accessibility Standards

The platform targets WCAG 2.2 AA compliance including:
- Keyboard navigation
- Focus-visible styles
- Correct semantic headings
- Accessible dialog focus management
- Form labels and error summaries
- ARIA where necessary
- Sufficient contrast ratios
- Touch target sizing
- Reduced-motion support
- Screen reader descriptions for media states

## Loading/Error/Empty States

All async screens support:
- `loading` - Active loading state
- `success` - Successful completion
- `empty` - No data available
- `error` - Error occurred
- `permission_denied` - Access restricted
- `not_found` - Resource missing
- `offline/degraded` - Connectivity issues

## Performance Considerations

- Preserve Server Components where practical
- Lazy-load heavy charts and dialogs
- Optimize images and media
- Introduce pagination for large collections
- Use Supabase indexes for efficient queries
- Leverage Supabase Realtime for collaborative features

## Security Principles

1. **UI is not authorization** - Hiding buttons is not access control
2. **Data-layer protection** - All sensitive operations protected server-side
3. **Privacy-aware rendering** - Private data never exposed in HTML/JSON then hidden visually
4. **Consent-based media** - Blur states represent actual visibility permissions
5. **Audit trail** - Admin actions logged with actor, target, before/after states

## Development Workflow

1. **Feature Development** - Work within appropriate route group
2. **Component Creation** - Place in appropriate component directory
3. **Type Safety** - Use domain types from `src/domain/types.ts`
4. **Testing** - Unit, component, integration, and E2E tests
5. **Documentation** - Update relevant architecture docs
6. **Code Review** - Focus on type safety, accessibility, and consistency

## File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   ├── (member)/          # Member routes  
│   ├── admin/             # Admin routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/               # Primitive UI components
│   ├── shared/           # Cross-surface components
│   ├── public/           # Public-specific components
│   ├── member/           # Member-specific components
│   ├── admin/            # Admin-specific components
│   └── layout/           # Layout components
├── domain/               # Domain types and business logic
├── application/          # Use case orchestration
│   ├── commands/         # Write operations
│   ├── queries/          # Read operations
│   ├── services/         # Business services
│   └── events/           # Event handling
├── repositories/         # Persistence interfaces
├── infrastructure/       # Supabase implementation
│   ├── supabase/         # Supabase clients and config
│   ├── storage/          # Storage implementation
│   └── realtime/         # Realtime implementation
├── lib/                  # Utilities and helpers
└── hooks/                # React hooks
```

## Design Tokens

Centralized design system includes:
- Spacing scale
- Border radius
- Typography scale
- Elevation levels
- Semantic colors (surface, muted, accent, success, warning, danger, need, offer, surrogacy, trust, premium, token)
- Animation durations
- Layout widths

## Analytics Convention

Events follow snake_case naming:
- `need_created`, `offer_created`, `discover_viewed`
- `proposal_started`, `proposal_sent`, `proposal_accepted`
- `surrogacy_viewed`, `profile_viewed`, `media_access_requested`
- `feedback_viewed`

Sensitive content (like messages) is never stored in analytics.

## Deferred Systems

The following systems are architecturally anticipated but not implemented in this sprint:
- Community governance, Treasury, DAO mechanics
- Advanced Pods, full Battle Pass, leaderboards, seasonal events
- Premium dominance mechanics, advanced AI matching
- Complex fraud detection, recommendation learning
- VR/AR support, hybrid AI Surrogates
- Full Trust & Safety automation, large analytics suite
- Advanced admin configuration, deep relationship intelligence
- Token inflation controls, full economy management
- **Supabase advanced features** (Realtime collaborative features, advanced RLS policies)

## Backend Infrastructure

### Supabase Configuration
- **Database**: PostgreSQL with proper indexing and constraints
- **Auth**: Built-in authentication with email/password providers
- **Storage**: File storage for media assets with access controls
- **Realtime**: WebSocket connections for real-time features
- **RLS**: Row-level security for all user-controlled tables

### Database Schema
All tables follow the naming convention `snake_case` and include:
- `id` (UUID primary key)
- `created_at` and `updated_at` timestamps
- Proper foreign key relationships
- Indexes for frequently queried columns

### Security
- All member-controlled tables have RLS policies
- Service role key for admin operations
- API key separation between anon and service roles
- Audit trail for all administrative actions

---

This architecture provides a scalable foundation for the core relationship runtime while maintaining clear separation between public, member, and admin experiences. The mobile-first design, capability-based permissions, and domain-driven component structure support both current needs and future feature development.