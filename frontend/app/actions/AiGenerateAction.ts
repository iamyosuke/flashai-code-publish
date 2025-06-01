"use server";
import { getHeaders } from "@/lib/getHeaders";
import { Card, PreviewResponse, ConfirmPreviewInput, RegenerateInput } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface AIGenerateCardsParams {
  prompt: string;
  deckId: string;
  maxCards: number;
}

interface AIGenerateCardsResponse {
  success: boolean;
  data: {
    cards: Card[];
  };
}

// 音声をテキストに変換するサーバーアクション
export async function transcribeAudioAction(
  base64Data: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const headers = await getHeaders();
  const formData = new FormData();
  
  // Base64文字列をデコードしてBlobに変換
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  
  // BlobからFileオブジェクトを作成
  const file = new File([blob], fileName, { type: mimeType });
  formData.append("audio", file);

  // FormDataを使用する場合はContent-Typeヘッダーを削除
  const { "Content-Type": _, ...headersWithoutContentType } = headers;

  const response = await fetch(`${API_BASE_URL}/api/audio/transcribe`, {
    method: "POST",
    headers: headersWithoutContentType,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "音声の文字起こしに失敗しました";

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
    }

    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    throw new Error("Empty response from server");
  }

  try {
    const result = JSON.parse(text);
    return result.data.text;
  } catch (error) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

// AI生成（新規デッキ作成）のサーバーアクション
export async function generateNewDeckWithCardsAction(
  prompt?: string, 
  imageData?: { base64Data: string, fileName: string, mimeType: string }, 
  maxCards: number = 20
): Promise<{ deckId: number }> {
  try {
    const headers = await getHeaders();
    const formData = new FormData();

    formData.append("deckOption", "new");
    formData.append("deckId", "");
    formData.append("maxCards", maxCards.toString());

    if (imageData) {
      // Base64文字列をデコードしてBlobに変換
      const binaryString = atob(imageData.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: imageData.mimeType });
      
      // BlobからFileオブジェクトを作成
      const imageFile = new File([blob], imageData.fileName, { type: imageData.mimeType });
      formData.append("image", imageFile);
    } else if (prompt) {
      formData.append("prompt", prompt);
    } else {
      throw new Error("プロンプトまたは画像が必要です");
    }

    // FormDataを使用する場合はContent-Typeヘッダーを削除
    const { "Content-Type": _, ...headersWithoutContentType } = headers;

    console.log("Sending request to:", `${API_BASE_URL}/api/cards/ai_generate`);
    console.log("FormData entries:");
    for (const [key, value] of Array.from(formData.entries())) {
      console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
    }

    const response = await fetch(`${API_BASE_URL}/api/cards/ai_generate`, {
      method: "POST",
      headers: headersWithoutContentType,
      body: formData,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response text:", errorText);
      let errorMessage = "カード生成に失敗しました";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const text = await response.text();
    console.log("Success response text:", text);
    console.log("Response text length:", text.length);
    console.log("First 200 chars:", text.substring(0, 200));

    if (!text) {
      throw new Error("Empty response from server");
    }

    const result = JSON.parse(text);
    if (!result.success) {
      throw new Error(result.message || "カード生成に失敗しました");
    }
    
    // 生成されたデッキのIDを返す
    return { deckId: result.data.deck.id };
  } catch (error) {
    console.error("Failed to generate cards:", error);
    throw error;
  }
}

// AI生成プレビューのサーバーアクション
export async function generatePreviewAction(prompt?: string, imageFile?: File, audioFile?: File, maxCards: number = 20): Promise<PreviewResponse> {
  try {
    const headers = await getHeaders();
    const formData = new FormData();

    formData.append("maxCards", maxCards.toString());

    if (imageFile) {
      formData.append("image", imageFile);
    } else if (audioFile) {
      formData.append("audio", audioFile);
    } else if (prompt) {
      formData.append("prompt", prompt);
    } else {
      throw new Error("プロンプト、画像、または音声のいずれかが必要です");
    }

    // FormDataを使用する場合はContent-Typeヘッダーを削除
    const { "Content-Type": _, ...headersWithoutContentType } = headers;

    const response = await fetch(`${API_BASE_URL}/api/cards/ai_preview`, {
      method: "POST",
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "プレビュー生成に失敗しました";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "プレビュー生成に失敗しました");
    }

    return result.data;
  } catch (error) {
    console.error("Failed to generate preview:", error);
    throw error;
  }
}

// プレビュー確定のサーバーアクション
export async function confirmPreviewAction(input: ConfirmPreviewInput): Promise<{ deckId: number }> {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${API_BASE_URL}/api/cards/ai_confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "プレビュー確定に失敗しました";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "プレビュー確定に失敗しました");
    }

    return { deckId: result.data.deck.id };
  } catch (error) {
    console.error("Failed to confirm preview:", error);
    throw error;
  }
}

// フィードバック付き再生成のサーバーアクション
export async function regenerateWithFeedbackAction(input: RegenerateInput): Promise<PreviewResponse> {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${API_BASE_URL}/api/cards/ai_regenerate`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "再生成に失敗しました";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "再生成に失敗しました");
    }

    return result.data;
  } catch (error) {
    console.error("Failed to regenerate with feedback:", error);
    throw error;
  }
}
