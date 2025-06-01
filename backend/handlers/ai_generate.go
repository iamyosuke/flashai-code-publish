package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
	"gorm.io/gorm"

	"github.com/muratayousuke/ai-flashcards/models"
)

type AIGenerateHandler struct {
	db           *gorm.DB
	geminiClient *genai.Client
}

type AIGenerateRequest struct {
	Prompt   string `json:"prompt" binding:"required"`
	DeckID   string `json:"deckId"`
	MaxCards int    `json:"maxCards" binding:"required,min=1,max=100"`
}

type AIGenerateResponse struct {
	Cards []models.Card `json:"cards"`
	Deck  *models.Deck  `json:"deck,omitempty"`
}

type GeneratedCard struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}

type GeneratedDeckInfo struct {
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Cards       []GeneratedCard `json:"cards"`
}

type AIGenerateConfig struct {
	APIKey      string
	MaxTokens   int
	Temperature float64
}

type PreviewResponse struct {
	SessionID       string               `json:"sessionId"`
	DeckTitle       string               `json:"deckTitle"`
	DeckDescription string               `json:"deckDescription"`
	Cards           []models.CardPreview `json:"cards"`
	ExpiresAt       time.Time            `json:"expiresAt"`
}

type ConfirmPreviewRequest struct {
	SessionID string `json:"sessionId" binding:"required"`
	DeckID    string `json:"deckId"`
}

type RegenerateRequest struct {
	SessionID string `json:"sessionId" binding:"required"`
	Feedback  string `json:"feedback" binding:"required"`
}

// 固定プロンプトテンプレート
const (
	TextAnalysisPrompt = `以下のトピックについて、教育的価値の高いフラッシュカードを%d枚生成し、適切なデッキ名と説明も作成してください：

トピック: %s

以下のJSON形式で返してください：
{
  "title": "デッキのタイトル（簡潔で分かりやすく）",
  "description": "デッキの説明（学習内容を具体的に説明）",
  "cards": [
    {
      "front": "質問や学習ポイント",
      "back": "詳細な説明や答え"
    }
  ]
}

重要：JSON形式のみを返し、他の説明は含めないでください。`

	ImageAnalysisPrompt = `この画像を詳細に分析し、教育的価値の高いフラッシュカードを%d枚生成し、適切なデッキ名と説明も作成してください。

画像に含まれる以下の要素を考慮してください：
- テキスト（OCR）
- オブジェクト・人物
- 場所・環境
- 概念・アイデア
- 歴史的・文化的背景

以下のJSON形式で返してください：
{
  "title": "デッキのタイトル（画像の内容に基づいて）",
  "description": "デッキの説明（画像から学べる内容を説明）",
  "cards": [
    {
      "front": "質問や学習ポイント",
      "back": "詳細な説明や答え"
    }
  ]
}

重要：JSON形式のみを返し、他の説明は含めないでください。`

	AudioAnalysisPrompt = `この音声を分析し、内容に基づいて教育的価値の高いフラッシュカードを%d枚生成し、適切なデッキ名と説明も作成してください。

音声から以下の要素を抽出してカード化してください：
- 重要な概念・用語
- 主要なポイント
- 具体例
- 関連する背景知識

以下のJSON形式で返してください：
{
  "title": "デッキのタイトル（音声の内容に基づいて）",
  "description": "デッキの説明（音声から学べる内容を説明）",
  "cards": [
    {
      "front": "質問や学習ポイント",
      "back": "詳細な説明や答え"
    }
  ]
}

重要：JSON形式のみを返し、他の説明は含めないでください。`

	MaxImageSize = 20 * 1024 * 1024 // 20MB
	MaxAudioSize = 50 * 1024 * 1024 // 50MB
)

var (
	AllowedImageTypes = []string{"image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"}
	AllowedAudioTypes = []string{"audio/wav", "audio/mp3", "audio/aiff", "audio/aac", "audio/ogg", "audio/flac"}
)

func getDefaultConfig() AIGenerateConfig {
	return AIGenerateConfig{
		APIKey:      os.Getenv("GEMINI_API_KEY"),
		MaxTokens:   3000,
		Temperature: 0.7,
	}
}

