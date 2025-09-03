# 🚀 Linear CLI

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Built with Bun">
  <img src="https://img.shields.io/badge/React-Ink-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Ink">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Linear-5E6AD2?style=for-the-badge&logo=linear&logoColor=white" alt="Linear">
</div>

<div align="center">
  <h3>⚡ Fast and Interactive Linear Issue Management Tool</h3>
  <p>Quickly view and manage Linear issues without leaving your terminal</p>
</div>

---

## ✨ Features

- 📋 **View Issues** - Browse your issues, team issues, or all issues
- 🔍 **Search** - Find issues quickly with real-time search
- ➕ **Create Issues** - Create new issues directly from terminal
- 🔗 **GitHub Integration** - View linked PRs and open them instantly
- ⚡ **Fast & Responsive** - Built with Bun for ultra-fast performance
- 💾 **Smart Caching** - Instant navigation with intelligent cache

## 🚧 Roadmap

- [ ] Edit existing issues
- [ ] Add/view comments
- [ ] Bulk operations (close, assign, label)
- [ ] Project and milestone filtering
- [ ] Custom views and saved filters
- [ ] Time tracking integration
- [ ] Slack notifications
- [ ] Export to CSV/JSON
- [ ] Offline mode with sync
- [ ] Team performance analytics

## 🚀 Quick Start

### Requirements
- [Bun](https://bun.sh) >= 1.0.0
- Linear API token ([How to get](https://developers.linear.app/docs/graphql/working-with-the-graphql-api#personal-api-keys))

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/linear-cli.git
cd linear-cli

# Install dependencies
bun install

# Build & global install
bun run link-local
```

### Initial Setup

```bash
# Set API token
linear config set-token <your-token>

# Set default team (optional)
linear config set-team
```

## 📖 Usage

### Basic Commands

```bash
# Interactive menu
linear

# View my current cycle issues
linear mine

# View all my issues
linear mine-all

# View team's current cycle issues
linear cycle

# Search issues
linear search

# Create new issue
linear create
```

### Keyboard Shortcuts

#### Navigation
- `↑`/`↓` or `j`/`k` - Navigate lists
- `Enter` - Select/Open
- `q` or `Esc` - Go back/Exit

#### Issue Details
- `1-9` - Open numbered links
- `c` - Copy issue info to clipboard
- `j`/`k` - Scroll content

## 🛠️ Development

```bash
# Development mode
bun run dev

# Run tests
bun run test

# Type checking & linting
bun run check

# Build for production
bun run build
```

### Project Structure

```
src/
├── cli.tsx              # CLI entry point
├── components/          # React Ink UI components
├── services/           # Business logic & API
└── utils/              # Utilities & helpers
```

## 🔧 Configuration

Configuration is stored in `~/.config/configstore/linear-cli.json`

- `linearApiToken` - Your Linear API token
- `defaultTeamId` - Default team for operations
- `defaultProjectId` - Default project (optional)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Linear](https://linear.app) - Project management platform
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Bun](https://bun.sh) - JavaScript runtime & toolkit

---

<div align="center">
  <sub>Built with ❤️ and ☕ by developers, for developers</sub>
</div>