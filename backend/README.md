# AI Flashcards Backend

このプロジェクトは、AI Flashcardsのバックエンドサーバーを実装したものです。Clerk認証を使用してユーザー認証を管理しています。

## 必要条件

- Go 1.23以上
- Clerk アカウントとAPI Key

## セットアップ

1. 依存関係のインストール:
```bash
go mod download
```

2. 環境変数の設定:
`.env`ファイルを作成し、以下の環境変数を設定してください：
```
CLERK_SECRET_KEY=your_clerk_secret_key_here
PORT=8080
```

3. サーバーの起動:
```bash
go run main.go
```

## APIエンドポイント

### パブリックエンドポイント
- `GET /public`: 認証不要のパブリックエンドポイント

### 認証が必要なエンドポイント
- `GET /private/profile`: ユーザープロファイル情報の取得

## 認証

このアプリケーションはClerk認証を使用しています。APIリクエストには、Clerkから取得した有効なJWTトークンをAuthorizationヘッダーに含める必要があります：

```
Authorization: Bearer <your_jwt_token>
```

## 開発

1. コードの変更を行う
2. テストを実行: `go test ./...`
3. サーバーを起動: `go run main.go` 