func newAIGenerateClient(config AIGenerateConfig) (*genai.Client, error) {
	client, err := genai.NewClient(context.Background(), option.WithAPIKey(config.APIKey))
	if err != nil {
		return nil, err
	}
	return client, nil
}

func NewAIGenerateHandler(db *gorm.DB) (*AIGenerateHandler, error) {
	// Gemini APIクライアントの初期化
	geminiConfig := getDefaultConfig()
	client, err := newAIGenerateClient(geminiConfig)
	if err != nil {
		return nil, err
	}

	return &AIGenerateHandler{
		db:           db,
		geminiClient: client,
	}, nil
}

// 統合されたカード生成エンドポイント
func (h *AIGenerateHandler) GenerateCards(c *gin.Context) {
	// タイムアウト付きコンテキストの作成
	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	// 入力タイプの判定
	inputType := h.determineInputType(c)

	var resp *AIGenerateResponse
	var err error

	switch inputType {
	case "text":
		resp, err = h.handleTextInput(ctx, c)
	case "image":
		resp, err = h.handleImageInput(ctx, c)
	case "audio":
		resp, err = h.handleAudioInput(ctx, c)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "テキスト、画像、または音声のいずれかを入力してください",
		})
		return
	}

	if err != nil {
		h.handleError(c, ctx, err)
		return
	}

	// 成功レスポンス
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resp,
	})
}

// 入力タイプの判定
func (h *AIGenerateHandler) determineInputType(c *gin.Context) string {
	// 画像ファイルの確認
	if _, _, err := c.Request.FormFile("image"); err == nil {
		return "image"
	}

	// 音声ファイルの確認
	if _, _, err := c.Request.FormFile("audio"); err == nil {
		return "audio"
	}

	// デフォルトはテキスト
	return "text"
}

// テキスト入力の処理
func (h *AIGenerateHandler) handleTextInput(ctx context.Context, c *gin.Context) (*AIGenerateResponse, error) {
	// フォームデータからの取得
	prompt := c.PostForm("prompt")
	if prompt == "" {
		return nil, fmt.Errorf("プロンプトを入力してください")
	}

	deckOption := c.PostForm("deckOption")
	deckID := c.PostForm("deckId")

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	// 新規作成の場合
	if deckOption == "new" || deckID == "" {
		return h.generateNewDeckWithCards(ctx, c, prompt, maxCards, "text", nil, "")
	}

	// 既存デッキに追加の場合
	req := AIGenerateRequest{
		Prompt:   prompt,
		DeckID:   deckID,
		MaxCards: maxCards,
	}

	return h.generateCards(ctx, &req, "text")
}

// 画像入力の処理
func (h *AIGenerateHandler) handleImageInput(ctx context.Context, c *gin.Context) (*AIGenerateResponse, error) {
	// ファイルの取得
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		return nil, fmt.Errorf("画像ファイルの取得に失敗: %w", err)
	}
	defer file.Close()

	// ファイル検証
	if err := h.validateImageFile(header); err != nil {
		return nil, err
	}

	// ファイルデータ読み込み
	fileData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("ファイル読み込みエラー: %w", err)
	}

	// パラメータ取得
	deckOption := c.PostForm("deckOption")
	deckID := c.PostForm("deckId")

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	// 新規作成の場合
	if deckOption == "new" || deckID == "" {
		return h.generateNewDeckWithCards(ctx, c, "", maxCards, "image", fileData, header.Header.Get("Content-Type"))
	}

	// 既存デッキに追加の場合
	return h.generateCardsFromInlineData(ctx, fileData, header.Header.Get("Content-Type"), deckID, maxCards, "image")
}

// 音声入力の処理
func (h *AIGenerateHandler) handleAudioInput(ctx context.Context, c *gin.Context) (*AIGenerateResponse, error) {
	// ファイルの取得
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		return nil, fmt.Errorf("音声ファイルの取得に失敗: %w", err)
	}
	defer file.Close()

	// ファイル検証
	if err := h.validateAudioFile(header); err != nil {
		return nil, err
	}

	// ファイルデータ読み込み
	fileData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("ファイル読み込みエラー: %w", err)
	}

	// パラメータ取得
	deckOption := c.PostForm("deckOption")
	deckID := c.PostForm("deckId")

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	// 新規作成の場合
	if deckOption == "new" || deckID == "" {
		return h.generateNewDeckWithCards(ctx, c, "", maxCards, "audio", fileData, header.Header.Get("Content-Type"))
	}

	// 既存デッキに追加の場合
	return h.generateCardsFromInlineData(ctx, fileData, header.Header.Get("Content-Type"), deckID, maxCards, "audio")
}

