"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Deck } from "@/lib/types";
import { 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Send, 
  X,
  Sparkles
} from "lucide-react";
import { generateNewDeckWithCardsAction, transcribeAudioAction, generatePreviewAction } from "@/app/actions/AiGenerateAction";
import AILoading from "@/components/ui/ai-loading";

interface AIGenerateCardsFormProps {
  decks: Deck[];
}

export default function AIGenerateCardsForm({ decks }: AIGenerateCardsFormProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  
  // メディア関連の状態
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const validateFile = (file: File, type: 'image' | 'audio'): string | null => {
    const limits = {
      image: { maxSize: 20 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'] },
      audio: { maxSize: 50 * 1024 * 1024, types: ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'] }
    };
    
    const limit = limits[type];
    
    if (file.size > limit.maxSize) {
      return `ファイルサイズが大きすぎます（最大${limit.maxSize / 1024 / 1024}MB）`;
    }
    
    if (!limit.types.includes(file.type)) {
      return `サポートされていないファイル形式です`;
    }
    
    return null;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const error = validateFile(file, 'image');
    if (error) {
      setError(error);
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const error = validateFile(file, 'audio');
    if (error) {
      setError(error);
      return;
    }
    
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setRecordedBlob(null);
    setError(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioFile(null);
        stream.getTracks().forEach(track => track.stop());
        
        // ChatGPT風: 録音終了後自動的に音声を文字起こししてプロンプト欄に反映
        await transcribeAndPopulatePrompt(blob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setError("マイクへのアクセスが拒否されました");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAudio = () => {
    setAudioFile(null);
    setRecordedBlob(null);
    setAudioUrl(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const hasMediaInput = () => {
    return imageFile !== null || audioFile !== null || recordedBlob !== null;
  };

  // ArrayBufferをBase64文字列に変換するヘルパー関数
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // ChatGPT風: 録音終了後自動的に音声を文字起こししてプロンプト欄に反映
  const transcribeAndPopulatePrompt = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setProcessingStep('音声を文字起こし中...');
    
    try {
      // BlobをArrayBufferに変換し、さらにBase64文字列に変換
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);
      
      const transcribedText = await transcribeAudioAction(
        base64Data,
        'recording.wav',
        'audio/wav'
      );
      setPrompt(transcribedText);
      
      // 音声ファイルをクリア（文字起こし完了後）
      clearAudio();
      
      setProcessingStep('');
    } catch (error) {
      console.error("Failed to transcribe audio:", error);
      setError(error instanceof Error ? error.message : "音声の文字起こしに失敗しました");
      setProcessingStep('');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 音声をテキストに変換（レガシー関数 - ファイルアップロード用）
  const transcribeAudio = async () => {
    const audioData = audioFile || recordedBlob;
    if (!audioData) return;

    setIsTranscribing(true);
    setProcessingStep('音声を文字起こし中...');
    
    try {
      // ファイル情報の準備
      let arrayBuffer: ArrayBuffer;
      let fileName: string;
      let mimeType: string;
      
      if (audioData instanceof File) {
        arrayBuffer = await audioData.arrayBuffer();
        fileName = audioData.name;
        mimeType = audioData.type || 'audio/wav';
      } else {
        arrayBuffer = await audioData.arrayBuffer();
        fileName = 'recording.wav';
        mimeType = 'audio/wav';
      }
      
      // ArrayBufferをBase64文字列に変換
      const base64Data = arrayBufferToBase64(arrayBuffer);
      
      const transcribedText = await transcribeAudioAction(
        base64Data,
        fileName,
        mimeType
      );
      setPrompt(transcribedText);
      
      // 音声ファイルをクリア
      clearAudio();
      
      setProcessingStep('');
    } catch (error) {
      console.error("Failed to transcribe audio:", error);
      setError(error instanceof Error ? error.message : "音声の文字起こしに失敗しました");
      setProcessingStep('');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 音声ファイルアップロードがある場合は先に文字起こし（レガシー対応）
    if (audioFile && !recordedBlob) {
      await transcribeAudio();
      return;
    }
    
    // 入力チェック
    if (!imageFile && !prompt.trim()) {
      setError("テキストを入力するか、画像ファイルを選択してください");
      return;
    }

    setIsGenerating(true);
    setProcessingStep('AIがプレビューカードを生成中...');
    
    try {
      // audioFileとrecordedBlobの処理
      const audioData = audioFile || (recordedBlob ? new File([recordedBlob], 'recording.wav', { type: 'audio/wav' }) : undefined);
      
      const previewResult = await generatePreviewAction(
        prompt || undefined,
        imageFile || undefined,
        audioData,
        20
      );
      
      // プレビューデータをセッションストレージに保存
      sessionStorage.setItem("ai-preview-data", JSON.stringify(previewResult));
      
      // プレビューページにリダイレクト
      router.push('/cards/create/ai/preview');
    } catch (error) {
      console.error("Failed to generate preview:", error);
      setError(error instanceof Error ? error.message : "プレビュー生成に失敗しました");
      setProcessingStep('');
      setIsGenerating(false);
    }
  };

  const isSubmitting = isGenerating || isTranscribing;

  // ローディング画面を表示
  if (isGenerating && processingStep) {
    return <AILoading message={processingStep} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Input Area - ChatGPT Style */}
        <div className="space-y-6">
          {/* Input Container */}
          <div className="relative">
            {/* Hidden file inputs */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect}
              disabled={isSubmitting}
              className="hidden"
            />
            <input 
              ref={audioInputRef}
              type="file" 
              accept="audio/*" 
              onChange={handleAudioSelect}
              disabled={isSubmitting}
              className="hidden"
            />
            
            {/* Main Input Box */}
            <div className="relative bg-white/80 backdrop-blur-sm border-2 border-white/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 focus-within:border-purple-300 focus-within:shadow-2xl">
              <div className="flex items-end p-6">
                {/* Text Input Area */}
                <div className="flex-1 min-h-[60px] max-h-48 overflow-y-auto relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={prompt.trim() === '' && !imageFile ? "何について学びたいですか？マイクボタンで音声入力も可能です..." : "何について学びたいですか？例：日本の歴史、英語の基本単語、数学の公式..."}
                    disabled={isSubmitting || imageFile !== null}
                    className="border-0 resize-none focus:ring-0 focus:outline-none bg-transparent text-lg leading-relaxed placeholder:text-gray-400 font-medium w-full"
                    rows={2}
                    style={{ 
                      boxShadow: 'none',
                      padding: '0',
                      minHeight: '60px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                    }}
                  />
                  {/* Transcribing Indicator */}
                  {isTranscribing && (
                    <div className="absolute bottom-2 left-0 flex items-center space-x-2 text-blue-600 text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                      <span>音声を文字起こし中...</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3 ml-6">
                  {/* Image Button */}
                  <Button 
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || prompt.trim() !== ''}
                    className="h-12 w-12 p-0 rounded-2xl hover:bg-purple-50 text-gray-600 hover:text-purple-600 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                    title="画像を選択"
                  >
                    <ImageIcon className="h-6 w-6" />
                  </Button>
                  
                  {/* Audio Record Button - ChatGPT Style Inside Textarea */}
                  {!imageFile && prompt.trim() === '' && (
                    <Button 
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSubmitting}
                      className={`h-12 w-12 p-0 rounded-2xl transition-all duration-200 hover:scale-105 ${
                        isRecording 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' 
                          : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                      } disabled:opacity-50`}
                      title={isRecording ? "録音停止" : "録音開始"}
                    >
                      {isRecording ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  )}
                  
                  {/* Send Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || (!imageFile && !prompt.trim() && !audioFile)}
                    className="h-12 w-12 p-0 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Floating AI Badge */}
            <div className="absolute -top-3 left-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Powered</span>
            </div>
          </div>
          
          {/* Helper Text */}
          <p className="text-center text-gray-500 text-sm">
            {hasMediaInput() && (audioFile || recordedBlob) 
              ? "音声を文字起こししてからプレビューを生成します" 
              : "AIがプレビューを生成します。確認後に保存できます"
            }
          </p>
        </div>

        {/* Media Previews */}
        {imagePreview && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <span>選択された画像</span>
              </h3>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={clearImage}
                disabled={isSubmitting}
                className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-md" />
            </div>
          </div>
        )}

        {audioFile && audioUrl && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Mic className="h-5 w-5 text-blue-600" />
                <span>アップロードされた音声</span>
              </h3>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={clearAudio}
                disabled={isSubmitting}
                className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <audio controls src={audioUrl} className="w-full rounded-lg mb-3" />
            <p className="text-sm text-gray-600 text-center">
              送信ボタンを押すと音声を文字起こしします
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">自動生成</h4>
            <p className="text-sm text-gray-600">デッキ名と説明も自動作成</p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">マルチメディア</h4>
            <p className="text-sm text-gray-600">テキスト・画像・音声対応</p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">プレビュー機能</h4>
            <p className="text-sm text-gray-600">確認してから保存できます</p>
          </div>
        </div>
      </form>
    </div>
  );
}
