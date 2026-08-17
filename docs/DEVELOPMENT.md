# Development Guide

This guide covers everything you need to set up your development environment and contribute to Surrogate Network.

## Prerequisites

### Required Software

- **Node.js**: Version 18.0 or higher
  ```bash
  node --version  # Should be v18.0.0 or higher
  npm --version   # Should be 9.0.0 or higher
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Required Accounts

- **Firebase Account**: [firebase.google.com](https://firebase.google.com)
- **Google Cloud Project**: For Genkit AI integration
- **GitHub Account**: For repository access (if using private repo)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/surrogate-network.git
cd surrogate-network
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- Firebase SDK
- Radix UI components
- Tailwind CSS
- Genkit AI framework
- Development tools

### 3. Firebase Project Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Enable **Firestore Database**
4. Enable **Authentication** (Email/Password provider)
5. Enable **Storage** (for media uploads)

#### Get Firebase Configuration

1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`)
4. Register the app (use "surrogate-network" as app name)
5. Copy the configuration values

### 4. Environment Configuration

#### Create Environment File

```bash
# Copy the example environment file
cp .env.example .env.local
```

#### Configure Environment Variables

Edit `.env.local` with your Firebase and API credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google AI API Key (for Genkit)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

#### Environment Variable Sources

**Firebase Configuration**: Get from Firebase Console → Project Settings → General

**Google AI API Key**: 
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your environment variables

### 5. Firebase Firestore Rules

Create `firestore.rules` in your project root (if not exists):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access for authenticated users
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:9002
- **Network**: http://your-local-ip:9002

### Start AI Development Server

```bash
npm run genkit:dev
```

This starts the Genkit development server for AI flows at:
- **Genkit UI**: http://localhost:4000

### Common Development Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Format code (if Prettier is configured)
npm run format
```

## Project Structure Overview

```
surrogate-network/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── dashboard/         # Member dashboard
│   │   ├── matches/           # Discovery board
│   │   ├── profile/           # Profile management
│   │   ├── needs/             # Need creation
│   │   └── chat/              # Messaging
│   ├── components/
│   │   ├── common/            # Shared business components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Radix UI primitives
│   ├── lib/
│   │   ├── types.ts           # TypeScript definitions
│   │   ├── utils.ts           # Utility functions
│   │   └── firebase/          # Firebase config
│   ├── services/              # Business logic layer
│   ├── ai/                    # AI integration
│   └── hooks/                 # Custom React hooks
├── docs/                      # Documentation
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Code Style and Conventions

### TypeScript Conventions

1. **Use Interface for Object Shapes**:
   ```typescript
   // Good
   interface UserProfile {
     name: string;
     email: string;
     avatar?: string;
   }
   
   // Acceptable for simple types
   type UserRole = 'admin' | 'user' | 'guest';
   ```

2. **Explicit Return Types**:
   ```typescript
   // Good
   async function fetchUser(id: string): Promise<User | null> {
     // implementation
   }
   ```

3. **Use Readonly for Immutable Data**:
   ```typescript
   interface ProfileData {
     readonly id: string;
     readonly createdAt: string;
   }
   ```

### React Component Conventions

1. **Component Naming**:
   - Use PascalCase for components: `UserProfile.tsx`
   - Use kebab-case for files in some cases: `user-profile.tsx`

2. **Component Structure**:
   ```typescript
   // imports
   import { useState } from 'react';
   import { Button } from '@/components/ui/button';
   
   // types
   interface ComponentProps {
     title: string;
     onSave: () => void;
   }
   
   // component
   export function MyComponent({ title, onSave }: ComponentProps) {
     // hooks
     const [isLoading, setIsLoading] = useState(false);
     
     // handlers
     const handleSave = async () => {
       setIsLoading(true);
       await onSave();
       setIsLoading(false);
     };
     
     // render
     return (
       <div>
         <h1>{title}</h1>
         <Button onClick={handleSave} disabled={isLoading}>
           Save
         </Button>
       </div>
     );
   }
   ```

3. **Client vs Server Components**:
   ```typescript
   // Server Component (default)
   export async function ProfilePage({ params }: { params: { id: string } }) {
     const profile = await fetchProfile(params.id);
     return <ProfileView profile={profile} />;
   }
   
   // Client Component
   'use client';
   export function ProfileForm({ profile }: { profile: Profile }) {
     // interactive component with hooks
   }
   ```

### Service Layer Conventions

1. **Service Function Pattern**:
   ```typescript
   // services/profileService.ts
   export async function fetchProfileById(id: string): Promise<Profile | null> {
     try {
       const profileDocRef = doc(db, PROFILES_COLLECTION, id);
       const docSnap = await getDoc(profileDocRef);
       
       if (docSnap.exists()) {
         return fromFirestoreDTO(docSnap.id, docSnap.data() as FirestoreProfileDTO);
       }
       return null;
     } catch (error) {
       console.error(`Error fetching profile: ${error}`);
       throw new Error(`Failed to fetch profile: ${id}`);
     }
   }
   ```

2. **DTO Pattern**:
   ```typescript
   // Type for Firestore interaction
   export interface FirestoreProfileDTO extends Omit<Profile, 'createdAt'> {
     createdAt: Timestamp;
   }
   
   // Conversion function
   function fromFirestoreDTO(docId: string, dto: FirestoreProfileDTO): Profile {
     return {
       ...dto,
       id: docId,
       createdAt: dto.createdAt.toDate().toISOString(),
     };
   }
   ```

### CSS/Styling Conventions

1. **Tailwind CSS First**:
   ```tsx
   // Good
   <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
   
   // Avoid inline styles when possible
   <div style={{ display: 'flex', padding: '1rem' }}>
   ```