// 新規デッキとカードを同時生成
func (h *AIGenerateHandler) generateNewDeckWithCards(ctx context.Context, c *gin.Context, prompt string, maxCards int, generationType string, fileData []byte, mimeType string) (*AIGenerateResponse, error) {
	// プロンプト選択
	var promptTemplate string
	switch generationType {
	case "text":
		promptTemplate = fmt.Sprintf(TextAnalysisPrompt, maxCards, prompt)
	case "image":
		promptTemplate = fmt.Sprintf(ImageAnalysisPrompt, maxCards)
	case "audio":
		promptTemplate = fmt.Sprintf(AudioAnalysisPrompt, maxCards)
	default:
		return nil, fmt.Errorf("サポートされていない生成タイプ: %s", generationType)
	}

	// Gemini APIモデルの取得
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.7)
	model.SetMaxOutputTokens(3000)

	var resp *genai.GenerateContentResponse
	var err error

	// コンテンツ生成
	if generationType == "text" {
		resp, err = model.GenerateContent(ctx, genai.Text(promptTemplate))
	} else {
		// メディアファイルの場合
		parts := []genai.Part{
			genai.Text(promptTemplate),
			genai.Blob{
				MIMEType: mimeType,
				Data:     fileData,
			},
		}
		resp, err = model.GenerateContent(ctx, parts...)
	}

	if err != nil {
		return nil, fmt.Errorf("AI生成エラー: %w", err)
	}

	// レスポンス処理
	return h.processNewDeckResponse(c, resp, generationType)
}

// 新規デッキレスポンスの処理
func (h *AIGenerateHandler) processNewDeckResponse(c *gin.Context, resp *genai.GenerateContentResponse, generationType string) (*AIGenerateResponse, error) {
	ctx := c.Request.Context()
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("AIからの応答が空です")
	}

	// レスポンステキストの取得
	responseText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			responseText += string(textPart)
		}
	}

	// JSONの抽出
	responseText = h.extractJSON(responseText)

	// JSONのパース
	var deckInfo GeneratedDeckInfo
	if err := json.Unmarshal([]byte(responseText), &deckInfo); err != nil {
		return nil, fmt.Errorf("レスポンスパースエラー: %w, レスポンス: %s", err, responseText)
	}

	// ユーザーIDの取得
	userID, exists := c.Get("userID")
	if !exists {
		return nil, fmt.Errorf("ユーザー認証情報が見つかりません")
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return nil, fmt.Errorf("無効なユーザーID形式")
	}

	// ユーザーIDをuintに変換（ClerkのユーザーIDは文字列なので、ユーザーテーブルから取得する必要がある）
	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userIDStr).First(&user).Error; err != nil {
		return nil, fmt.Errorf("ユーザーが見つかりません: %w", err)
	}

	// デッキの作成
	deck := models.Deck{
		UserID:      user.ID,
		Title:       deckInfo.Title,
		Description: deckInfo.Description,
	}

	if err := h.db.WithContext(ctx).Create(&deck).Error; err != nil {
		return nil, fmt.Errorf("デッキ作成エラー: %w", err)
	}

	// カードの検証と変換
	var cards []models.Card
	for _, genCard := range deckInfo.Cards {
		if err := h.validateCard(&genCard); err != nil {
			continue // 無効なカードはスキップ
		}

		card := models.Card{
			DeckID:         deck.ID,
			Front:          genCard.Front,
			Back:           genCard.Back,
			GenerationType: generationType,
		}
		cards = append(cards, card)
	}

	if len(cards) == 0 {
		return nil, fmt.Errorf("有効なカードが生成されませんでした")
	}

	// カードの保存
	if err := h.saveCards(ctx, cards); err != nil {
		return nil, fmt.Errorf("カード保存エラー: %w", err)
	}

	return &AIGenerateResponse{
		Cards: cards,
		Deck:  &deck,
	}, nil
}

