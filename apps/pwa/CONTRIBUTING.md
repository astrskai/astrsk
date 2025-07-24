# Contributing to astrsk.ai 🌟

First off, thank you for considering contributing to astrsk.ai! It's people like you that make astrsk.ai such a great tool for pushing the boundaries of AI storytelling. We're excited to have you here and look forward to your contributions!

## 📋 Table of Contents

- [Welcome](#welcome)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Issues](#issues)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
  - [Code Style](#code-style)
  - [Commit Messages](#commit-messages)
  - [Branch Naming](#branch-naming)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [E2E Tests](#e2e-tests)
  - [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Types of Contributions](#types-of-contributions)
- [Community](#community)
- [Recognition](#recognition)

## Welcome

We're thrilled that you're interested in contributing to astrsk.ai! This document will guide you through the contribution process and help you understand how to work with our codebase effectively.

astrsk.ai is an open-source project that aims to revolutionize AI storytelling through advanced agent control, visual flow editing, and immersive roleplay experiences. Every contribution, no matter how small, helps us achieve this goal.

## Code of Conduct

By participating in the astrsk.ai project, you agree to maintain a respectful and constructive environment for all contributors. We are dedicated to ensuring that our community is utilized responsibly and safely.

### Community Standards

We expect all contributors to:

- Be respectful and professional in all interactions
- Focus on constructive feedback and collaboration
- Respect differing viewpoints and experiences
- Ensure contributions comply with applicable laws and regulations
- Take responsibility for your contributions and their impact

### Unacceptable Behavior

The following behaviors are not tolerated:

- Content that exploits or endangers minors in any form
- Harassment, discrimination, or harmful behavior towards others
- Sharing private information without consent
- Illegal, unethical, or harmful activities
- Any conduct that violates our Terms of Service or Content Policy

### Reporting and Enforcement

If you notice any violation of these standards or have concerns about conduct in our community:

- **Email**: [cyoo@astrsk.ai](mailto:cyoo@astrsk.ai) for serious violations
- **Discord**: Join our [official Discord server](https://discord.com/invite/J6ry7w8YCF) for general concerns
- **GitHub**: Report issues directly on the relevant GitHub issue or pull request

We take all reports seriously and will respond appropriately to maintain a safe and productive environment for everyone.

## Getting Started

### Issues

#### Before Creating an Issue

- Check the [existing issues](https://github.com/harpychat/astrsk.ai/issues) to avoid duplicates
- Search the [discussions](https://github.com/harpychat/astrsk.ai/discussions) for related topics
- Check our [documentation](docs/) for answers

#### Creating a Good Issue

**Bug Reports** should include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots or error messages (if applicable)
- Environment details (browser, OS, version)
- Any relevant logs or console output

Use our bug report template:
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 2.0.0]
```

**Feature Requests** should include:
- A clear use case explaining why this feature would be useful
- Detailed description of the proposed solution
- Any alternative solutions you've considered
- Mockups or examples (if applicable)

### Pull Requests

1. Fork the repo and create your branch from `develop`
2. If you've added code that should be tested, add tests
3. If you've changed APIs or added features, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows our style guidelines
6. Issue that pull request!

## Development Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git** for version control
- A code editor (we recommend VS Code with our recommended extensions)

### Local Development

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/astrsk.ai.git
   cd astrsk.ai
   ```

2. **Install Dependencies**
   ```bash
   # Web app dependencies
   cd apps/web
   npm install
   
   # Desktop app dependencies (optional)
   cd ../desktop
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

4. **Start Development Server**
   ```bash
   # For web app
   cd apps/web
   npm run dev
   
   # For desktop app (in a separate terminal)
   cd apps/desktop
   npm run dev
   ```

5. **Access the Application**
   - Web app: [http://localhost:5173](http://localhost:5173)
   - Desktop app: Electron window will open automatically

### Project Structure

Understanding our project structure is crucial for effective contributions:

```
astrsk.ai/
├── apps/
│   ├── web/                    # Main PWA application
│   │   ├── src/
│   │   │   ├── modules/        # Domain modules (DDD)
│   │   │   │   ├── agent/      # AI agent management
│   │   │   │   ├── flow/       # Flow editor logic
│   │   │   │   └── session/    # Session management
│   │   │   ├── app/            # Application layer
│   │   │   ├── components/     # UI components
│   │   │   ├── db/             # Database (PGlite)
│   │   │   └── shared/         # Shared utilities
│   │   └── public/             # Static assets
│   └── desktop/                # Electron wrapper
├── docs/                       # Documentation
└── CLAUDE.md                   # AI assistant guidelines
```

#### Key Architectural Patterns

- **Domain-Driven Design (DDD)**: Each module follows DDD principles
- **Clean Architecture**: Clear separation of concerns
- **Repository Pattern**: For data access
- **Use Case Pattern**: For business logic

## Development Guidelines

### Code Style

We use several tools to maintain consistent code quality:

- **TypeScript**: With strict mode enabled
- **ESLint**: For code quality checks
- **Prettier**: For consistent formatting

#### Project-Specific Guidelines

- **Error Handling**: Use the `Result<T, E>` pattern from `@/shared/result` for consistent error handling
- **Font Usage**: Don't use `font-['Inter']` in Tailwind classes - Inter is already the default font
- **Icon Sizing**: For Lucide icons, use `min-w-4 min-h-4` instead of `w-4 h-4` for proper sizing
- **Absolute Positioning**: Avoid `self-stretch` with `absolute` positioning - use explicit dimensions like `w-28 h-16`
- **Component Organization**: Follow the existing pattern in `/src/components-v2/` for new components
- **Domain Logic**: Keep business logic in use cases (`/src/modules/*/usecases/`)
- **Data Access**: Use repository pattern (`/src/modules/*/repos/`)

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

#### Examples

```bash
# Feature
feat(flow-editor): add branching logic for narrative flows

# Bug fix
fix(session): resolve memory leak in session cleanup

# Documentation
docs: update API documentation for v2.0

# With breaking change
feat(agent)!: redesign agent configuration schema

BREAKING CHANGE: Agent config now requires explicit provider selection
```

### Branch Naming

Use descriptive branch names following this pattern:

```
<type>/<issue-number>-<short-description>

# Examples (where numbers are GitHub issue numbers):
feature/123-add-flow-export
fix/456-session-memory-leak
docs/789-update-api-docs

# If no issue exists:
feature/add-flow-export
fix/session-memory-leak
```

## Testing

### Unit Tests

We use Vitest for unit testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest src/modules/agent/domain/agent.spec.ts

# Run with coverage
npm run test:coverage
```

#### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { Agent } from './agent';

describe('Agent', () => {
  it('should create agent with valid properties', () => {
    const agent = Agent.create({
      name: 'Test Agent',
      prompt: 'You are a helpful assistant',
      providerId: 'openai'
    });
    
    expect(agent.isOk()).toBe(true);
    expect(agent.value.name).toBe('Test Agent');
  });
});
```

### E2E Tests

We use Playwright for end-to-end testing:

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Testing Guidelines

1. **Write tests for new features**: All new features should include tests
2. **Test edge cases**: Don't just test the happy path
3. **Keep tests focused**: Each test should verify one specific behavior
4. **Use descriptive names**: Test names should clearly describe what they test
5. **Mock external dependencies**: Use mocks for API calls and external services

## Pull Request Process

1. **Update your fork**
   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Add/update tests as needed
   - Update documentation if required

4. **Run quality checks**
   ```bash
   # Lint your code
   npm run lint
   
   # Run tests
   npm run test
   npm run test:e2e
   
   # Build to check for errors
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Link any related issues

### PR Review Process

- PRs require at least one approval from maintainers
- Address all feedback constructively
- Keep PRs focused and reasonably sized
- Update your PR based on feedback
- Once approved, a maintainer will merge your PR

## Types of Contributions

We welcome various types of contributions:

### 🐛 Bug Fixes
- Fix existing issues
- Improve error handling
- Resolve performance problems

### ✨ Features
- Implement new functionality
- Enhance existing features
- Add new AI provider integrations

### 📚 Documentation
- Improve README and guides
- Add code comments
- Create tutorials or examples

### 🎨 UI/UX Improvements
- Enhance visual design
- Improve accessibility
- Optimize user workflows

### 🧪 Testing
- Add missing tests
- Improve test coverage
- Create E2E test scenarios

### 🌐 Translations
- Translate UI to new languages
- Improve existing translations
- Add i18n support to new features

### 💡 Ideas and Feedback
- Suggest new features
- Provide usability feedback
- Share use cases and workflows

## Community

Stay connected with the astrsk.ai community:

- **Discord**: [Join our server](https://discord.com/invite/J6ry7w8YCF) for real-time discussions
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/harpychat/astrsk.ai/discussions)
- **Twitter/X**: Follow [@astrskai](https://x.com/astrskai) for updates
- **Reddit**: Join [r/astrsk_ai](https://www.reddit.com/r/astrsk_ai/)

### Getting Help

If you need help:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/harpychat/astrsk.ai/issues)
3. Ask in [GitHub Discussions](https://github.com/harpychat/astrsk.ai/discussions)
4. Join our [Discord server](https://discord.com/invite/J6ry7w8YCF)

Response times:
- Issues: 2-3 business days
- PRs: 3-5 business days
- Security issues: Within 24 hours

## Recognition

We value all contributions and want to recognize our contributors:

- Your name will be added to our contributors list
- Significant contributions are highlighted in release notes
- Active contributors may be invited to join the maintainers team
- We feature community contributions on our social media

Thank you for contributing to astrsk.ai! Your efforts help make AI storytelling more accessible and powerful for everyone. 🌟

---

<p align="center">Made with ❤️ by the astrsk.ai community</p>