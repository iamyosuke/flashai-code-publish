"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PreviewResponse, CardPreview } from "@/lib/types";
import { confirmPreviewAction, regenerateWithFeedbackAction } from "@/app/actions/AiGenerateAction";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // プレビューデータをセッションストレージから取得
    const storedData = sessionStorage.getItem("ai-preview-data");
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPreviewData(data);
      } catch (error) {
        console.error("Failed to parse preview data:", error);
        router.push("/cards/create/ai");
      }
    } else {
      // プレビューデータがない場合は元のページに戻る
      router.push("/cards/create/ai");
    }
  }, [router]);

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (previewData && currentCardIndex < previewData.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRegenerate = async () => {
    if (!previewData || !feedback.trim()) {
      toast.error("フィードバックを入力してください");
      return;
    }

    setIsRegenerating(true);
    try {
      const newPreviewData = await regenerateWithFeedbackAction({
        sessionId: previewData.sessionId,
        feedback: feedback.trim(),
      });

      setPreviewData(newPreviewData);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setFeedback("");
      
      // セッションストレージを更新
      sessionStorage.setItem("ai-preview-data", JSON.stringify(newPreviewData));
      
      toast.success("カードが再生成されました");
    } catch (error) {
      console.error("Regeneration failed:", error);
      toast.error(error instanceof Error ? error.message : "再生成に失敗しました");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    setIsConfirming(true);
    try {
      const result = await confirmPreviewAction({
        sessionId: previewData.sessionId,
      });

      // プレビューデータをセッションストレージから削除
      sessionStorage.removeItem("ai-preview-data");
      
      toast.success("カードが保存されました");
      
      // 作成されたデッキページにリダイレクト
      router.push(`/decks/${result.deckId}`);
    } catch (error) {
      console.error("Confirmation failed:", error);
      toast.error(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">プレビューを読み込み中...</p>
        </div>
      </div>
    );
  }

  const currentCard = previewData.cards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI生成フラッシュカード - プレビュー
          </h1>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {previewData.deckTitle}
            </h2>
            <p className="text-gray-600">{previewData.deckDescription}</p>
            <p className="text-sm text-gray-500 mt-2">
              カード数: {previewData.cards.length}枚
            </p>
          </div>
        </div>

        {/* カードプレビュー */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* カード表示エリア */}
          <div className="space-y-6">
            {/* カードナビゲーション */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                前のカード
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentCardIndex + 1} / {previewData.cards.length}
              </span>
              
              <Button
                variant="outline"
                onClick={handleNextCard}
                disabled={currentCardIndex === previewData.cards.length - 1}
                className="flex items-center gap-2"
              >
                次のカード
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* フラッシュカード */}
            <Card 
              className="h-64 cursor-pointer transition-transform hover:scale-105"
              onClick={handleFlipCard}
            >
              <CardContent className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-lg font-medium mb-4 text-gray-800">
                    {isFlipped ? "裏面" : "表面"}
                  </div>
                  <div className="text-xl text-gray-900 leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    クリックして{isFlipped ? "表面" : "裏面"}を表示
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* コントロールエリア */}
          <div className="space-y-6">
            {/* フィードバック入力 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  改善のフィードバック
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="AIに対する改善指示を入力してください（例：もっと詳しい説明を追加、難易度を下げる、具体例を含める等）"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleRegenerate}
                  disabled={!feedback.trim() || isRegenerating}
                  className="w-full"
                  variant="outline"
                >
                  {isRegenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      再生成中...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      フィードバックで再生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 確定ボタン */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      このカードで確定
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  カードを確定すると新しいデッキが作成されます
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}