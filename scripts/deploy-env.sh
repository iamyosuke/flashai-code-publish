#!/bin/bash

# AI Flashcards - Unified Environment Deployment Script
# This script deploys environment variables from a single .env file to:
# - Terraform (terraform.tfvars)
# - AWS Parameter Store

set -e

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ヘルプ表示
show_help() {
    echo "AI Flashcards Unified Environment Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -f, --file FILE         Environment file (default: .env)"
    echo "  -e, --environment ENV   Target environment (default: from .env file)"
    echo "  --terraform             Deploy to Terraform (terraform.tfvars)"
    echo "  --parameter-store       Deploy to AWS Parameter Store"
    echo "  --all                   Deploy to all targets (default)"
    echo "  --dry-run              Show what would be done without executing"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to all targets"
    echo "  $0 --terraform                       # Deploy only to Terraform"
    echo "  $0 --parameter-store                 # Deploy only to Parameter Store"
    echo "  $0 --file .env.staging               # Use staging environment file"
    echo "  $0 --dry-run                         # Preview changes"
    echo ""
}

# デフォルト値
ENV_FILE=".env"
TARGET_TERRAFORM=false
TARGET_PARAMETER_STORE=false
TARGET_ALL=true
DRY_RUN=false
OVERRIDE_ENVIRONMENT=""

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--file)
            ENV_FILE="$2"
            shift 2
            ;;
        -e|--environment)
            OVERRIDE_ENVIRONMENT="$2"
            shift 2
            ;;
        --terraform)
            TARGET_TERRAFORM=true
            TARGET_ALL=false
            shift
            ;;
        --parameter-store)
            TARGET_PARAMETER_STORE=true
            TARGET_ALL=false
            shift
            ;;
        --all)
            TARGET_ALL=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 全てのターゲットが選択されている場合
if [[ $TARGET_ALL == true ]]; then
    TARGET_TERRAFORM=true
    TARGET_PARAMETER_STORE=true
fi

echo -e "${CYAN}🚀 AI Flashcards Unified Environment Deployment${NC}"
echo -e "${CYAN}Environment file: ${ENV_FILE}${NC}"
echo ""

# .envファイルの存在確認
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo ""
    echo "Please create the environment file:"
    echo "  cp .env.example $ENV_FILE"
    echo "  vim $ENV_FILE"
    exit 1
fi

# .envファイルを読み込み
echo -e "${BLUE}📁 Loading environment variables from $ENV_FILE${NC}"
set -a  # 自動的にexport
source "$ENV_FILE"
set +a

# 環境の決定
if [[ -n "$OVERRIDE_ENVIRONMENT" ]]; then
    ENVIRONMENT="$OVERRIDE_ENVIRONMENT"
fi

echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# 必要な変数の確認
REQUIRED_VARS=(
    "PROJECT"
    "ENVIRONMENT"
    "AWS_REGION"
    "DATABASE_PASSWORD"
    "CLERK_SECRET_KEY"
    "CLERK_WEBHOOK_SECRET"
    "GEMINI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    echo ""
    echo "Please set these variables in $ENV_FILE"
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables found${NC}"

# Terraformターゲット
if [[ $TARGET_TERRAFORM == true ]]; then
    echo ""
    echo -e "${BLUE}📝 Deploying to Terraform (terraform.tfvars)${NC}"
    
    TERRAFORM_TFVARS="terraform/terraform.tfvars"
    
    if [[ $DRY_RUN == true ]]; then
        echo -e "${YELLOW}[DRY RUN] Would create: $TERRAFORM_TFVARS${NC}"
    else
        cat > "$TERRAFORM_TFVARS" << EOF
# AI Flashcards - Terraform Variables
# Generated from $ENV_FILE on $(date)

# Project Configuration
project     = "$PROJECT"
environment = "$ENVIRONMENT"
aws_region  = "$AWS_REGION"

# Database Configuration
database_password = "$DATABASE_PASSWORD"
database_username = "${DATABASE_USERNAME:-flashcards_user}"
database_name     = "${DATABASE_NAME:-flashcards}"

# Infrastructure Configuration
vpc_cidr                = "${VPC_CIDR:-10.0.0.0/16}"
public_subnet_cidrs     = [$(echo "${PUBLIC_SUBNET_CIDRS:-10.0.1.0/24,10.0.2.0/24}" | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/'))]
private_subnet_cidrs    = [$(echo "${PRIVATE_SUBNET_CIDRS:-10.0.11.0/24,10.0.12.0/24}" | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/'))]

# ECS Configuration
container_port   = ${CONTAINER_PORT:-8080}
container_cpu    = ${CONTAINER_CPU:-256}
container_memory = ${CONTAINER_MEMORY:-512}
desired_count    = ${DESIRED_COUNT:-1}

# RDS Configuration
rds_engine_version    = "${RDS_ENGINE_VERSION:-15.13}"
rds_instance_class    = "${RDS_INSTANCE_CLASS:-db.t3.micro}"
rds_allocated_storage = ${RDS_ALLOCATED_STORAGE:-20}

# Authentication (Clerk)
clerk_secret_key     = "$CLERK_SECRET_KEY"
clerk_webhook_secret = "$CLERK_WEBHOOK_SECRET"

# AI Configuration (Gemini)
gemini_api_key = "$GEMINI_API_KEY"

# Payment (Stripe)
stripe_secret_key      = "$STRIPE_SECRET_KEY"
stripe_publishable_key = "$STRIPE_PUBLISHABLE_KEY"
stripe_webhook_secret  = "$STRIPE_WEBHOOK_SECRET"
EOF
        echo -e "${GREEN}  ✅ Created $TERRAFORM_TFVARS${NC}"
    fi
fi

# Parameter Storeターゲット
if [[ $TARGET_PARAMETER_STORE == true ]]; then
    echo ""
    echo -e "${BLUE}🔐 Deploying to AWS Parameter Store${NC}"
    
    # AWS CLIの確認
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    # AWS認証の確認
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        exit 1
    fi
    
    # Parameter Store用の変数定義
    PARAM_CONFIGS=(
        "CLERK_SECRET_KEY:SecureString"
        "CLERK_WEBHOOK_SECRET:SecureString"
        "DATABASE_PASSWORD:SecureString"
        "GEMINI_API_KEY:SecureString"
        "STRIPE_SECRET_KEY:SecureString"
        "STRIPE_PUBLISHABLE_KEY:String"
        "STRIPE_WEBHOOK_SECRET:SecureString"
    )
    
    for config in "${PARAM_CONFIGS[@]}"; do
        param_name=$(echo "$config" | cut -d: -f1)
        param_type=$(echo "$config" | cut -d: -f2)
        param_value="${!param_name}"
        full_name="/$PROJECT/$ENVIRONMENT/$param_name"
        
        if [[ $DRY_RUN == true ]]; then
            echo -e "${YELLOW}[DRY RUN] Would set: $full_name ($param_type)${NC}"
        else
            if aws ssm put-parameter \
                --name "$full_name" \
                --value "$param_value" \
                --type "$param_type" \
                --overwrite \
                --no-cli-pager &> /dev/null; then
                echo -e "${GREEN}  ✅ Set $full_name${NC}"
            else
                echo -e "${RED}  ❌ Failed to set $full_name${NC}"
            fi
        fi
    done
    
    # DATABASE_URLの生成と設定
    if [[ -n "$DATABASE_USERNAME" && -n "$DATABASE_PASSWORD" && -n "$DATABASE_NAME" ]]; then
        # RDSエンドポイントを取得（Terraformから）
        if [[ -f "terraform/terraform.tfstate" ]]; then
            RDS_ENDPOINT=$(cd terraform && terraform output -raw rds_endpoint 2>/dev/null || echo "")
            if [[ -n "$RDS_ENDPOINT" ]]; then
                DATABASE_URL="postgresql://$DATABASE_USERNAME:$DATABASE_PASSWORD@$RDS_ENDPOINT:5432/$DATABASE_NAME?sslmode=require"
                full_name="/$PROJECT/$ENVIRONMENT/DATABASE_URL"
                
                if [[ $DRY_RUN == true ]]; then
                    echo -e "${YELLOW}[DRY RUN] Would set: $full_name (SecureString)${NC}"
                else
                    if aws ssm put-parameter \
                        --name "$full_name" \
                        --value "$DATABASE_URL" \
                        --type "SecureString" \
                        --overwrite \
                        --no-cli-pager &> /dev/null; then
                        echo -e "${GREEN}  ✅ Set $full_name${NC}"
                    else
                        echo -e "${RED}  ❌ Failed to set $full_name${NC}"
                    fi
                fi
            else
                echo -e "${YELLOW}  ⚠️  RDS endpoint not found, skipping DATABASE_URL${NC}"
            fi
        else
            echo -e "${YELLOW}  ⚠️  Terraform state not found, skipping DATABASE_URL${NC}"
        fi
    fi
fi

echo ""
if [[ $DRY_RUN == true ]]; then
    echo -e "${YELLOW}🔍 Dry run completed${NC}"
else
    echo -e "${GREEN}🎉 Environment deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    if [[ $TARGET_TERRAFORM == true ]]; then
        echo "  cd terraform"
        echo "  terraform plan"
        echo "  terraform apply"
    fi
    if [[ $TARGET_PARAMETER_STORE == true ]]; then
        echo "  # Parameter Store is ready for ECS deployment"
    fi
fi
