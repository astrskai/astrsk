# astrsk.ai 🌟

<p align="center">
  <img src="https://framerusercontent.com/images/3coy4jPeSe8kYS1gIZ2aWs2Ybwk.png" alt="astrsk.ai logo" width="200"/>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/harpychat/astrsk.ai/releases"><img src="https://img.shields.io/github/v/release/harpychat/astrsk.ai" alt="Release"></a>
  <a href="https://github.com/harpychat/astrsk.ai/actions"><img src="https://img.shields.io/github/actions/workflow/status/harpychat/astrsk.ai/ci.yml" alt="Build Status"></a>
</p>

<p align="center">
  <b>Pushing the boundaries of AI storytelling</b><br/>
  Advanced AI agents • Customizable response formatting • Flexible prompt editing • Immersive roleplay experiences
</p>

## ✨ Features

### Core Capabilities

🤖 **Complete AI Agent Control**
- Design agents with custom prompts, output schemas, and response formatting
- Import character cards (v2/v3) or build your own from scratch
- Support for 10+ AI providers: OpenAI, Anthropic, Google AI, DeepSeek, Ollama, xAI, and more

🎨 **Visual Flow Editor**
- Drag-and-drop interface for complex conversation flows
- Branch narratives with conditional logic
- Real-time preview and testing

🔐 **100% Local-First**
- All data stored locally on your device - your stories stay yours
- No account required, no data collection
- Export and backup your content anytime

📱 **True Cross-Platform**
- Progressive Web App - works on any device with a browser
- Native desktop apps for Windows, macOS, and Linux
- Offline support (PWA) with full functionality

### Technical Excellence

- **Built with modern tech**: React, TypeScript, Vite, and Tailwind CSS
- **Database in your browser**: PGlite (PostgreSQL compiled to WebAssembly)
- **Blazing fast**: Local database, service worker caching, and optimized bundle sizes

### Coming Soon

- **Cross-device sync** - Continue your stories seamlessly across devices
- **Enhanced session customization** - More control over every aspect of your roleplay
- **Community features** - Share and discover amazing stories and characters

