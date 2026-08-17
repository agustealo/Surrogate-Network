# Contributing to Surrogate Network

Thank you for your interest in contributing to Surrogate Network! This document provides guidelines and information for contributing to the project.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Read the [Development Guide](DEVELOPMENT.md)
- Set up your local development environment
- Familiarized yourself with the codebase structure
- Read the [Architecture Documentation](ARCHITECTURE.md)

### First-Time Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/surrogate-network.git
   cd surrogate-network
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branching Strategy

```bash
main          # Production-ready code
develop       # Integration branch
feature/*     # New features
bugfix/*      # Bug fixes
hotfix/*      # Urgent production fixes
docs/*        # Documentation updates
```

### Creating a Branch

```bash
# For new features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b bugfix/your-bug-fix

# For documentation
git checkout -b docs/your-doc-update
```

### Making Changes

1. **Make your changes** following the code style guidelines
2. **Test thoroughly** in your local environment
3. **Run type checking**: `npm run typecheck`
4. **Run linting**: `npm run lint`
5. **Build the project**: `npm run build`

### Committing Changes

Follow conventional commit format:

```bash
# Format: <type>(<scope>): <subject>

feat: add surrogacy proposal counter functionality
fix: resolve token calculation error in exchanges
docs: update API documentation
style: format code with Prettier
refactor: simplify profile service logic
test: add unit tests for permission resolver
chore: update dependencies
```

### Pull Request Process

1. **Update Branch**: Ensure your branch is up to date with `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-feature
   git merge develop
   ```

2. **Push Your Changes**
   ```bash
   git push origin feature/your-feature
   ```

3. **Create Pull Request** on GitHub:
   - Target branch: `develop`
   - Title: Use conventional commit format
   - Description: Include what changed and why
   - Link related issues

## Code Style Guidelines

### TypeScript

- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use readonly for immutable data
- Avoid `any` - use proper types
- Use proper null checking

### React Components

- Use functional components with hooks
- Separate business logic from presentation
- Use proper TypeScript interfaces for props
- Keep components focused and single-purpose
- Follow naming conventions: PascalCase for components

### Service Layer

- Keep business logic in services, not components
- Use consistent error handling
- Validate inputs at service boundaries
- Use proper TypeScript types for inputs/outputs
- Document complex business rules

### Styling

- Use Tailwind CSS for styling
- Follow responsive design patterns
- Use existing design system components
- Avoid inline styles when possible
- Maintain consistency with existing UI

## Testing

### Current Testing State

The project currently uses manual testing through the development server.

### Testing Checklist

Before submitting a PR, ensure you have:

- [ ] Tested the feature manually in development
- [ ] Verified it works across different browsers
- [ ] Checked mobile responsiveness
- [ ] Tested edge cases and error conditions
- [ ] Verified no console errors
- [ ] Confirmed existing features still work

### Planned Testing

When testing infrastructure is implemented:

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Documentation

### When to Update Documentation

Update documentation when you:

- Add new features or functionality
- Change existing behavior
- Modify data models or types
- Update service layer APIs
- Change development workflows

### Documentation Files

- **README.md**: Project overview and getting started
- **ARCHITECTURE.md**: Technical design and system components
- **DEVELOPMENT.md**: Development setup and workflows
- **API.md**: Service interfaces and contracts
- **DATA_MODELS.md**: Type definitions and schemas

### Updating Documentation

1. Make documentation changes in your feature branch
2. Follow existing documentation style and format
3. Include clear examples where helpful
4. Update relevant sections based on your changes
5. Link related documentation where appropriate

## Code Review Process

### Before Requesting Review

- [ ] Code follows project style guidelines
- [ ] TypeScript type checking passes
- [ ] Linting passes with no errors
- [ ] Feature has been thoroughly tested
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format

### During Review

- Respond to review comments promptly
- Make requested changes or provide justification
- Keep commits clean and atomic
- Update PR description as needed
- Mark conversations as resolved when addressed

### After Review

- Address all review feedback
- Update documentation if requested
- Ensure tests pass
- Update branch with latest changes
- Request final review if major changes were made

## Issue Reporting

### Bug Reports

When reporting bugs, include:

- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (browser, OS, etc.)
- Screenshots if applicable
- Relevant code snippets

### Feature Requests

When suggesting features, include:

- Clear description of the feature
- Why it would be valuable
- Potential use cases
- How it might work (if you have ideas)
- Any alternatives you've considered

### Documentation Issues

When reporting documentation issues:

- Specify which document has the issue
- Describe what's incorrect or unclear
- Suggest improvements if possible
- Provide context for why it matters

## Project-Specific Guidelines

### Service Layer

- **Keep business logic in services**: Components should be thin
- **Use proper error handling**: Consistent error patterns
- **Validate inputs**: Validate at service boundaries
- **Type everything**: Use proper TypeScript types
- **Document complex rules**: Comments for non-obvious business logic

### Component Development

- **Use shared components**: Don't duplicate UI elements
- **Follow existing patterns**: Look at similar components
- **Keep components focused**: Single responsibility principle
- **Use proper prop types**: TypeScript interfaces for props
- **Handle loading states**: Show loading indicators for async operations

### Data Models

- **Use domain-driven types**: Types should reflect real concepts
- **Document relationships**: Clear relationships between types
- **Plan for extensibility**: Design for future features
- **Maintain backward compatibility**: When possible
- **Update documentation**: Keep docs in sync with code

### Firebase Integration

- **Use DTO patterns**: Separate Firestore types
- **Handle timestamps properly**: Convert Firestore Timestamps
- **Use proper queries**: Optimize Firestore queries
- **Handle errors gracefully**: Provide meaningful error messages
- **Test with real data**: Use realistic test data

## Getting Help

### Resources

- **Architecture Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **API Reference**: [API.md](API.md)
- **Data Models**: [DATA_MODELS.md](DATA_MODELS.md)

### Communication

- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code changes and reviews
- **Discussions**: For questions and ideas

### Troubleshooting

If you encounter issues:

1. Check existing documentation
2. Search for similar issues in GitHub
3. Review the troubleshooting section in [DEVELOPMENT.md](DEVELOPMENT.md)
4. Ask for help in the appropriate channel

## Recognition

Contributors will be recognized for their contributions through:

- Attribution in release notes
- Contributor recognition in documentation
- Opportunity to become maintainers for consistent contributors

## License

By contributing to Surrogate Network, you agree that your contributions will be licensed under the same license as the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and considerate
- Use welcoming and inclusive language
- Focus on constructive feedback
- Gracefully accept constructive criticism
- Show empathy towards other community members

### Responsibilities

Project maintainers are responsible for:

- Clarifying standards of acceptable behavior
- Taking appropriate action when unacceptable behavior occurs

## Questions?

If you have questions about contributing that aren't covered here:

- Check existing documentation
- Search for similar issues in GitHub
- Ask in a GitHub Discussion
- Contact maintainers directly if needed

---

**Contributing Guidelines Version**: 1.0
**Last Updated**: 2025-08-16
**Maintained By**: Surrogate Network Development Team