2. **Component-Specific Styles**:
   ```tsx
   // Use Tailwind's @apply for complex components
   <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
   ```

3. **Responsive Design**:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   ```

## Git Workflow

### Branching Strategy

```bash
main          # Production-ready code
develop       # Integration branch for features
feature/*     # New features (e.g., feature/surrogacy-lifecycle)
bugfix/*      # Bug fixes (e.g., bugfix/token-calculation)
hotfix/*      # Urgent production fixes
```

### Commit Message Convention

Follow conventional commits:

```bash
feat: add surrogacy proposal counter functionality
fix: resolve token calculation error in exchanges
docs: update API documentation
style: format code with Prettier
refactor: simplify profile service logic
test: add unit tests for permission resolver
chore: update dependencies
```

### Pull Request Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Include what changed and why
3. **Testing**: Describe how changes were tested
4. **Breaking Changes**: Clearly indicate if any
5. **Screenshots**: Include UI changes if applicable

## Testing Strategy

### Current State

The project currently uses manual testing through the development server.

### Planned Testing

```bash
# Unit tests (planned)
npm run test:unit

# Integration tests (planned)
npm run test:integration

# E2E tests (planned)
npm run test:e2e

# All tests (planned)
npm test
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**:
   - Use React DevTools for component inspection
   - Check Console for errors
   - Use Network tab for API calls

2. **VS Code Debugging**:
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js: debug server-side",
         "type": "node-terminal",
         "request": "launch",
         "command": "npm run dev"
       },
       {
         "name": "Next.js: debug client-side",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:9002"
       }
     ]
   }
   ```

### Backend Debugging

1. **Firestore Console**: Use Firebase Console to inspect data
2. **Server Logs**: Check terminal for server-side logs
3. **AI Debugging**: Use Genkit UI at http://localhost:4000

### Common Issues and Solutions

**Issue**: Firebase connection errors
```bash
# Solution: Check environment variables
cat .env.local
# Ensure all Firebase config values are correct
```

**Issue**: Type errors after pulling changes
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Tailwind classes not working
```bash
# Solution: Restart dev server and clear cache
npm run dev
```

**Issue**: AI features not working
```bash
# Solution: Check Genkit server and API key
npm run genkit:dev
# Verify GOOGLE_GENAI_API_KEY is set
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Client-side only
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="User profile"
  width={400}
  height={400}
  priority // For above-the-fold images
/>
```

### Firebase Query Optimization

```typescript
// Create indexes in Firebase Console
const q = query(
  collection(db, 'profiles'),
  where('category', '==', 'personal'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

## Build and Deployment

### Local Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm start

# The app will run on http://localhost:3000
```

### Type Checking Before Build

```bash
# Always run type checking before building
npm run typecheck
npm run build
```

### Linting Before Commit

```bash
# Check for linting issues
npm run lint

# Auto-fix issues (if using ESLint with --fix)
npm run lint -- --fix
```

## Development Tools

### Recommended VS Code Extensions

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Tailwind class suggestions
- **TypeScript and JavaScript Language Features**: Enhanced TS/JS support
- **GitLens**: Git supercharged
- **Thunder Client**: API testing (alternative to Postman)

### Firebase CLI Tools

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View Firestore data
firebase firestore:export --output backup.json
```

### Genkit Development Tools

```bash
# Start Genkit development server
npm run genkit:dev

# Access Genkit UI at http://localhost:4000
# Test AI flows and inspect prompts
```

## Contributing Guidelines

### Before Contributing

1. Read the [Architecture Documentation](ARCHITECTURE.md)
2. Review existing code patterns
3. Create a feature branch from `develop`
4. Make changes following code conventions
5. Test thoroughly
6. Submit pull request with clear description

### Code Review Process

1. **Self-Review**: Review your own changes
2. **Type Check**: Ensure no TypeScript errors
3. **Lint Check**: Run linting and fix issues
4. **Test**: Verify functionality works as expected
5. **Documentation**: Update relevant docs if needed

### Feature Development Checklist

- [ ] Feature branch created from `develop`
- [ ] Types defined and exported properly
- [ ] Service layer functions implemented
- [ ] Components created with proper separation
- [ ] Error handling implemented
- [ ] Loading states added for async operations
- [ ] Responsive design considered
- [ ] Accessibility reviewed (basic ARIA labels)
- [ ] Documentation updated
- [ ] Tests written (when testing is implemented)
- [ ] Code reviewed and approved
- [ ] Merged to `develop`

## Troubleshooting

### Development Server Issues

**Server won't start**
```bash
# Check if port 9002 is in use
npx kill-port 9002
# Or use a different port
npm run dev -- -p 3000
```

**Hot reload not working**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Firebase Issues

**Firestore permission errors**
```bash
# Check Firestore rules in Firebase Console
# Ensure you're authenticated
firebase login
```

**Data not appearing**
```bash
# Check Firestore indexes
# Ensure queries match your indexes
# Use Firebase Console to verify data exists
```

### AI/Genkit Issues

**Genkit server not starting**
```bash
# Check if port 4000 is available
# Verify GOOGLE_GENAI_API_KEY is correct
npm run genkit:dev
```

**AI responses poor quality**
```bash
# Use Genkit UI to test prompts
# Adjust prompt templates in src/ai/flows/
# Check API key has sufficient credits
```

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)

### Community

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Firebase Community](https://firebase.google.com/support/community)
- [React Community](https://react.dev/community)

## Support

For project-specific issues:
1. Check existing documentation
2. Review similar issues in GitHub
3. Ask in team communication channels
4. Create a detailed issue with reproduction steps

---

**Development Guide Version**: 1.0
**Last Updated**: 2025-08-16
**Maintained By**: Surrogate Network Development Team