#!/bin/bash

# AI Flashcards - Parameter Store Setup Script
# このスクリプトは環境変数をAWS Parameter Storeに設定します

set -e

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプ表示
show_help() {
    echo "AI Flashcards Parameter Store Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -e, --environment ENV   Environment (default: production)"
    echo "  -i, --interactive       Interactive mode (prompt for each value)"
    echo "  -f, --file FILE         Load values from file"
    echo "  --dry-run              Show what would be done without executing"
    echo ""
    echo "Examples:"
    echo "  $0 --interactive"
    echo "  $0 --file .env"
    echo "  $0 --environment staging"
    echo ""
}

# デフォルト値
ENVIRONMENT="production"
INTERACTIVE=false
DRY_RUN=false
ENV_FILE=""

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -f|--file)
            ENV_FILE="$2"
            shift 2
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

echo -e "${BLUE}🚀 AI Flashcards Parameter Store Setup${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

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

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# パラメータ定義（配列形式）
PARAM_NAMES=(
    "CLERK_SECRET_KEY"
    "CLERK_WEBHOOK_SECRET"
    "DATABASE_PASSWORD"
    "GEMINI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

PARAM_TYPES=(
    "SecureString"
    "SecureString"
    "SecureString"
    "SecureString"
    "SecureString"
    "String"
    "SecureString"
)

# パラメータのタイプを取得する関数
get_param_type() {
    local param_name="$1"
    for i in "${!PARAM_NAMES[@]}"; do
        if [[ "${PARAM_NAMES[$i]}" == "$param_name" ]]; then
            echo "${PARAM_TYPES[$i]}"
            return
        fi
    done
    echo "SecureString"  # デフォルト
}

# ファイルから値を読み込む関数
load_from_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}❌ File not found: $ENV_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📁 Loading values from $ENV_FILE${NC}"
    
    while IFS='=' read -r key value; do
        # コメント行と空行をスキップ
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # クォートを削除
        value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
        
        # パラメータが定義されているかチェック
        for param in "${PARAM_NAMES[@]}"; do
            if [[ "$param" == "$key" ]]; then
                eval "${key}='${value}'"
                echo -e "${GREEN}  ✅ $key${NC}"
                break
            fi
        done
    done < "$ENV_FILE"
}

# インタラクティブモードで値を入力する関数
interactive_input() {
    echo -e "${YELLOW}🔧 Interactive mode: Please enter values for each parameter${NC}"
    echo ""
    
    for param in "${PARAM_NAMES[@]}"; do
        echo -e "${BLUE}Enter value for $param:${NC}"
        param_type=$(get_param_type "$param")
        if [[ "$param_type" == "SecureString" ]]; then
            read -s value
            echo ""
        else
            read value
        fi
        eval "${param}='${value}'"
    done
}

# 環境変数から値を読み込む関数
load_from_env() {
    echo -e "${YELLOW}🔍 Loading values from environment variables${NC}"
    
    for param in "${PARAM_NAMES[@]}"; do
        if [[ -n "${!param}" ]]; then
            echo -e "${GREEN}  ✅ $param${NC}"
        fi
    done
}

# パラメータをParameter Storeに設定する関数
set_parameter() {
    local param_name="$1"
    local param_value="$2"
    local param_type="$3"
    local full_name="/ai-flashcards/${ENVIRONMENT}/${param_name}"
    
    if [[ $DRY_RUN == true ]]; then
        echo -e "${YELLOW}[DRY RUN] Would set: $full_name${NC}"
        return
    fi
    
    if aws ssm put-parameter \
        --name "$full_name" \
        --value "$param_value" \
        --type "$param_type" \
        --overwrite \
        --no-cli-pager &> /dev/null; then
        echo -e "${GREEN}  ✅ Set $full_name${NC}"
    else
        echo -e "${RED}  ❌ Failed to set $full_name${NC}"
        return 1
    fi
}

# メイン処理
main() {
    # 値の読み込み
    if [[ -n "$ENV_FILE" ]]; then
        load_from_file
    elif [[ $INTERACTIVE == true ]]; then
        interactive_input
    else
        load_from_env
    fi
    
    # 不足している値をチェック
    missing_params=()
    for param in "${PARAM_NAMES[@]}"; do
        if [[ -z "${!param}" ]]; then
            missing_params+=("$param")
        fi
    done
    
    if [[ ${#missing_params[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing values for the following parameters:${NC}"
        for param in "${missing_params[@]}"; do
            echo -e "${RED}  - $param${NC}"
        done
        echo ""
        echo -e "${YELLOW}Please provide values using one of these methods:${NC}"
        echo "  1. Interactive mode: $0 --interactive"
        echo "  2. Environment variables: export CLERK_SECRET_KEY=..."
        echo "  3. File: $0 --file .env"
        exit 1
    fi
    
    # Parameter Storeに設定
    echo ""
    echo -e "${BLUE}📝 Setting parameters in Parameter Store...${NC}"
    
    for param in "${PARAM_NAMES[@]}"; do
        param_type=$(get_param_type "$param")
        param_value="${!param}"
        set_parameter "$param" "$param_value" "$param_type"
    done
    
    echo ""
    if [[ $DRY_RUN == true ]]; then
        echo -e "${YELLOW}🔍 Dry run completed${NC}"
    else
        echo -e "${GREEN}🎉 All parameters set successfully!${NC}"
        echo ""
        echo -e "${BLUE}You can now run:${NC}"
        echo "  cd terraform"
        echo "  terraform plan"
        echo "  terraform apply"
    fi
}

# スクリプト実行
main
