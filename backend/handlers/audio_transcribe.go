package handlers

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AudioTranscribeHandler struct {
	geminiClient *genai.Client
}

type AudioTranscribeResponse struct {
	Text string `json:"text"`
}

const (
	AudioTranscribePrompt = `この音声を正確に文字起こししてください。以下の点に注意してください：

- 話されている内容をそのまま文字に起こす
- 専門用語や固有名詞も正確に記録
- 句読点を適切に配置
- 不明瞭な部分は[不明]と記載

文字起こし結果のみを返してください。他の説明は不要です。`

	MaxAudioTranscribeSize = 50 * 1024 * 1024 // 50MB
)

var (
	AllowedAudioTranscribeTypes = []string{"audio/wav", "audio/mp3", "audio/aiff", "audio/aac", "audio/ogg", "audio/flac", "audio/webm"}
)

func NewAudioTranscribeHandler() (*AudioTranscribeHandler, error) {
	// Gemini APIクライアントの初期化
	client, err := genai.NewClient(context.Background(), option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		return nil, err
	}

	return &AudioTranscribeHandler{
		geminiClient: client,
	}, nil
}

// 音声をテキストに変換するエンドポイント
func (h *AudioTranscribeHandler) TranscribeAudio(c *gin.Context) {
	// タイムアウト付きコンテキストの作成
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	// ファイルの取得
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid file",
			"message": "音声ファイルの取得に失敗しました",
		})
		return
	}
	defer file.Close()

	// ファイル検証
	if err := h.validateAudioFile(header); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid file",
			"message": err.Error(),
		})
		return
	}

	// ファイルデータ読み込み
	fileData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "File read error",
			"message": "ファイル読み込みエラー",
		})
		return
	}

	// 音声をテキストに変換
	text, err := h.transcribeAudioData(ctx, fileData, header.Header.Get("Content-Type"))
	if err != nil {
		h.handleError(c, ctx, err)
		return
	}

	// 成功レスポンス
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": AudioTranscribeResponse{
			Text: text,
		},
	})
}

func (h *AudioTranscribeHandler) transcribeAudioData(ctx context.Context, fileData []byte, mimeType string) (string, error) {
	// Gemini APIモデルの取得
	model := h.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.1) // 文字起こしは正確性を重視
	model.SetMaxOutputTokens(2000)

	// コンテンツ生成
	parts := []genai.Part{
		genai.Text(AudioTranscribePrompt),
		genai.Blob{
			MIMEType: mimeType,
			Data:     fileData,
		},
	}

	resp, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		return "", fmt.Errorf("AI文字起こしエラー: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("AIからの応答が空です")
	}

	// レスポンステキストの取得
	responseText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			responseText += string(textPart)
		}
	}

	return responseText, nil
}

func (h *AudioTranscribeHandler) validateAudioFile(header *multipart.FileHeader) error {
	// ファイルサイズチェック
	if header.Size > MaxAudioTranscribeSize {
		return fmt.Errorf("ファイルサイズが大きすぎます（最大50MB）")
	}

	// MIMEタイプチェック
	contentType := header.Header.Get("Content-Type")
	for _, allowed := range AllowedAudioTranscribeTypes {
		if contentType == allowed {
			return nil
		}
	}

	return fmt.Errorf("サポートされていないファイル形式: %s", contentType)
}

func (h *AudioTranscribeHandler) handleError(c *gin.Context, ctx context.Context, err error) {
	switch {
	case ctx.Err() == context.DeadlineExceeded:
		c.JSON(http.StatusRequestTimeout, gin.H{
			"error":   "Request timeout",
			"message": "音声の文字起こしに時間がかかりすぎました",
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal server error",
			"message": err.Error(),
		})
	}
}
