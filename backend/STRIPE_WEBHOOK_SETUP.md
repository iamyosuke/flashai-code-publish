# Stripe Webhook セットアップガイド

このガイドでは、AI Flashcard GeneratorプロジェクトでStripe Webhookを設定する方法を説明します。

## 🔧 環境設定

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数を追加してください：

```bash


### 2. Stripe CLIのインストール

```bash
# macOS
brew install stripe/stripe-cli/stripe

# その他のOSの場合は公式ドキュメントを参照
# https://stripe.com/docs/stripe-cli
```

### 3. Stripe CLIでログイン

```bash
stripe login
```

## 🚀 開発環境でのテスト

### 1. サーバーの起動

```bash
cd backend
go run main.go
```

サーバーは `http://localhost:8080` で起動します。

### 2. Webhook エンドポイントの確認

Stripe Webhookエンドポイントは以下のURLで利用可能です：

```
POST http://localhost:8080/api/stripe/webhook
```

### 3. Stripe CLIでWebhookイベントの転送

```bash
stripe listen --forward-to localhost:8080/api/stripe/webhook
```

このコマンドを実行すると、Webhook署名シークレットが表示されます：

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

この値を `.env` ファイルの `STRIPE_WEBHOOK_SECRET` に設定してください。

### 4. テストイベントの送信

別のターミナルで以下のコマンドを実行してテストイベントを送信：

```bash
# 支払い成功イベント
stripe trigger payment_intent.succeeded

# 支払い失敗イベント
stripe trigger payment_intent.payment_failed

# サブスクリプション作成イベント
stripe trigger customer.subscription.created

# サブスクリプション更新イベント
stripe trigger customer.subscription.updated

# サブスクリプション削除イベント
stripe trigger customer.subscription.deleted

# 請求書支払い成功イベント
stripe trigger invoice.payment_succeeded

# 請求書支払い失敗イベント
stripe trigger invoice.payment_failed
```

## 📋 対応しているWebhookイベント

現在のStripe Webhookコントローラーは以下のイベントに対応しています：

### 支払い関連
- `payment_intent.succeeded` - 支払い成功
- `payment_intent.payment_failed` - 支払い失敗

### サブスクリプション関連
- `customer.subscription.created` - サブスクリプション作成
- `customer.subscription.updated` - サブスクリプション更新
- `customer.subscription.deleted` - サブスクリプション削除

### 請求書関連
- `invoice.payment_succeeded` - 請求書支払い成功
- `invoice.payment_failed` - 請求書支払い失敗

## 🔒 セキュリティ

### Webhook署名の検証

すべてのWebhookリクエストは署名検証を行います：

1. `Stripe-Signature` ヘッダーの確認
2. `STRIPE_WEBHOOK_SECRET` を使用した署名検証
3. 無効な署名の場合は400エラーを返却

### 環境変数の管理

- 本番環境では必ず本番用のStripeキーを使用
- Webhookシークレットは絶対に公開しない
- `.env` ファイルは `.gitignore` に含める

## 🧪 テスト

### 単体テストの実行

```bash
cd backend
go test ./controllers -v -run TestStripeWebhook
```

### 統合テストの実行

```bash
# 全てのテストを実行
go test ./... -v

# Stripeコントローラーのテストのみ実行
go test ./controllers -v -run TestStripeWebhookController
```

## 🏭 本番環境での設定

### 1. Stripe Dashboardでのエンドポイント設定

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) にアクセス
2. 「Add endpoint」をクリック
3. エンドポイントURL: `https://your-domain.com/api/stripe/webhook`
4. 必要なイベントを選択
5. エンドポイントを作成

### 2. Webhook署名シークレットの取得

1. 作成したエンドポイントをクリック
2. 「Signing secret」セクションで「Reveal」をクリック
3. 表示されたシークレットを `STRIPE_WEBHOOK_SECRET` に設定

### 3. 本番環境変数の設定

```bash
# 本番用のStripeキー
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📊 ログとモニタリング

### ログの確認

Webhookイベントの処理状況はサーバーログで確認できます：

```bash
# 成功ログの例
✅ Payment succeeded for amount: 2000 usd
🆕 Subscription created: sub_1234567890
💰 Invoice payment succeeded: in_1234567890, amount: 2000

# エラーログの例
❌ Payment failed for amount: 2000 usd
💸 Invoice payment failed: in_1234567890, amount: 2000
⚠️  Webhook signature verification failed: ...
```

### Stripe Dashboardでの確認

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) でエンドポイントを選択
2. 「Attempts」タブで配信状況を確認
3. 失敗した場合は詳細を確認して対応

## 🔧 トラブルシューティング

### よくある問題

1. **署名検証エラー**
   - `STRIPE_WEBHOOK_SECRET` が正しく設定されているか確認
   - Stripe CLIまたはDashboardから正しいシークレットを取得

2. **エンドポイントに到達しない**
   - サーバーが正しいポートで起動しているか確認
   - ファイアウォールやプロキシの設定を確認

3. **イベント処理エラー**
   - サーバーログでエラー詳細を確認
   - データベース接続やモデル定義を確認

### デバッグ方法

```bash
# 詳細ログを有効にして起動
GIN_MODE=debug go run main.go

# Stripe CLIでイベント詳細を確認
stripe events list --limit 10
```

## 📚 参考資料

- [Stripe Webhook ドキュメント](https://stripe.com/docs/webhooks)
- [Stripe CLI ドキュメント](https://stripe.com/docs/stripe-cli)
- [Stripe Go SDK](https://github.com/stripe/stripe-go)
