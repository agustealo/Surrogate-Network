# Surrogate Network

A needs-based social companion platform for meaningful exchanges of support, companionship, and capability.

## About

Surrogate Network is a social co-op where members articulate their Needs and Offers so the product can model fulfillment instead of simple connection counts. Members can publish what they need, describe what they can provide, discover compatible matches, and move from proposal to ongoing relationship.

## Core Model

- **Needs**: Something a member wants fulfilled.
- **Offers**: Something a member is willing and able to provide.
- **Surrogacies**: Established relationships around one or more Needs and Offers.
- **Moments**: Scheduled or completed occurrences inside a Surrogacy.
- **Exchanges**: Records of agreed interactions, feedback, trust, XP, and token effects.

The intended loop is:

```text
Need -> Discovery -> Proposal -> Agreement -> Surrogacy -> Moment -> Exchange -> Feedback -> Trust/XP/Tokens -> Better Discovery
```

## Current Product Surface

- Public, member, and admin route groups with surface-specific layouts.
- Centralized navigation registry for public, member, and admin shells.
- Working member experiences for home, discover, messages, rewards, settings, feedback submission, and create flows for profiles and needs.
- Placeholder route surfaces for some public/member lifecycle pages that are present for IA and navigation ownership, but not fully implemented yet.
- Supabase-backed repositories for profiles, needs, offers, and capability data.
- Explicit demo-mode fixtures for local iteration and CI smoke coverage.
- Jest, Playwright, lint, typecheck, build, security, and navigation validation scripts.

### Route Ownership

- `src/app/layout.tsx` provides global HTML and providers only.
- `src/app/(public)/layout.tsx` owns public navigation and footer.
- `src/app/(member)/layout.tsx` owns the authenticated member shell and mobile navigation.
- `src/app/admin/layout.tsx` owns the admin shell.

### Placeholder Surfaces

These routes currently render placeholder content while preserving the correct layout and navigation boundaries:

- Public: `/explore`, `/how-it-works`, `/principles`, `/safety`
- Member: `/needs`, `/offers`, `/profile`, `/surrogacies`

## Roadmap

### Phase 0: Foundation

- Basic profile system.
- Simple needs/offers discovery.
- Mock proposal flow.
- Need tagging and form helpers.
- Initial UI component system.

### Phase 1: Relationship Loop

Goal: make the central Surrogate lifecycle real end to end.

Key deliverables:

- Complete social objects: Need, Offer, Surrogacy, Moment, and Exchange.
- Full proposal lifecycle: counter, accept, decline, and agreement.
- Compatibility matrix with clear matching breakdowns.
- Boundary system across global, Surrogacy, and Moment contexts.
- Consent and permission infrastructure.
- Scheduling and availability primitives.
- Trust matrix, XP, rank progression, and token ledger.
- Media visibility controls.
- Operational admin console and audit logging.

### Phase 2: Community Systems

- Advanced pods.
- Community governance and treasury.
- Advanced media permissions.
- Relationship analytics.
- Social landscape intelligence.
- Fraud and abuse detection.

## Getting Started

### Prerequisites

- Node.js 22 or newer.
- npm.
- A Supabase project for database/auth/storage features.
- An OpenAI API key if AI-backed features are enabled.

### Installation

```bash
git clone https://github.com/yourusername/surrogate-network.git
cd surrogate-network
npm install
cp .env.example .env.local
```

Edit `.env.local` with your local or hosted Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=http://localhost:9002

OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

### Development

```bash
npm run dev
npm run lint
npm run typecheck
npm test
```

The development server runs at `http://localhost:9002`.

### Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` to enable explicit browser-safe demo fixtures for local development, smoke tests, and accessibility checks.

### Test Commands

```bash
npm run test:unit
npm run test:component
npm run test:security
npm run test:navigation
npm run test:e2e
npm run test:e2e:smoke
npm run test:a11y
```

### CI Quality Gate

GitHub Actions runs the following certification gates on the same HEAD:

- `TYPECHECK`
- `LINT`
- `UNIT`
- `COMPONENT`
- `SECURITY`
- `NAVIGATION`
- `BUILD`
- `E2E SMOKE`
- `A11Y`
- `QUALITY GATE`

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript.
- **Styling**: Tailwind CSS and Radix UI primitives.
- **Data**: Supabase PostgreSQL, Auth, Storage, Realtime, and Row Level Security.
- **State and forms**: TanStack Query, React Hook Form, and Zod.
- **Testing**: Jest, Testing Library, Playwright, and accessibility smoke tests.
- **Charts and UI utilities**: Recharts, Lucide React, date-fns, and class-variance-authority.

## Project Structure

```text
surrogate-network/
|-- src/
|   |-- app/                    # Next.js app directory and route groups
|   |-- application/            # Application services and use-case orchestration
|   |-- components/             # Shared UI, forms, layout, and feature components
|   |-- dev/                    # Fixtures and local development helpers
|   |-- domain/                 # Domain entities, interfaces, and business rules
|   |-- hooks/                  # Shared React hooks
|   |-- infrastructure/         # Supabase clients, repositories, and adapters
|   |-- intelligence/           # Matching and intelligence helpers
|   |-- lib/                    # Shared utilities and types
|   |-- navigation/             # Navigation registry and surface-specific navigation
|   |-- repositories/           # Repository interfaces and supporting code
|   |-- services/               # Legacy and cross-cutting services
|   `-- __tests__/              # Security and regression tests
|-- docs/                       # Architecture, development, API, and model docs
|-- e2e/                        # Playwright test suites
|-- supabase/                   # Supabase config, migrations, and seed data
`-- package.json
```

## Development Guidelines

- Keep business logic in application/domain/services layers, not React components.
- Use shared design-system primitives from `src/components/ui/`.
- Prefer repository interfaces and Supabase infrastructure adapters for data access.
- Keep navigation changes registered through `src/navigation/`.
- Add focused tests for user-facing behavior, domain rules, and shared contracts.
- Update documentation when setup, architecture, or workflows change.

## Documentation

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Data Models](docs/DATA_MODELS.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

## Design Principles

- **Human-first**: people are the product, not the algorithm.
- **Fulfillment over connection**: meaningful support matters more than passive graph growth.
- **Consent-centric**: permissions should be specific, reversible, and understandable.
- **Multi-dimensional**: needs, boundaries, compatibility, and trust all need nuance.
- **Community-driven**: the co-op model should support participation and accountability.

## Safety and Privacy

- Granular boundary systems.
- Media access controls and blur states.
- Block, mute, and restrict functionality.
- Audit logging for accountability.
- Permission-based capabilities.
- Reputation signals separated from popularity.

## License

License information has not been added yet.

---

Built for meaningful human connections.