func (h *AIGenerateHandler) generateCards(ctx context.Context, req *AIGenerateRequest, generationType string) (*AIGenerateResponse, error) {
	// DeckIDをuintに変換
	deckID, err := strconv.ParseUint(req.DeckID, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("無効なデッキID: %w", err)
	}

	// プロンプトテンプレートの構築
	prompt := fmt.Sprintf(`
以下の指示に基づいてフラッシュカードを%d枚生成してください：
%s

各カードは以下のJSON配列形式で返してください：
[
  {
    "front": "カードの表面（質問や単語）",
    "back": "カードの裏面（解答や説明）"
  }
]

重要な注意事項：
- 必ずJSON配列形式で返してください
- 他の説明文は含めないでください
- frontとbackは必須フィールドです
- 各カードの内容は簡潔で分かりやすくしてください
`, req.MaxCards, req.Prompt)

	// Gemini APIモデルの取得
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.7)
	model.SetMaxOutputTokens(2000)

	// コンテンツ生成
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("AI生成エラー: %w", err)
	}

	// レスポンス処理
	cards, err := h.processGeminiResponse(ctx, resp, uint(deckID), generationType)
	if err != nil {
		return nil, err
	}

	return &AIGenerateResponse{Cards: cards}, nil
}

func (h *AIGenerateHandler) generateCardsFromInlineData(ctx context.Context, fileData []byte, mimeType, deckID string, maxCards int, generationType string) (*AIGenerateResponse, error) {
	// DeckIDをuintに変換
	deckIDUint, err := strconv.ParseUint(deckID, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("無効なデッキID: %w", err)
	}

	// プロンプト選択
	var promptTemplate string
	switch generationType {
	case "image":
		promptTemplate = ImageAnalysisPrompt
	case "audio":
		promptTemplate = AudioAnalysisPrompt
	default:
		return nil, fmt.Errorf("サポートされていない生成タイプ: %s", generationType)
	}

	prompt := fmt.Sprintf(promptTemplate, maxCards)

	// Gemini APIモデルの取得
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.7)
	model.SetMaxOutputTokens(2000)

	// コンテンツ生成（インラインデータ）
	parts := []genai.Part{
		genai.Text(prompt),
		genai.Blob{
			MIMEType: mimeType,
			Data:     fileData,
		},
	}

	resp, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		return nil, fmt.Errorf("AI生成エラー: %w", err)
	}

	// レスポンス処理
	cards, err := h.processGeminiResponse(ctx, resp, uint(deckIDUint), generationType)
	if err != nil {
		return nil, err
	}

	return &AIGenerateResponse{Cards: cards}, nil
}

func (h *AIGenerateHandler) processGeminiResponse(ctx context.Context, resp *genai.GenerateContentResponse, deckID uint, generationType string) ([]models.Card, error) {
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("AIからの応答が空です")
	}

	// レスポンステキストの取得
	responseText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			responseText += string(textPart)
		}
	}

	// JSONの抽出
	responseText = h.extractJSON(responseText)

	// JSONのパース
	var generatedCards []GeneratedCard
	if err := json.Unmarshal([]byte(responseText), &generatedCards); err != nil {
		return nil, fmt.Errorf("レスポンスパースエラー: %w, レスポンス: %s", err, responseText)
	}

	// カードの検証と変換
	var cards []models.Card
	for _, genCard := range generatedCards {
		if err := h.validateCard(&genCard); err != nil {
			continue // 無効なカードはスキップ
		}

		card := models.Card{
			DeckID:         deckID,
			Front:          genCard.Front,
			Back:           genCard.Back,
			GenerationType: generationType,
		}
		cards = append(cards, card)
	}

	if len(cards) == 0 {
		return nil, fmt.Errorf("有効なカードが生成されませんでした")
	}

	// データベースに保存
	if err := h.saveCards(ctx, cards); err != nil {
		return nil, fmt.Errorf("カード保存エラー: %w", err)
	}

	return cards, nil
}

func (h *AIGenerateHandler) extractJSON(responseText string) string {
	responseText = strings.TrimSpace(responseText)
	if strings.Contains(responseText, "```json") {
		start := strings.Index(responseText, "```json") + 7
		end := strings.LastIndex(responseText, "```")
		if start < end {
			responseText = responseText[start:end]
		}
	} else if strings.Contains(responseText, "```") {
		start := strings.Index(responseText, "```") + 3
		end := strings.LastIndex(responseText, "```")
		if start < end {
			responseText = responseText[start:end]
		}
	}
	return strings.TrimSpace(responseText)
}

