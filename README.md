# 🚀 Linear CLI

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Built with Bun">
  <img src="https://img.shields.io/badge/React-Ink-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Ink">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Linear-5E6AD2?style=for-the-badge&logo=linear&logoColor=white" alt="Linear">
</div>

<div align="center">
  <h3>⚡ 高速でインタラクティブなLinear Issue管理ツール</h3>
  <p>ターミナルから離れることなく、Linear Issueを素早く確認・管理</p>
</div>

---

## ✨ 特徴

### 🎯 **直感的なインターフェース**
- **インタラクティブなメニュー** - 矢印キーで簡単ナビゲーション
- **スマートなリスト表示** - 優先度とステータスで自動整列
- **仮想スクロール** - 大量のIssueもスムーズに表示

### ⚡ **高速な操作**
- **キーボードショートカット** - `j/k`でスクロール、数字キーでリンクを開く
- **インテリジェントキャッシュ** - 瞬時の画面遷移
- **Bun runtime** - 超高速な起動と実行

### 🔗 **シームレスな統合**
- **GitHub連携** - PR情報を自動表示
- **クリップボードサポート** - Issue情報をワンタッチでコピー
- **ブラウザ連携** - IssueやPRを素早く開く

## 📸 スクリーンショット

```
📋 自分のIssue（Sprint 23）(5件)
↑↓で選択、Enterで詳細表示、qまたはEscで戻る

❯ AME-1234  ⬤ High        APIエンドポイントの実装
  AME-1235  ⬤ Medium      ドキュメントの更新
  AME-1236  ⬤ Low         テストケースの追加
```

## 🚀 クイックスタート

### 必要要件
- [Bun](https://bun.sh) >= 1.0.0
- Linear APIトークン（[取得方法](https://developers.linear.app/docs/graphql/working-with-the-graphql-api#personal-api-keys)）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/linear-cli.git
cd linear-cli

# 依存関係をインストール
bun install

# ビルド & グローバルインストール
bun run link-local
```

### 初期設定

```bash
# APIトークンを設定
linear config set-token

# デフォルトチームを設定（オプション）
linear config set-team
```

## 📖 使い方

### 基本コマンド

```bash
# メインメニューを表示（デフォルト: 自分の現在のサイクルIssue）
linear

# 自分の現在のサイクルのIssue
linear mine

# 自分のすべてのIssue
linear mine-all

# チーム全体の現在のサイクルIssue
linear cycle
```

### キーボードショートカット

#### リスト画面
| キー | 動作 |
|------|------|
| `↑` / `k` | 上に移動 |
| `↓` / `j` | 下に移動 |
| `Enter` | 詳細を表示 |
| `q` / `Esc` | 戻る / 終了 |

#### 詳細画面
| キー | 動作 |
|------|------|
| `↑` / `k` | 上にスクロール |
| `↓` / `j` | 下にスクロール |
| `1-9` | 対応するリンクを開く |
| `c` | Issue情報をクリップボードにコピー |
| `q` / `Esc` | リストに戻る |

## 🛠️ 開発

### 開発環境セットアップ

```bash
# 開発モード（ホットリロード付き）
bun run dev

# 型チェック
bun run typecheck

# ビルド
bun run build

# テスト
bun run test
```

### プロジェクト構成

```
src/
├── cli.tsx              # エントリーポイント
├── components/          # UIコンポーネント
│   ├── App.tsx         # メイン画面管理
│   ├── MyIssues.tsx    # 自分のIssue一覧
│   ├── CycleIssues.tsx # サイクルIssue一覧
│   └── IssueDetail.tsx # Issue詳細表示
├── services/           # ビジネスロジック
│   ├── linear.ts       # Linear API連携
│   └── config.ts       # 設定管理
└── utils/              # ユーティリティ
    ├── format.ts       # フォーマッター
    └── sort.ts         # ソート処理
```

## 🔧 設定

設定ファイルは `~/.config/configstore/linear-cli.json` に保存されます。

### 利用可能な設定

- `linearApiToken` - Linear APIトークン
- `defaultTeamId` - デフォルトのチームID
- `defaultProjectId` - デフォルトのプロジェクトID（オプション）

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずIssueを開いて変更内容について議論してください。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Linear](https://linear.app) - 素晴らしいプロジェクト管理ツール
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Bun](https://bun.sh) - 高速なJavaScriptランタイム

---

<div align="center">
  <sub>Built with ❤️ and ☕ by developers, for developers</sub>
</div>