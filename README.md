# Surrogate Network

A needs-based social companion platform that connects people through meaningful exchanges of support and companionship.

## 🌟 About

Surrogate Network is a social co-op where members articulate their **Needs** and offer their **capabilities** (Offers) to create mutually beneficial relationships. Unlike traditional social networks that focus on connections or dating apps that focus on candidates, Surrogate models **fulfillment** through structured relationships.

### Core Concept

Members create profiles that define what they need and what they can offer. The platform facilitates discovery, compatibility matching, and relationship management through:

- **Needs**: Something I want fulfilled
- **Offers**: Something I'm willing/able to provide
- **Surrogacy**: An established relationship around one or more Needs/Offers
- **Moments**: Individual occurrences of that Surrogacy
- **Exchanges**: The recorded fulfillment of agreed interactions

## ✨ Key Features

### Current Features (Phase 0)

- Profile creation with offerings and requests
- Basic needs/offers discovery board
- Simple proposal system
- AI-powered need tag generation
- Basic token economy hints
- Firebase integration for data persistence

### Phase 1 Vision (In Progress)

The platform is evolving to support the complete relationship lifecycle:

**🔄 Complete Relationship Loop**
```
Need → Discovery → Proposal → Agreement → Surrogacy → Moment → Exchange → Feedback → Trust/XP/Tokens → Better Discovery
```

**🎯 Core Infrastructure**
- Richer Need/Offer data models with multiple dimensions
- Compatibility Matrix (multi-dimensional matching)
- Three-level boundary system (Global/Surrogacy/Moment)
- Dynamic consent and permission grants
- Trust Matrix (multi-dimensional reputation)
- Basic scheduling and availability
- Media visibility controls and blur states
- Token economy with ledger
- XP and rank progression system
- Capability/permission resolver

**🛡️ Safety & Trust**
- Block, mute, restrict functionality
- Media access controls
- Profile visibility levels
- Basic moderation tools
- Audit logging

**👥 User Experience**
- Separate Public/Member/Admin application shells
- Member navigation: Home, Discover, Needs, Offers, Surrogacies, Messages, Pods, Rewards, Profile
- Relationship Dashboard showing social landscape coverage
- Contextual feedback on completed exchanges

**🏛️ Admin Console**
- Member lookup and inspection
- Needs/Offers management
- Surrogacy oversight
- Feedback review
- Media moderation
- Token ledger inspection
- Rank/XP verification
- Basic reports and moderation actions
- Audit log access

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled
- Google AI API key (for Genkit/need tagging)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/surrogate-network.git
cd surrogate-network

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and API keys
```

### Environment Variables

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google AI (for Genkit)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

### Development

```bash
# Run development server (with Turbopack for faster builds)
npm run dev

# Run Genkit development server (for AI flows)
npm run genkit:dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

The application will be available at `http://localhost:9002`

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: Firebase Firestore
- **AI Integration**: Google Genkit for need tag generation
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Query (TanStack Query) with Firebase
- **Date Handling**: date-fns

## 📁 Project Structure

```
surrogate-network/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Member dashboard
│   │   ├── matches/           # Discovery board
│   │   ├── profile/           # Profile pages
│   │   ├── needs/             # Need creation
│   │   ├── chat/              # Messaging
│   │   └── settings/          # User settings
│   ├── components/
│   │   ├── common/            # Shared components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI primitives (Radix)
│   ├── lib/
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── utils.ts           # Utility functions
│   │   └── firebase/          # Firebase configuration
│   ├── services/              # Business logic services
│   ├── ai/                    # AI integration (Genkit)
│   └── hooks/                 # Custom React hooks
├── docs/                      # Documentation
├── public/                    # Static assets
└── package.json
```

## 🗺️ Roadmap

### Phase 0 ✅ (Complete)
- Basic profile system
- Simple needs/offers discovery
- Mock proposal flow
- AI need tagging
- Basic UI components

### Phase 1 🚧 (In Progress)
**Goal**: Make the central Surrogate loop real and complete

**Success Criteria**: A user can register, complete profile, create needs/offers, discover matches, send proposals, establish surrogacies, schedule moments, complete exchanges, leave feedback, build reputation, earn XP/tokens, progress through ranks, manage media access, and view everything from both member and admin perspectives.

**Key Deliverables**:
- Complete social objects (Need, Offer, Surrogacy, Moment, Exchange)
- Full proposal lifecycle (counter, accept, decline)
- Compatibility matrix with breakdowns
- Boundary system (Global/Surrogacy/Moment)
- Consent/permission infrastructure
- Basic scheduling system
- Trust matrix and reputation
- Token ledger and economy rules
- XP/rank progression
- Media visibility controls
- Separate Public/Member/Admin shells
- Admin console with basic operational tools

### Phase 2 🔮 (Future)
- Advanced Pods
- Battle Pass system
- Community governance
- Community treasury
- Advanced media permissions
- AI relationship analytics
- Social Landscape intelligence
- Advanced fraud detection

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Guidelines

- Keep business logic in `src/services/`, not React components
- Use shared design-system primitives from `src/components/ui/`
- Follow existing code style and patterns
- Add type definitions for new features
- Update documentation as needed

## 📖 Documentation

- [Architecture Documentation](docs/ARCHITECTURE.md) - Technical design and system components
- [Development Guide](docs/DEVELOPMENT.md) - Setup and workflows
- [API Reference](docs/API.md) - Service interfaces and contracts
- [Data Models](docs/DATA_MODELS.md) - Type definitions and schemas

## 🎨 Design Principles

- **Human-First**: People are the product, not AI algorithms
- **Fulfillment over Connection**: Focus on meaningful exchanges, not just relationships
- **Consent-Centric**: Dynamic, specific, and reversible permission systems
- **Multi-Dimensional**: Complex relationships require nuanced matching and reputation systems
- **Community-Driven**: Co-op model with governance participation

## 🛡️ Safety & Privacy

Surrogate Network takes safety seriously:

- Granular boundary systems at multiple levels
- Media access controls and blur states
- Block, mute, and restrict functionality
- Audit logging for accountability
- Permission-based capabilities
- Reputation separate from popularity

## 📄 License

[Your License Here] - See LICENSE file for details

## 🙏 Acknowledgments

- Firebase for the backend infrastructure
- Google Genkit for AI capabilities
- Radix UI for accessible component primitives
- The open-source community for amazing tools and libraries

---

**Built with ❤️ for meaningful human connections**