func (h *AIGenerateHandler) validateImageFile(header *multipart.FileHeader) error {
	// ファイルサイズチェック
	if header.Size > MaxImageSize {
		return fmt.Errorf("ファイルサイズが大きすぎます（最大20MB）")
	}

	// MIMEタイプチェック
	contentType := header.Header.Get("Content-Type")
	for _, allowed := range AllowedImageTypes {
		if contentType == allowed {
			return nil
		}
	}

	return fmt.Errorf("サポートされていないファイル形式: %s", contentType)
}

func (h *AIGenerateHandler) validateAudioFile(header *multipart.FileHeader) error {
	// ファイルサイズチェック
	if header.Size > MaxAudioSize {
		return fmt.Errorf("ファイルサイズが大きすぎます（最大50MB）")
	}

	// MIMEタイプチェック
	contentType := header.Header.Get("Content-Type")
	for _, allowed := range AllowedAudioTypes {
		if contentType == allowed {
			return nil
		}
	}

	return fmt.Errorf("サポートされていないファイル形式: %s", contentType)
}

func (h *AIGenerateHandler) validateCard(card *GeneratedCard) error {
	if len(strings.TrimSpace(card.Front)) < 1 {
		return fmt.Errorf("カードの表面が空です")
	}
	if len(strings.TrimSpace(card.Back)) < 1 {
		return fmt.Errorf("カードの裏面が空です")
	}
	if len(card.Front) > 1000 {
		return fmt.Errorf("カードの表面が長すぎます")
	}
	if len(card.Back) > 1000 {
		return fmt.Errorf("カードの裏面が長すぎます")
	}
	return nil
}

func (h *AIGenerateHandler) saveCards(ctx context.Context, cards []models.Card) error {
	return h.db.WithContext(ctx).Create(&cards).Error
}

func (h *AIGenerateHandler) handleError(c *gin.Context, ctx context.Context, err error) {
	switch {
	case ctx.Err() == context.DeadlineExceeded:
		c.JSON(http.StatusRequestTimeout, gin.H{
			"error":   "Request timeout",
			"message": "AI generation took too long",
		})
	case strings.Contains(err.Error(), "無効なデッキID"):
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid deck ID",
			"message": err.Error(),
		})
	case strings.Contains(err.Error(), "有効なカードが生成されませんでした"):
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":   "No valid cards generated",
			"message": err.Error(),
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal server error",
			"message": err.Error(),
		})
	}
}

// プレビュー生成エンドポイント
func (h *AIGenerateHandler) GeneratePreview(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	// 入力タイプの判定
	inputType := h.determineInputType(c)

	var previewResp *PreviewResponse
	var err error

	switch inputType {
	case "text":
		previewResp, err = h.handleTextPreview(ctx, c)
	case "image":
		previewResp, err = h.handleImagePreview(ctx, c)
	case "audio":
		previewResp, err = h.handleAudioPreview(ctx, c)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "テキスト、画像、または音声のいずれかを入力してください",
		})
		return
	}

	if err != nil {
		h.handleError(c, ctx, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    previewResp,
	})
}