## 📋 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Contact & Community](#contact--community)
- [Acknowledgments](#acknowledgments)
- [Website & Downloads](#website--downloads)

## 🎥 Demo

<p align="center">
  <a href="https://framerusercontent.com/assets/ppsFOqROj4j97ap69HwRkJtPqo.mp4">
    <img src="https://framerusercontent.com/images/0S4j46G5MSZybLFToZZ7JJPzVZ0.png" alt="astrsk.ai preview - Click to watch demo video" width="800"/>
  </a>
  <br/>
  <em>▶️ Click the image above to watch the demo video</em>
</p>

<p align="center">
  <b>📹 <a href="https://framerusercontent.com/assets/ppsFOqROj4j97ap69HwRkJtPqo.mp4">Watch Demo Video</a></b> | 
  <b>🚀 <a href="https://app.astrsk.ai">Try it Live</a></b>
</p>

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (v9 or higher)

## 🚀 Installation

### Quick Start (Web App)

1. Clone the repository:
   ```bash
   git clone https://github.com/harpychat/astrsk.ai.git
   cd astrsk.ai
   ```

2. Navigate to the web app:
   ```bash
   cd apps/web
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Desktop App (Electron PWA)

The desktop app is an Electron wrapper around the PWA, providing native desktop features:

1. Navigate to the desktop app:
   ```bash
   cd apps/desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The app is pre-configured for development:
   ```bash
   # Default .env.development already points to http://localhost:5173
   # To use a different URL, modify .env.development or set:
   export MAIN_VITE_PWA_URL=http://your-dev-url:port
   ```

4. Start development mode:
   ```bash
   npm run dev
   ```

**Environment Configuration**:
- Development: Uses `.env.development` (default: `http://localhost:5173`)
- Override: Set `MAIN_VITE_PWA_URL` environment variable to use a custom URL

## 💻 Usage

### Basic Usage

1. **Create Your First Character**
   - Click "New Character" to start crafting your AI persona
   - Customize personality, background, and behavior
   - Set up character-specific prompts and parameters

2. **Design Conversation Flows**
   - Open the Visual Flow Editor
   - Drag and drop panels to create branching narratives
   - Connect different story paths and outcomes

3. **Configure AI Providers**
   - Go to Settings → AI Providers
   - Add your API keys (OpenAI, Google AI Studio, etc.)
   - Select and customize models for different characters

### Advanced Features

- **Template System**: Use MiniJinja templates for dynamic, context-aware prompts
- **Parameter Control**: Fine-tune temperature, max tokens, and other AI parameters per character
- **Story Branching**: Create complex narrative trees with conditional logic
- **Session Management**: Save and resume conversations across devices
- **Export Options**: Export your stories and conversations in multiple formats
- **PWA Features**: Install as desktop/mobile app, work offline with full functionality

## 🏗️ Project Structure

### Repository Organization

```
astrsk.ai/
├── docs/                 # User documentation and manuals
│   ├── getting-started/  # Getting started guides
│   ├── user-guide/       # User manual markdown files
│   └── api-reference/    # API documentation
├── apps/
│   ├── web/              # Main PWA application
│   │   ├── src/
│   │   │   ├── modules/  # Domain modules (DDD structure)
│   │   │   │   ├── agent/
│   │   │   │   ├── flow/
│   │   │   │   └── session/
│   │   │   ├── app/      # Application layer
│   │   │   ├── components/ # shadcn/ui components
│   │   │   ├── db/       # Database schema and migrations
│   │   │   └── shared/   # Shared utilities
│   │   └── public/
│   └── desktop/          # Electron wrapper (native desktop app)
│       ├── build/        # Build resources (icons, entitlements)
│       ├── resources/    # Application resources
│       ├── src/
│       │   ├── main/     # Main process (window management, IPC)
│       │   ├── preload/  # Preload scripts (secure bridge)
│       │   └── shared/   # Shared types and constants
│       ├── electron.vite.config.ts
│       ├── electron-builder.yml     # Production build config
│       └── tsconfig.*.json          # TypeScript configs
```

### Architecture Overview

This project follows Domain-Driven Design with Clean Architecture principles:

### Technology Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (built on Radix UI)
- **Database**: PGlite (PostgreSQL WASM) - Local only
- **AI SDKs**: Vercel AI SDK with multiple providers
- **PWA**: Vite PWA plugin
- **Desktop**: Electron wrapper with auto-updater

### Desktop App Architecture

The desktop app uses Electron to wrap the PWA, adding native capabilities:

#### Core Features
- **Auto-Updates**: GitHub releases integration for seamless updates
- **Native Window Controls**: Custom title bar with platform-specific behaviors
- **Window State Persistence**: Remembers size, position, and maximized state
- **Multi-Display Support**: Proper window positioning across monitors
- **Platform Integration**: Native installers for Windows, macOS, and Linux

#### IPC Architecture
Secure communication between processes via structured channels:
- `UPDATER_CHANNEL`: Auto-update operations
- `TOP_BAR_CHANNEL`: Window control operations
- `DUMP_CHANNEL`: Diagnostic dumps
- `DEBUG_CHANNEL`: Development tools

## 🛠️ Development

### Code Style

- TypeScript with strict mode
- ESLint for code quality
- Prettier for formatting
- Follow existing patterns in the codebase

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest path/to/test.spec.ts

# Run with coverage
npm run test:coverage
```

### License Compliance

```bash
# Check third-party licenses for commercial compatibility
npm run check:licenses
```

The project automatically:
- Generates `dist/THIRD-PARTY-NOTICES.txt` during build with all dependency licenses
- Checks for commercially problematic licenses (GPL, LGPL, AGPL, etc.)
- Fails the build if incompatible licenses are found
- Includes license file in distribution (not in source control)

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- session.spec.ts

# Debug mode
npm run test:e2e:debug
```

Our comprehensive E2E test suite covers:
- **Core User Flows**: Session management, card operations, flow editor
- **AI Providers**: All supported providers (OpenAI, Anthropic, Google AI, etc.)
- **PWA Features**: Installation, offline functionality, performance
- **Cross-browser**: Chrome, Firefox, Safari, and mobile browsers
- **Accessibility**: Keyboard navigation and screen reader support

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Community

### Development
- **GitHub**: [https://github.com/harpychat/astrsk.ai](https://github.com/harpychat/astrsk.ai)
- **Issues**: [https://github.com/harpychat/astrsk.ai/issues](https://github.com/harpychat/astrsk.ai/issues)
- **Discussions**: [https://github.com/harpychat/astrsk.ai/discussions](https://github.com/harpychat/astrsk.ai/discussions)

### Community
- **Discord**: [Join our community](https://discord.com/invite/J6ry7w8YCF)
- **Reddit**: [r/astrsk_ai](https://www.reddit.com/r/astrsk_ai/)
- **Twitter/X**: [@astrskai](https://x.com/astrskai)
- **LinkedIn**: [astrsk-ai](https://www.linkedin.com/company/astrsk-ai/)
- **Medium**: [astrsk-ai blog](https://medium.com/astrsk-ai)

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for AI provider integrations
- [PGlite](https://github.com/electric-sql/pglite) for WebAssembly PostgreSQL
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [TanStack Query](https://tanstack.com/query) for powerful data synchronization
- [React Flow](https://reactflow.dev/) for the visual flow editor
- [MiniJinja](https://github.com/mitsuhiko/minijinja) for powerful templating

## 🌐 Website & Downloads

- **Website**: [astrsk.ai](https://astrsk.ai)
- **Web App**: [app.astrsk.ai](https://app.astrsk.ai)
- **Download for Mac**: [Latest Release](https://github.com/harpychat/astrsk-ai-release/releases/download/v2.0.0/astrsk-2.0.0.dmg)
- **Download for Windows**: [Latest Release](https://github.com/harpychat/astrsk-ai-release/releases/download/v2.0.0/astrsk-2.0.0.exe)

---

<p align="center">Made with ❤️ by the astrsk.ai team</p>