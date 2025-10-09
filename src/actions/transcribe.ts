"use server";

import { auth } from "@clerk/nextjs/server";

// 🎯 Define the structure of the API error response
interface OpenAIError {
  message: string;
  type: string;
}

// 🎯 Define the full structure of the API response (either success or error)
interface OpenAiTranscriptionResponse {
  text?: string;
  error?: OpenAIError;
}

interface TranscriptionResult {
  text?: string;
  error?: string;
}

/**
 * Handles audio file upload and sends it to the OpenAI Whisper API for transcription.
 */
export async function transcribeAudioAction(formData: FormData): Promise<TranscriptionResult> {
  // Use await auth() to ensure the user is authenticated before costly API call
  const { userId } = await auth();
  if (!userId) {
    return { error: "Authentication required for transcription." };
  }

  const audio = formData.get("audio") as File | null; 

  if (!audio) {
    return { error: "Missing audio file for transcription." };
  }
  
  // 1. Prepare the FormData for the external API (OpenAI)
  const upload = new FormData();
  
  // Ensure we use the correct filename and MIME type from the client upload
  const fileName = audio.name.includes('.') 
    ? audio.name 
    : `recording.${audio.type.split('/')[1] ?? "webm"}`;
    
  upload.append("file", audio, fileName); 
  upload.append("model", "whisper-1"); 

  try {
    // 2. Call the external OpenAI API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      body: upload,
    });

    // 🎯 We must check response.ok first, then parse the body as the error type if needed
    if (!response.ok) {
      // ✅ FIX 1: Explicitly cast the error response to ensure type safety
      const errorJson = (await response.json()) as OpenAiTranscriptionResponse;
      console.error("OpenAI API error:", errorJson);
      
      // ✅ FIX 2: Use optional chaining on the strongly typed object
      const message = errorJson.error?.message ?? "Transcription service failed.";
      return { error: message };
    }

    // If response is OK, parse the body as the success type
    const data = (await response.json()) as { text?: string };
    const text = data.text ?? "";

    if (!text) {
        return { error: "Whisper returned empty transcription." };
    }

    return { text: text };
  } catch (err) {
    // Catch network errors or JSON parsing issues
    const error = err as Error;
    console.error("Transcription Server Action error:", error);
    return { error: error.message };
  }
}