// プレビュー確定エンドポイント
func (h *AIGenerateHandler) ConfirmPreview(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var req ConfirmPreviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// ユーザーIDの取得
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "ユーザー認証情報が見つかりません",
		})
		return
	}

	userID, ok := userIDStr.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "無効なユーザーID形式",
		})
		return
	}

	// ユーザー情報の取得
	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "ユーザーが見つかりません",
		})
		return
	}

	// プレビューカードの取得
	var previewCards []models.CardPreview
	if err := h.db.WithContext(ctx).Where("session_id = ? AND user_id = ? AND expires_at > ?",
		req.SessionID, user.ID, time.Now()).Find(&previewCards).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Preview not found",
			"message": "プレビューセッションが見つからないか期限切れです",
		})
		return
	}

	if len(previewCards) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Preview not found",
			"message": "プレビューカードが見つかりません",
		})
		return
	}

	// デッキの作成または取得
	var deck models.Deck
	if req.DeckID != "" {
		// 既存デッキに追加
		deckID, err := strconv.ParseUint(req.DeckID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid deck ID",
				"message": "無効なデッキIDです",
			})
			return
		}

		if err := h.db.WithContext(ctx).Where("id = ? AND user_id = ?", deckID, user.ID).First(&deck).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Deck not found",
				"message": "デッキが見つかりません",
			})
			return
		}
	} else {
		// 新規デッキ作成
		deck = models.Deck{
			UserID:      user.ID,
			Title:       previewCards[0].DeckTitle,
			Description: previewCards[0].DeckDescription,
		}

		if err := h.db.WithContext(ctx).Create(&deck).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to create deck",
				"message": "デッキ作成に失敗しました",
			})
			return
		}
	}

	// プレビューカードを正式なカードに変換
	var cards []models.Card
	for _, previewCard := range previewCards {
		card := models.Card{
			DeckID:         deck.ID,
			Front:          previewCard.Front,
			Back:           previewCard.Back,
			GenerationType: previewCard.GenerationType,
		}
		cards = append(cards, card)
	}

	// カードの保存
	if err := h.db.WithContext(ctx).Create(&cards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save cards",
			"message": "カードの保存に失敗しました",
		})
		return
	}

	// プレビューカードの削除
	if err := h.db.WithContext(ctx).Where("session_id = ?", req.SessionID).Delete(&models.CardPreview{}).Error; err != nil {
		// ログだけ出力、エラーにはしない
		fmt.Printf("Warning: Failed to delete preview cards: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"deck":  deck,
			"cards": cards,
		},
	})
}

// フィードバック付き再生成エンドポイント
func (h *AIGenerateHandler) RegenerateWithFeedback(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	var req RegenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// ユーザーIDの取得
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "ユーザー認証情報が見つかりません",
		})
		return
	}

	userID, ok := userIDStr.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "無効なユーザーID形式",
		})
		return
	}

	// ユーザー情報の取得
	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "ユーザーが見つかりません",
		})
		return
	}

	// 既存プレビューカードの取得
	var existingPreview []models.CardPreview
	if err := h.db.WithContext(ctx).Where("session_id = ? AND user_id = ? AND expires_at > ?",
		req.SessionID, user.ID, time.Now()).Find(&existingPreview).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Preview not found",
			"message": "プレビューセッションが見つからないか期限切れです",
		})
		return
	}

	if len(existingPreview) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Preview not found",
			"message": "プレビューカードが見つかりません",
		})
		return
	}

	// フィードバック付きプロンプトの作成
	originalPrompt := existingPreview[0].OriginalPrompt
	generationType := existingPreview[0].GenerationType

	var promptTemplate string
	switch generationType {
	case "text":
		promptTemplate = fmt.Sprintf(`以下のトピックについて、フィードバックを反映して教育的価値の高いフラッシュカードを%d枚生成し、適切なデッキ名と説明も作成してください：

トピック: %s

ユーザーフィードバック: %s

以下のJSON形式で返してください：
{
  "title": "デッキのタイトル（フィードバックを反映して改善）",
  "description": "デッキの説明（フィードバックを反映して改善）",
  "cards": [
    {
      "front": "質問や学習ポイント",
      "back": "詳細な説明や答え"
    }
  ]
}

重要：JSON形式のみを返し、他の説明は含めないでください。`, len(existingPreview), originalPrompt, req.Feedback)
	case "image", "audio":
		promptTemplate = fmt.Sprintf(`前回の生成結果に対するフィードバックを反映して、教育的価値の高いフラッシュカードを%d枚再生成し、適切なデッキ名と説明も作成してください。

ユーザーフィードバック: %s

以下のJSON形式で返してください：
{
  "title": "デッキのタイトル（フィードバックを反映して改善）",
  "description": "デッキの説明（フィードバックを反映して改善）",
  "cards": [
    {
      "front": "質問や学習ポイント",
      "back": "詳細な説明や答え"
    }
  ]
}

重要：JSON形式のみを返し、他の説明は含めないでください。`, len(existingPreview), req.Feedback)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Unsupported generation type",
			"message": "サポートされていない生成タイプです",
		})
		return
	}

	// Gemini APIで再生成
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.7)
	model.SetMaxOutputTokens(3000)

	resp, err := model.GenerateContent(ctx, genai.Text(promptTemplate))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "AI generation failed",
			"message": "AI生成に失敗しました",
		})
		return
	}

	// レスポンス処理
	previewResp, err := h.processRegenerateResponse(ctx, resp, user.ID, generationType, originalPrompt, req.SessionID)
	if err != nil {
		h.handleError(c, ctx, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    previewResp,
	})
}

