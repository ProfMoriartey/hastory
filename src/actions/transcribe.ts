// src/actions/transcribe.ts

"use server";

import { auth } from "@clerk/nextjs/server";
// ✅ NEW: Import 'node-fetch' if you are using Node.js runtime environment outside of Next's native fetch.
// In a modern Next.js environment (which runs on the Edge/Node), you can typically use the global `fetch`.

// Define the structure of the API error response
interface OpenAIError {
  message: string;
  type: string;
}

// Define the full structure of the API response (either success or error)
interface OpenAiTranscriptionResponse {
  text?: string;
  error?: OpenAIError;
}

interface TranscriptionResult {
  text?: string;
  error?: string;
}

/**
 * Handles audio file URL, fetches the file, and sends it to the OpenAI Whisper API for transcription.
 * @param audioUrl The permanent URL of the audio file uploaded to Uploadthing.
 */
export async function transcribeAudioAction(audioUrl: string): Promise<TranscriptionResult> {
  // Use await auth() to ensure the user is authenticated before costly API call
  const { userId } = await auth();
  if (!userId) {
    return { error: "Authentication required for transcription." };
  }

  
  if (!audioUrl) {
    return { error: "Audio URL is missing." };
  }
  
  // Linter is happy here because 'audioUrl' is guaranteed to be a string
  if (!audioUrl.startsWith("http")) { 
    return { error: "Invalid audio URL provided (must start with http/https)." };
  }
  
  // 1. Fetch the audio file from the Uploadthing URL
  let audioFileResponse: Response;
  try {
    audioFileResponse = await fetch(audioUrl);
    if (!audioFileResponse.ok) {
      return { error: `Failed to fetch audio from URL. Status: ${audioFileResponse.status}` };
    }
  } catch (err) {
    console.error("Audio Fetch Error:", err);
    return { error: "Network error while downloading audio." };
  }

  // 2. Prepare the FormData for the external API (OpenAI)
  const upload = new FormData();
  
  // The filename is required by the API. We can extract it or use a default.
  // We'll use a fixed name and the content type from the fetch response.
  const contentType = audioFileResponse.headers.get("Content-Type") ?? "application/octet-stream";
  const fileExtension = contentType.split('/')[1] ?? "webm";
  
  // Create a Blob from the file stream and wrap it in a new File object for FormData
  const audioBlob = await audioFileResponse.blob();
  const audioFile = new File([audioBlob], `transcription.${fileExtension}`, { type: contentType });
  
  upload.append("file", audioFile, audioFile.name); 
  upload.append("model", "whisper-1"); 

  try {
    // 3. Call the external OpenAI API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      // Note: Do NOT set Content-Type header when using FormData with fetch. 
      // Fetch automatically sets the correct boundary header.
      body: upload,
    });

    // 4. Handle API Response
    if (!response.ok) {
      const errorJson = (await response.json()) as OpenAiTranscriptionResponse;
      console.error("OpenAI API error:", errorJson);
      
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