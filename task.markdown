# AI Flashcard Generator - Implementation Design

## Overview
Gemini APIを使用して、ユーザーのプロンプトから自動的にフラッシュカードを生成する機能の実装設計書です。

## System Architecture

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backen現在バックエンドではクリーンアーキテクチャを採用していません コントローラーとハンドラーのみになっていますd
    participant GeminiAPI
    participant Database

    User->>Frontend: プロンプト入力
    Frontend->>Backend: プロンプト送信
    Backend->>GeminiAPI: プロンプト処理要求
    GeminiAPI-->>Backend: 生成されたカード内容
    Backend->>Database: カードの保存
    Backend-->>Frontend: 生成完了通知
    Frontend-->>User: 生成されたカードを表示
```

## Backend Implementation

### 1. Gemini API Integration
- **Handler**: `backend/handlers/ai_generate.go`
```go
type AIHandler struct {
    db          *gorm.DB
    geminiClient *ai.Client
}

func (h *AIHandler) GenerateCards(c *gin.Context) {
    // カード生成処理の実装
}
```

- **Controller**: `backend/controllers/ai_generate_controller.go`
```go
type AIController struct {
    db          *gorm.DB
    geminiClient *ai.Client
}

func (c *AIController) GenerateCards(prompt string, deckID string) ([]models.Card, error) {
    // Gemini APIを使用したカード生成ロジック
}
```

### 2. API Endpoints and Request/Response
```go
// リクエスト
type GenerateCardsRequest struct {
    Prompt   string `json:"prompt" binding:"required"`
    DeckID   string `json:"deckId" binding:"required"`
    MaxCards int    `json:"maxCards" binding:"required,min=1,max=100"`
}

// レスポンス
type GenerateCardsResponse struct {
    Cards []models.Card `json:"cards"`
}

// エンドポイント
POST /api/v1/cards/ai_generate
```

### 3. Gemini API Client Configuration
```go
// backend/config/ai_generate.go
type AIGenerateConfig struct {
    APIKey      string
    MaxTokens   int
    Temperature float64
}

func NewAIGenerateClient(config AIGenerateConfig) *ai.Client {
    // Gemini APIクライアントの初期化
}
```

## Frontend Implementation

### 1. Components
- **Generate Cards Form**: `frontend/app/(app)/cards/create/ai/AIGenerateCardsForm.tsx`
```typescript
interface AIGenerateCardsFormProps {
    deckId: string;
    onSuccess: () => void;
}
```

- **Loading Component**: `frontend/app/components/ui/loading.tsx`
```typescript
interface LoadingProps {
    message?: string;
    progress?: number;
}
```

### 2. State Management
- **Generate Cards Mutation**:
```typescript
const useAIGenerateCards = () => {
    return useMutation({
        mutationFn: (params: GenerateCardsParams) => 
            generateCardsFromPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries(['deck', params.deckId])
        }
    })
}
```

### 3. API Client
- **Card Generation Client**: `frontend/app/actions/CardActions.ts`
```typescript
export const aiGenerateCardsFromPrompt = async ({
    prompt,
    deckId,
    maxCards,
    language
}: GenerateCardsParams): Promise<Card[]> => {
    // Implementation
}
```

## Error Handling

### 1. Backend Errors
- API制限エラー
- プロンプト検証エラー
- カード生成失敗
- データベース保存エラー

### 2. Frontend Errors
- ネットワークエラー
- バリデーションエラー
- タイムアウトエラー

## Security Considerations

1. **Rate Limiting**
   - ユーザーごとのAPI制限
   - リクエスト数の制限

2. **Input Validation**
   - プロンプトの長さ制限
   - 不適切なコンテンツのフィルタリング

3. **Error Logging**
   - エラーの詳細なログ記録
   - 監視システムとの統合

## Testing Strategy

1. **Unit Tests**
   - Gemini APIクライアントのモック
   - カード生成ロジックのテスト
   - バリデーションのテスト

2. **Integration Tests**
   - APIエンドポイントのテスト
   - データベース操作のテスト

3. **E2E Tests**
   - カード生成フローのテスト
   - エラーハンドリングのテスト

## Next Steps

1. バックエンド実装
   - [ ] Gemini APIクライアントの実装
   - [ ] カード生成エンドポイントの実装
   - [ ] エラーハンドリングの実装

2. フロントエンド実装
   - [ ] カード生成フォームの実装
   - [ ] ローディング状態の実装
   - [ ] エラー表示の実装

3. テストの実装
   - [ ] ユニットテストの作成
   - [ ] 統合テストの作成
   - [ ] E2Eテストの作成
