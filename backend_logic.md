# バックエンドロジックの詳細設計

## 1. Gemini APIクライアントの初期化と設定

### 設定ファイル: `backend/config/ai_generate.go`

```go
// 設定項目
type AIGenerateConfig struct {
    APIKey      string  // Gemini APIキー
    MaxTokens   int     // 生成する最大トークン数
    Temperature float64 // 生成の多様性（0.0-1.0）
}
```

設定の役割：
- APIキーの管理（環境変数から取得）
- トークン制限の設定
- 生成パラメータの調整

## 2. リクエスト/レスポンス構造

### リクエスト: `AIGenerateRequest`
```go
type AIGenerateRequest struct {
    Prompt   string `json:"prompt"`    // 生成プロンプト
    DeckID   string `json:"deckId"`    // 対象デッキID
    MaxCards int    `json:"maxCards"`  // 生成カード数上限
}
```

バリデーション：
- プロンプトは必須、最大長さ制限あり
- デッキIDは有効なUUID形式
- カード数は1-100の範囲

### レスポンス: `AIGenerateResponse`
```go
type AIGenerateResponse struct {
    Cards []Card `json:"cards"`
}

type Card struct {
    Front string `json:"front"` // カード表面
    Back  string `json:"back"`  // カード裏面
}
```

## 3. コントローラーの実装

### `backend/controllers/ai_generate_controller.go`

主要な処理ステップ：

1. プロンプトの前処理
```go
// プロンプトテンプレートの構築
template := `
以下の指示に基づいてフラッシュカードを%d枚生成してください：
%s

各カードは以下のJSON形式で返してください：
{
  "front": "カードの表面（質問や単語）",
  "back": "カードの裏面（解答や説明）"
}
`
```

2. Gemini APIへのリクエスト処理
```go
func (c *AIController) GenerateCards(ctx context.Context, req *AIGenerateRequest) (*AIGenerateResponse, error) {
    // 1. プロンプト構築
    prompt := fmt.Sprintf(template, req.MaxCards, req.Prompt)

    // 2. Gemini APIコール
    response, err := c.geminiClient.GenerateContent(ctx, prompt)
    if err != nil {
        return nil, fmt.Errorf("AI生成エラー: %w", err)
    }

    // 3. レスポンスのパース
    var cards []Card
    if err := json.Unmarshal([]byte(response.Text), &cards); err != nil {
        return nil, fmt.Errorf("レスポンスパースエラー: %w", err)
    }

    return &AIGenerateResponse{Cards: cards}, nil
}
```

3. バリデーションと後処理
```go
// カードコンテンツの検証
func validateCard(card *Card) error {
    if len(card.Front) < 1 || len(card.Back) < 1 {
        return errors.New("カードの表面または裏面が空です")
    }
    if len(card.Front) > 1000 || len(card.Back) > 1000 {
        return errors.New("カードの内容が長すぎます")
    }
    return nil
}
```

## 4. ハンドラーの実装

### `backend/handlers/ai_generate.go`

HTTPリクエストの処理：

```go
func (h *Handler) AIGenerate(c *gin.Context) {
    // 1. リクエストのバリデーション
    var req AIGenerateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "無効なリクエスト"})
        return
    }

    // 2. コントローラー呼び出し
    resp, err := h.controller.GenerateCards(c.Request.Context(), &req)
    if err != nil {
        // エラーハンドリング（タイプ別）
        switch {
        case errors.Is(err, ErrInvalidPrompt):
            c.JSON(http.StatusBadRequest, gin.H{"error": "無効なプロンプト"})
        case errors.Is(err, ErrAIGeneration):
            c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI生成エラー"})
        default:
            c.JSON(http.StatusInternalServerError, gin.H{"error": "内部サーバーエラー"})
        }
        return
    }

    // 3. 生成されたカードの保存
    if err := h.saveCards(c.Request.Context(), req.DeckID, resp.Cards); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "カード保存エラー"})
        return
    }

    // 4. 成功レスポンス
    c.JSON(http.StatusOK, resp)
}
```

## 5. エラーハンドリング

主要なエラーケース：

1. 入力検証エラー
- プロンプトが空または長すぎる
- 無効なデッキID
- カード数が範囲外

2. API関連エラー
- レート制限超過
- API接続エラー
- 不正なレスポンス形式

3. データベースエラー
- カード保存失敗
- トランザクションエラー

## 6. 性能最適化

1. タイムアウト設定
```go
// コンテキストにタイムアウトを設定
ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
defer cancel()
```

2. 同時リクエスト制限
```go
var (
    maxConcurrent = 5
    requestSem    = make(chan struct{}, maxConcurrent)
)
```

3. キャッシュ戦略
- 類似プロンプトの結果をキャッシュ
- 一時的なレスポンス保存

## 7. セキュリティ対策

1. 入力サニタイズ
```go
func sanitizePrompt(prompt string) string {
    // 危険な文字や命令を除去
    return sanitizer.Sanitize(prompt)
}
```

2. レート制限
```go
func (h *Handler) rateLimit(c *gin.Context) error {
    key := c.ClientIP()
    return h.limiter.Allow(key)
}
```

3. 認証・認可
- JWTトークンの検証
- ユーザー権限の確認
