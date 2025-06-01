# 🛠️ AI Flashcard Generator - Technical Context

## 💻 開発環境

### 必要なツール
- Node.js 18.x以上
- Go 1.23以上
- Docker & Docker Compose
- PostgreSQL 15.x
- Git
- Visual Studio Code（推奨）

### IDE設定（VS Code）
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "gopls.experimentalWorkspaceModule": true
}
```

### 推奨拡張機能
1. フロントエンド
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript Vue Plugin

2. バックエンド
   - Go
   - Go Test Explorer
   - REST Client

## 🏗️ 技術スタック詳細

### フロントエンド
1. **Next.js (App Router)**
   - TypeScript
   - React Server Components
   - Server Actions
   - Edge Runtime対応

2. **状態管理**
   - TanStack Query v5
   - React Context
   - Zustand（必要に応じて）

3. **UI/スタイリング**
   - Tailwind CSS
   - Radix UI
   - Framer Motion

4. **フォーム管理**
   - React Hook Form
   - Zod（バリデーション）

### バックエンド
1. **Go (Gin)**
   - Clean Architecture
   - Wire（DI）
   - Testify（テスト）

2. **データベース**
   - PostgreSQL
   - GORM
   - sql-migrate

3. **キャッシュ**
   - Redis（必要に応じて）
   - In-memory cache

### AI統合
1. **OpenAI**
   - GPT-4/3.5
   - Function Calling
   - Streaming responses

2. **ローカル処理**
   - Tokenization
   - Text processing
   - Rate limiting

## 🔗 依存関係管理

### フロントエンド（package.json）
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "@clerk/nextjs": "^4.0.0",
    "zod": "^3.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^18.0.0"
  }
}
```

### バックエンド（go.mod）
```go
module github.com/yourusername/ai-flashcards

go 1.23

require (
    github.com/gin-gonic/gin v1.9.0
    gorm.io/gorm v1.25.0
    gorm.io/driver/postgres v1.5.0
    github.com/stretchr/testify v1.8.0
    github.com/google/wire v0.5.0
)
```

## 🛡️ セキュリティ設定

### 1. 環境変数
```env
# Frontend (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=

# Backend (.env)
DATABASE_URL=
OPENAI_API_KEY=
JWT_SECRET=
CORS_ORIGIN=
```

### 2. CORS設定
```go
func setupCORS(router *gin.Engine) {
    config := cors.DefaultConfig()
    config.AllowOrigins = []string{"http://localhost:3000"}
    config.AllowHeaders = []string{"Origin", "Authorization", "Content-Type"}
    router.Use(cors.New(config))
}
```

## 📦 インフラストラクチャ

### Docker設定
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - GO_ENV=development
    volumes:
      - ./backend:/app

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=flashcards

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🧪 テスト戦略

### フロントエンドテスト
1. **単体テスト**
   - Vitest
   - React Testing Library
   - MSW（APIモック）

2. **E2Eテスト**
   - Playwright
   - テストデータセットアップ
   - 自動化スクリプト

### バックエンドテスト
1. **単体テスト**
   - Go標準テストパッケージ
   - Testify
   - Mockery

2. **統合テスト**
   - テストコンテナ
   - Database fixtures
   - API tests

## 📊 パフォーマンス最適化

### フロントエンド
1. **ビルド最適化**
   - Tree shaking
   - Code splitting
   - Image optimization

2. **ランタイム最適化**
   - Memoization
   - Virtualization
   - Lazy loading

### バックエンド
1. **データベース最適化**
   - インデックス設計
   - クエリチューニング
   - コネクションプール

2. **キャッシュ戦略**
   - 多層キャッシュ
   - Cache invalidation
   - Prefetching

## 📝 コーディング規約

### TypeScript
```typescript
// インターフェース命名
interface IUserRepository {
  findById(id: string): Promise<User>;
}

// 型定義
type CardStatus = 'new' | 'learning' | 'review';

// エラーハンドリング
class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}
```

### Go
```go
// インターフェース定義
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

// エラー定義
type Error struct {
    Code    string
    Message string
}

// DIコンテナ
type Container struct {
    UserRepo UserRepository
    CardRepo CardRepository
}
```

## 🔄 CI/CD パイプライン

### GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Setup Go
        uses: actions/setup-go@v4
      # テスト実行ステップ

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # デプロイステップ
