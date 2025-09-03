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

### 🎯 **Intuitive Interface**
- **Interactive menus** - Easy navigation with arrow keys
- **Smart list display** - Auto-sorted by priority and status
- **Virtual scrolling** - Smooth display of large issue lists

### ⚡ **Fast Operations**
- **Keyboard shortcuts** - `j/k` to scroll, number keys to open links
- **Intelligent caching** - Instant screen transitions
- **Bun runtime** - Ultra-fast startup and execution

### 🔗 **Seamless Integration**
- **GitHub integration** - Auto-display PR information
- **Clipboard support** - One-touch copy of issue info
- **Browser integration** - Quickly open issues and PRs

## 📸 Screenshot

```
📋 My Issues (Sprint 23) (5 items)
Use ↑↓ to select, Enter to view details, q or Esc to go back

❯ AME-1234  ⬤ High        Implement API endpoints
  AME-1235  ⬤ Medium      Update documentation
  AME-1236  ⬤ Low         Add test cases
```

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
# Show main menu (default: my current cycle issues)
linear

# My current cycle issues
linear mine

# All my issues
linear mine-all

# Team's current cycle issues
linear cycle
```

### Keyboard Shortcuts

#### List View
| Key | Action |
|------|------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `Enter` | Show details |
| `q` / `Esc` | Back / Exit |

#### Detail View
| Key | Action |
|------|------|
| `↑` / `k` | Scroll up |
| `↓` / `j` | Scroll down |
| `1-9` | Open corresponding link |
| `c` | Copy issue info to clipboard |
| `q` / `Esc` | Back to list |

## 🛠️ Development

### Development Environment Setup

```bash
# Development mode (with hot reload)
bun run dev

# Type check
bun run typecheck

# Build
bun run build

# Test
bun run test
```

### Project Structure

```
src/
├── cli.tsx              # Entry point
├── components/          # UI components
│   ├── App.tsx         # Main screen management
│   ├── MyIssues.tsx    # My issues list
│   ├── CycleIssues.tsx # Cycle issues list
│   └── IssueDetail.tsx # Issue detail view
├── services/           # Business logic
│   ├── linear.ts       # Linear API integration
│   └── config.ts       # Config management
└── utils/              # Utilities
    ├── format.ts       # Formatters
    └── sort.ts         # Sort logic
```

## 🔧 Configuration

Configuration file is saved at `~/.config/configstore/linear-cli.json`.

### Available Settings

- `linearApiToken` - Linear API token
- `defaultTeamId` - Default team ID
- `defaultProjectId` - Default project ID (optional)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Linear](https://linear.app) - Amazing project management tool
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Bun](https://bun.sh) - Fast JavaScript runtime

---

<div align="center">
  <sub>Built with ❤️ and ☕ by developers, for developers</sub>
</div>