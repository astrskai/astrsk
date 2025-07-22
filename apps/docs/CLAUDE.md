# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docusaurus-based documentation site for astrsk.ai, a next-generation AI agentic roleplay application. The site documents the core features including Sessions, Cards, Flows, and Providers.

## Common Commands

### Development
```bash
# Install dependencies
yarn

# Start development server with hot reload
yarn start

# Build for production
yarn build

# Type checking
yarn typecheck

# Clear cache
yarn clear

# Serve built site locally
yarn serve
```

### Available npm scripts (use with yarn)
- `start` - Start development server
- `build` - Build production site
- `typecheck` - Run TypeScript type checking
- `deploy` - Deploy to GitHub Pages
- `serve` - Serve built site locally

## Architecture

### Docusaurus Configuration
- **docusaurus.config.ts**: Main configuration file with site metadata, navbar, footer, and theme settings
- **sidebars.ts**: Sidebar configuration (currently auto-generated from docs folder structure)
- **tsconfig.json**: TypeScript configuration

### Content Structure
- **docs/**: All documentation content organized by feature
  - **getting-started.md**: Initial setup and introduction
  - **session/**: Session management documentation
  - **card/**: Card creation and management
  - **flow/**: Flow system documentation with nodes and variables
  - **provider/**: AI provider integration guides
- **src/**: React components and custom CSS
- **static/**: Static assets including images

### Key Features Documented
1. **Sessions**: AI roleplay sessions with settings, import/export, and chat history
2. **Cards**: Character and plot cards with metadata and variables
3. **Flows**: Node-based workflow system with agent nodes, start/end nodes
4. **Providers**: AI model integrations (Ollama, KoboldCpp, AI Horde)

### Navigation Structure
The site uses auto-generated sidebars from the docs folder structure. Main navigation includes Getting Started, Session, Card, Flow, and Provider sections.

## Development Notes

- Site configured for dark mode by default
- Uses TypeScript throughout
- Docs are served at root path ("/") instead of "/docs"
- Images are organized within each section's images folder
- Node.js 18+ required