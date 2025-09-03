# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development mode (with hot reload)
bun run dev

# Run type check, lint, and GraphQL validation
bun run check

# Individual validation commands
bun run typecheck        # TypeScript type check
bun run lint             # ESLint linting
bun run validate:graphql # GraphQL API call validation

# Testing
bun run test           # Run unit tests
bun run test:watch     # Test in watch mode
bun run test:coverage  # Test with coverage

# Build & Deploy
bun run build    # Production build (output to dist/)
bun run link-local  # Install CLI tool locally after build
bun run start    # Run built files
```

## Architecture Overview

This project is a terminal UI application that integrates with Linear API, an interactive CLI tool using React Ink.

### Core Technologies
- **Runtime**: Bun (JavaScript runtime and package manager)
- **UI Framework**: React Ink (React for terminal UI)
- **API Client**: @linear/sdk (Official Linear SDK)
- **State Management**: React hooks (useState, useEffect)
- **Configuration**: conf (Persistent configuration management)

### Directory Structure & Responsibilities

```
src/
├── cli.tsx              # CLI entry point, command definition with Commander.js
├── commands/            # CLI command implementations
│   ├── config.tsx       # Linear API settings (token, team management)
│   └── issue.tsx        # Issue display command (launch main UI)
├── components/          # React Ink component layer
│   ├── App.tsx         # Main menu, navigation management
│   ├── MyIssues.tsx    # My issues list (all/current cycle)
│   ├── CycleIssues.tsx # Team-wide cycle issues
│   └── IssueDetail.tsx # Issue detail display
├── services/           # Business logic, external API integration
│   ├── linear.ts       # Linear API operations, GraphQL query implementation
│   ├── config.ts       # Configuration persistence (API key, team info)
│   ├── cache.ts        # Memory cache implementation (with TTL)
│   └── graphql-validator.ts # GraphQL query static validation
└── utils/              # Common utilities
    ├── format.ts       # Date, status, priority formatting
    └── sort.ts         # Issue sorting logic
```

### Key Architectural Patterns

1. **Component Navigation Pattern**
   - App.tsx manages screen transitions (controlled by currentView state)
   - Each screen component communicates with parent via onBack/onSelect callbacks
   - Unified navigation with q/Esc keys to go back

2. **API Layer Abstraction**
   - services/linear.ts wraps Linear SDK
   - GraphQL queries are centralized in linear.ts
   - Cache layer (cache.ts) optimizes API calls

3. **Configuration Management**
   - Settings saved in ~/.config/configstore using conf library
   - API token and team info persisted
   - Auto-display configuration flow on first launch

4. **Error Handling**
   - API layer catches errors and displays user-friendly messages
   - GraphQL validation checks query consistency at build time

### Development Considerations

- **Language**: UI messages and comments in English
- **Bun-specific**: Developed for Bun runtime, not Node.js
- **React Ink constraints**: Unlike regular React, DOM APIs not available
- **Terminal UI**: Keyboard-only operation, no mouse support
- **GraphQL validation**: Must run `bun run validate:graphql` after code changes

## Project Management

- Issues are managed in GitHub Issues