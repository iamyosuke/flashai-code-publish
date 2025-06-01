# AI Flashcards - Terraform Infrastructure

このディレクトリには、AI FlashcardsアプリケーションのAWSインフラストラクチャを管理するTerraformコードが含まれています。

## 🏗️ インフラストラクチャ構成

### 主要コンポーネント
- **VPC**: プライベートネットワーク環境
- **ECS Fargate**: コンテナ化されたバックエンドアプリケーション
- **RDS PostgreSQL**: データベース（AWS無料枠対応）
- **Application Load Balancer**: ロードバランサー
- **Parameter Store**: 環境変数の安全な管理
- **ECR**: Dockerイメージレジストリ

### アーキテクチャ図
```
Internet
    ↓
Application Load Balancer (Public Subnets)
    ↓
ECS Fargate Tasks (Public Subnets)
    ↓
RDS PostgreSQL (Private Subnets)
```

## 🚀 デプロイ手順

### 1. 前提条件
- AWS CLI設定済み
- Terraform 1.5.0以上
- 適切なAWS権限

### 2. 環境変数の設定

#### terraform.tfvarsファイルの作成
```bash
# テンプレートをコピー
cp terraform.tfvars.example terraform.tfvars

# 実際の値を入力
vim terraform.tfvars
```

#### terraform.tfvarsの内容例
```hcl
# Project Configuration
project     = "ai-flashcards"
environment = "production"
aws_region  = "ap-northeast-1"

# Database Configuration
database_password = "your-secure-database-password"

# Clerk Configuration
clerk_secret_key     = "sk_test_your-clerk-secret-key"
clerk_webhook_secret = "whsec_your-clerk-webhook-secret"

# Gemini AI Configuration
gemini_api_key = "your-gemini-api-key"

# Stripe Configuration
stripe_secret_key      = "sk_test_your-stripe-secret-key"
stripe_publishable_key = "pk_test_your-stripe-publishable-key"
stripe_webhook_secret  = "whsec_your-stripe-webhook-secret"
```

### 3. Terraformの実行

```bash
# 初期化
terraform init

# プランの確認
terraform plan

# インフラストラクチャの作成
terraform apply
```

## 📁 ディレクトリ構造

```
terraform/
├── main.tf                    # メインの設定
├── variables.tf               # 変数定義
├── outputs.tf                 # 出力値
├── versions.tf                # プロバイダーバージョン
├── terraform.tfvars.example   # 環境変数テンプレート
├── terraform.tfvars          # 実際の環境変数（Git除外）
└── modules/
    ├── network/              # VPC、サブネット
    ├── alb/                  # Application Load Balancer
    ├── ecs/                  # ECS Cluster、Service
    ├── rds/                  # PostgreSQL Database
    └── ssm/                  # Parameter Store
```

## 🔐 セキュリティ

### Parameter Store
機密情報はAWS Parameter Storeで暗号化して保存されます：

```
/ai-flashcards/production/CLERK_SECRET_KEY
/ai-flashcards/production/DATABASE_URL
/ai-flashcards/production/GEMINI_API_KEY
/ai-flashcards/production/STRIPE_SECRET_KEY
/ai-flashcards/production/STRIPE_WEBHOOK_SECRET
```

### IAMロール
- ECSタスク実行ロール: ECRアクセス、Parameter Store読み取り
- ECSタスクロール: アプリケーション実行権限
- GitHub Actionsロール: CI/CDパイプライン権限

## 💰 コスト最適化

### AWS無料枠の活用
- **RDS**: db.t3.micro（750時間/月）
- **ECS**: Fargate（無料枠なし、最小構成）
- **Parameter Store**: Standard（10,000パラメータまで無料）
- **ALB**: 750時間/月

### 予想月額コスト
```
RDS (db.t3.micro): $0（無料枠）
ECS Fargate: ~$15-20
ALB: $0（無料枠）
Parameter Store: $0（無料枠）
その他（データ転送等）: ~$5

合計: ~$20-25/月
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. terraform.tfvarsが見つからない
```bash
# エラー: No value for required variable
# 解決: terraform.tfvarsファイルを作成
cp terraform.tfvars.example terraform.tfvars
```

#### 2. AWS権限エラー
```bash
# エラー: AccessDenied
# 解決: AWS CLIの設定確認
aws sts get-caller-identity
```

#### 3. RDS接続エラー
```bash
# ECSタスクからRDSに接続できない場合
# セキュリティグループの設定を確認
```

## 📊 監視とログ

### CloudWatch Logs
- ECSタスクログ: `/ecs/ai-flashcards-backend`
- RDS監視: Enhanced Monitoring有効

### ヘルスチェック
- ALBヘルスチェック: `/health`エンドポイント
- ECSサービス安定性監視

## 🔄 CI/CD

GitHub Actionsワークフローが以下を自動実行：
1. Dockerイメージビルド・プッシュ
2. Terraformによるインフラ更新
3. ECSサービスの更新
4. ヘルスチェック

## 📝 環境変数管理のベストプラクティス

### ローカル開発
```bash
# terraform.tfvarsを使用
terraform plan
terraform apply
```

### CI/CD
```bash
# GitHub Secretsから動的生成
# .github/workflows/deploy.yml参照
```

### 本番運用
```bash
# Parameter Storeで直接管理
aws ssm put-parameter \
  --name "/ai-flashcards/production/NEW_SECRET" \
  --value "secret-value" \
  --type "SecureString"
```

## 🆘 サポート

問題が発生した場合：
1. このREADMEのトラブルシューティングセクションを確認
2. AWS CloudWatchログを確認
3. Terraformの状態ファイルを確認
4. 必要に応じてインフラを再作成

---

**注意**: `terraform.tfvars`ファイルには機密情報が含まれるため、Gitにコミットしないでください。このファイルは`.gitignore`で除外されています。