// テキストプレビュー処理
func (h *AIGenerateHandler) handleTextPreview(ctx context.Context, c *gin.Context) (*PreviewResponse, error) {
	prompt := c.PostForm("prompt")
	if prompt == "" {
		return nil, fmt.Errorf("プロンプトを入力してください")
	}

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		return nil, fmt.Errorf("ユーザー認証情報が見つかりません")
	}

	userID, ok := userIDStr.(string)
	if !ok {
		return nil, fmt.Errorf("無効なユーザーID形式")
	}

	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("ユーザーが見つかりません: %w", err)
	}

	promptTemplate := fmt.Sprintf(TextAnalysisPrompt, maxCards, prompt)

	return h.generatePreviewCards(ctx, promptTemplate, user.ID, "text", prompt, nil, "")
}

// 画像プレビュー処理
func (h *AIGenerateHandler) handleImagePreview(ctx context.Context, c *gin.Context) (*PreviewResponse, error) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		return nil, fmt.Errorf("画像ファイルの取得に失敗: %w", err)
	}
	defer file.Close()

	if err := h.validateImageFile(header); err != nil {
		return nil, err
	}

	fileData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("ファイル読み込みエラー: %w", err)
	}

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		return nil, fmt.Errorf("ユーザー認証情報が見つかりません")
	}

	userID, ok := userIDStr.(string)
	if !ok {
		return nil, fmt.Errorf("無効なユーザーID形式")
	}

	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("ユーザーが見つかりません: %w", err)
	}

	promptTemplate := fmt.Sprintf(ImageAnalysisPrompt, maxCards)

	return h.generatePreviewCards(ctx, promptTemplate, user.ID, "image", "", fileData, header.Header.Get("Content-Type"))
}

// 音声プレビュー処理
func (h *AIGenerateHandler) handleAudioPreview(ctx context.Context, c *gin.Context) (*PreviewResponse, error) {
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		return nil, fmt.Errorf("音声ファイルの取得に失敗: %w", err)
	}
	defer file.Close()

	if err := h.validateAudioFile(header); err != nil {
		return nil, err
	}

	fileData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("ファイル読み込みエラー: %w", err)
	}

	maxCards, _ := strconv.Atoi(c.PostForm("maxCards"))
	if maxCards == 0 {
		maxCards = 20
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		return nil, fmt.Errorf("ユーザー認証情報が見つかりません")
	}

	userID, ok := userIDStr.(string)
	if !ok {
		return nil, fmt.Errorf("無効なユーザーID形式")
	}

	var user models.User
	if err := h.db.WithContext(ctx).Where("clerk_id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("ユーザーが見つかりません: %w", err)
	}

	promptTemplate := fmt.Sprintf(AudioAnalysisPrompt, maxCards)

	return h.generatePreviewCards(ctx, promptTemplate, user.ID, "audio", "", fileData, header.Header.Get("Content-Type"))
}

