# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# 開発モード（ホットリロード付き）
bun run dev

# 型チェック・リント・GraphQL検証を実行
bun run check

# 個別の検証コマンド
bun run typecheck        # TypeScript型チェック
bun run lint             # ESLintによるリント
bun run validate:graphql # GraphQL APIコール検証

# テスト
bun run test           # 単体テスト実行
bun run test:watch     # ウォッチモードでテスト
bun run test:coverage  # カバレッジ付きテスト

# ビルド・デプロイ
bun run build    # プロダクションビルド（dist/に出力）
bun run link-local  # ビルド後、ローカル環境にCLIツールをインストール
bun run start    # ビルド済みファイルを実行
```

## Architecture Overview

このプロジェクトはLinear APIと連携するターミナルUIアプリケーションで、React Inkを使用したインタラクティブなCLIツールです。

### Core Technologies
- **Runtime**: Bun（JavaScriptランタイム兼パッケージマネージャー）
- **UI Framework**: React Ink（ターミナルUI用React）
- **API Client**: @linear/sdk（Linear公式SDK）
- **State Management**: React hooks（useState, useEffect）
- **Configuration**: conf（永続的な設定管理）

### Directory Structure & Responsibilities

```
src/
├── cli.tsx              # CLIエントリーポイント、Commander.jsでコマンド定義
├── commands/            # CLIコマンドの実装
│   ├── config.tsx       # Linear API設定（トークン、チーム管理）
│   └── issue.tsx        # Issue表示コマンド（メインUI起動）
├── components/          # React Inkコンポーネント層
│   ├── App.tsx         # メインメニュー、ナビゲーション管理
│   ├── MyIssues.tsx    # 自分のIssue一覧（全て/現在のサイクル）
│   ├── CycleIssues.tsx # チーム全体のサイクルIssue
│   └── IssueDetail.tsx # Issue詳細表示
├── services/           # ビジネスロジック・外部API連携
│   ├── linear.ts       # Linear API操作、GraphQLクエリ実装
│   ├── config.ts       # 設定の永続化（APIキー、チーム情報）
│   ├── cache.ts        # メモリキャッシュ実装（TTL付き）
│   └── graphql-validator.ts # GraphQLクエリの静的検証
└── utils/              # 共通ユーティリティ
    ├── format.ts       # 日付・ステータス・優先度のフォーマット
    └── sort.ts         # Issue並び替えロジック
```

### Key Architectural Patterns

1. **Component Navigation Pattern**
   - App.tsxが画面遷移を管理（currentView stateで制御）
   - 各画面コンポーネントはonBack/onSelectコールバックで親と通信
   - q/Escキーで前の画面に戻る統一されたナビゲーション

2. **API Layer Abstraction**
   - services/linear.tsがLinear SDKをラップ
   - GraphQLクエリはlinear.ts内に集約
   - キャッシュ層（cache.ts）でAPI呼び出しを最適化

3. **Configuration Management**
   - confライブラリで~/.config/configstoreに設定保存
   - APIトークンとチーム情報を永続化
   - 初回起動時に設定フローを自動表示

4. **Error Handling**
   - API層でエラーをキャッチしてユーザーフレンドリーなメッセージ表示
   - GraphQL検証でビルド時にクエリの整合性チェック

### Development Considerations

- **日本語対応**: UIメッセージ、コメントは日本語で記述
- **Bun専用**: Node.jsではなくBunランタイムを前提に開発
- **React Ink特有の制約**: 通常のReactと異なり、DOM APIは使用不可
- **ターミナルUI**: キーボード操作のみ、マウス非対応
- **GraphQL検証**: コード変更後は`bun run validate:graphql`で検証必須

## Project Management

- IssueはGitHub Issuesで管理