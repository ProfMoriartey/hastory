"use server";

import { revalidatePath } from "next/cache";

interface TranscriptionResponse {
  text?: string;
  error?: string;
}

// Rename this function to clearly indicate its purpose
export async function transcribeAudioAction(formData: FormData): Promise<TranscriptionResponse> {
  try {
    // 1. Extract the file from the FormData passed by the client
    const audio = formData.get("audio") as File | null; 

    if (!audio) {
      return { error: "Missing audio file" };
    }

    // 2. Prepare the FormData for the external API (OpenAI)
    const upload = new FormData();
    
    // Use the original file object and construct a proper filename
    const fileName = audio.name.includes('.') 
      ? audio.name 
      : `recording.${audio.type.split('/')[1] ?? "webm"}`;
      
    // Append the file using the correct field name 'file'
    upload.append("file", audio, fileName); 
    
    // Use the correct transcription model
    upload.append("model", "whisper-1"); 

    // 3. Call the external OpenAI API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      body: upload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return { error: `Transcription failed: ${response.status} - ${errorText.substring(0, 100)}...` };
    }

    const data = (await response.json()) as { text?: string };
    const text = data.text ?? "No transcription returned.";
    
    // Optional: If this transcription result is saved to Vercel Postgres/Drizzle,
    // you would call a function here to save it and then revalidatePath('/history').
    
    return { text };
  } catch (err) {
    const error = err as Error;
    console.error("Transcription error:", error);
    return { error: error.message };
  }
}