// プレビューカード生成の共通処理
func (h *AIGenerateHandler) generatePreviewCards(ctx context.Context, promptTemplate string, userID uint, generationType string, originalPrompt string, fileData []byte, mimeType string) (*PreviewResponse, error) {
	// セッションIDの生成
	sessionID, err := h.generateSessionID()
	if err != nil {
		return nil, fmt.Errorf("セッションID生成エラー: %w", err)
	}

	// Gemini APIモデルの取得
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.7)
	model.SetMaxOutputTokens(3000)

	var resp *genai.GenerateContentResponse

	// コンテンツ生成
	if generationType == "text" {
		resp, err = model.GenerateContent(ctx, genai.Text(promptTemplate))
	} else {
		parts := []genai.Part{
			genai.Text(promptTemplate),
			genai.Blob{
				MIMEType: mimeType,
				Data:     fileData,
			},
		}
		resp, err = model.GenerateContent(ctx, parts...)
	}

	if err != nil {
		return nil, fmt.Errorf("AI生成エラー: %w", err)
	}

	// レスポンステキストの取得
	responseText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			responseText += string(textPart)
		}
	}

	// JSONの抽出
	responseText = h.extractJSON(responseText)

	// JSONのパース
	var deckInfo GeneratedDeckInfo
	if err := json.Unmarshal([]byte(responseText), &deckInfo); err != nil {
		return nil, fmt.Errorf("レスポンスパースエラー: %w, レスポンス: %s", err, responseText)
	}

	// プレビューカードの作成
	expiresAt := time.Now().Add(24 * time.Hour) // 24時間後に期限切れ
	var previewCards []models.CardPreview

	for _, genCard := range deckInfo.Cards {
		if err := h.validateCard(&genCard); err != nil {
			continue // 無効なカードはスキップ
		}

		previewCard := models.CardPreview{
			UserID:          userID,
			DeckTitle:       deckInfo.Title,
			DeckDescription: deckInfo.Description,
			Front:           genCard.Front,
			Back:            genCard.Back,
			GenerationType:  generationType,
			SessionID:       sessionID,
			ExpiresAt:       expiresAt,
			OriginalPrompt:  originalPrompt,
		}
		previewCards = append(previewCards, previewCard)
	}

	if len(previewCards) == 0 {
		return nil, fmt.Errorf("有効なカードが生成されませんでした")
	}

	// プレビューカードの保存
	if err := h.db.WithContext(ctx).Create(&previewCards).Error; err != nil {
		return nil, fmt.Errorf("プレビューカード保存エラー: %w", err)
	}

	return &PreviewResponse{
		SessionID:       sessionID,
		DeckTitle:       deckInfo.Title,
		DeckDescription: deckInfo.Description,
		Cards:           previewCards,
		ExpiresAt:       expiresAt,
	}, nil
}

// 再生成レスポンス処理
func (h *AIGenerateHandler) processRegenerateResponse(ctx context.Context, resp *genai.GenerateContentResponse, userID uint, generationType string, originalPrompt string, sessionID string) (*PreviewResponse, error) {
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("AIからの応答が空です")
	}

	// レスポンステキストの取得
	responseText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			responseText += string(textPart)
		}
	}

	// JSONの抽出
	responseText = h.extractJSON(responseText)

	// JSONのパース
	var deckInfo GeneratedDeckInfo
	if err := json.Unmarshal([]byte(responseText), &deckInfo); err != nil {
		return nil, fmt.Errorf("レスポンスパースエラー: %w, レスポンス: %s", err, responseText)
	}

	// 既存プレビューカードの削除
	if err := h.db.WithContext(ctx).Where("session_id = ?", sessionID).Delete(&models.CardPreview{}).Error; err != nil {
		return nil, fmt.Errorf("既存プレビューカード削除エラー: %w", err)
	}

	// 新しいプレビューカードの作成
	expiresAt := time.Now().Add(24 * time.Hour)
	var previewCards []models.CardPreview

	for _, genCard := range deckInfo.Cards {
		if err := h.validateCard(&genCard); err != nil {
			continue
		}

		previewCard := models.CardPreview{
			UserID:          userID,
			DeckTitle:       deckInfo.Title,
			DeckDescription: deckInfo.Description,
			Front:           genCard.Front,
			Back:            genCard.Back,
			GenerationType:  generationType,
			SessionID:       sessionID,
			ExpiresAt:       expiresAt,
			OriginalPrompt:  originalPrompt,
		}
		previewCards = append(previewCards, previewCard)
	}

	if len(previewCards) == 0 {
		return nil, fmt.Errorf("有効なカードが生成されませんでした")
	}

	// プレビューカードの保存
	if err := h.db.WithContext(ctx).Create(&previewCards).Error; err != nil {
		return nil, fmt.Errorf("プレビューカード保存エラー: %w", err)
	}

	return &PreviewResponse{
		SessionID:       sessionID,
		DeckTitle:       deckInfo.Title,
		DeckDescription: deckInfo.Description,
		Cards:           previewCards,
		ExpiresAt:       expiresAt,
	}, nil
}

// セッションIDの生成
func (h *AIGenerateHandler) generateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
