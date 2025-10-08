"use server";

import {
  PATIENT_HISTORY_SCHEMA_STRING,
  PatientHistorySchema,
  type PatientHistory,
} from "~/lib/patientHistorySchema";
import { cleanTranscriptionText } from "~/lib/cleanText";
// NOTE: Assuming normalizePatientHistory is also moved or defined here,
// as it contains complex business logic specific to this mutation.

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChoice {
  message: ChatMessage;
  text?: string;
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message: string };
}

interface AnalysisResponse {
  data?: PatientHistory;
  error?: string;
  details?: string;
}

/** Recursively normalizes values for consistent JSON structure, essential for AI output cleanup. */
function normalizePatientHistory(data: unknown): unknown {
  const normalizeValue = (val: unknown): unknown => {
    if (Array.isArray(val)) return val.map(normalizeValue);

    if (typeof val === "string") {
      const trimmed = val.trim();

      // 🧠 Convert comma-separated strings into arrays
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // 🧠 Convert "45 years old" → 45
      const ageRegex = /^(\d{1,3})\s*(years?)?\s*(old)?$/i;
      const match = ageRegex.exec(trimmed);
      if (match) {
        const ageString = match[1];
        const num = ageString ? parseInt(ageString, 10) : NaN;
        // Keep age as string if it's the target type for the Zod schema,
        // or ensure the final normalized object matches the schema types.
        return isNaN(num) ? trimmed : num; 
      }

      // 🧠 Convert "none" / "n/a" / "no" → null
      if (["none", "n/a", "no", "nil"].includes(trimmed.toLowerCase())) {
        return null;
      }

      // Fix boolean output from some models
      if (trimmed.toLowerCase() === "true") return "yes";
      if (trimmed.toLowerCase() === "false") return "no";

      return trimmed;
    }

    if (typeof val === "number") return val;
    if (val === undefined) return null;
    if (val === null) return null;

    if (typeof val === "object" && val !== null) {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) => [k, normalizeValue(v)]),
      );
    }

    return val;
  };

  const normalized = normalizeValue(data) as Record<string, unknown> | null;

  if (!normalized || typeof normalized !== "object") return normalized;

  // 🧩 Force certain fields to always be arrays or handle nested structures
  
  // Past Medical History cleanup
  const pmh = normalized.pastMedicalHistory as Record<string, unknown> | undefined;
  if (pmh) {
    for (const key of [
      "chronicDiseases",
      "hospitalizations",
      "allergies",
      "immunizations",
      "transfusions",
    ]) {
      const val = pmh[key];
      // Convert string values to array of strings
      if (typeof val === "string") pmh[key] = [val];
      if (val === null || val === undefined) pmh[key] = [];
    }
  }

  // Medications cleanup
  const meds = normalized.medications as Record<string, unknown> | undefined;
  if (meds && typeof meds.supplements === "string") {
    // If supplements is a string, convert it to an array of strings
    meds.supplements = [meds.supplements];
  }

  return normalized;
}

/**
 * Server Action to analyze a medical transcript and structure it as PatientHistory JSON.
 * @param prompt The doctor-patient conversation text.
 * @returns Structured PatientHistory data or an error.
 */
export async function analyzeMedicalTextAction(prompt: string): Promise<AnalysisResponse> {
  if (!prompt.trim()) {
    return { error: "Missing prompt" };
  }

  try {
    const cleanedPrompt = cleanTranscriptionText(prompt);

    // 1. Build the System Prompt with the exact JSON schema
    const systemPrompt = `
You are a professional **medical documentation assistant and language model**. Your task is to analyze raw doctor–patient conversation transcripts, even if they include typos, incorrect spelling, speech recognition errors, or informal expressions.

Your goal:
1. **Correct spelling and grammar** where needed.
2. **Interpret the intended meaning** of phrases using context.
3. **Extract and organize all medically relevant information** into a JSON object that follows this schema exactly:

${PATIENT_HISTORY_SCHEMA_STRING}

Rules:
- Always return a valid JSON object (no markdown, no commentary).
- If any value is missing or uncertain, set it to null.
- Use concise, formal clinical language (e.g., "shortness of breath" instead of "hard to breathe").
- Arrays should be present even if empty.
- Do NOT include explanations, reasoning, or comments — JSON only.
- Ensure all string fields are enclosed in quotes.
- Do not write explanations, only the JSON.
`;

    // 2. Call the external AI API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3-30b-a3b:free",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Doctor–patient conversation:\n${cleanedPrompt}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return { error: "API request failed", details: errorText };
    }

    const data = (await response.json()) as OpenRouterResponse;

    const rawText =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.error?.message ??
      "";

    // 3. Parse and Validate AI JSON
    let parsed: unknown;
    try {
      // Clean up common AI JSON errors before parsing
      const fixedJson = rawText
        .trim()
        .replace(/}\s*{/g, ',') // Simple concatenation fix, risky but necessary for some models
        .replace(/,,+/g, ",")
        .replace(/[\n\r]/g, ''); // Remove newlines
      
      parsed = JSON.parse(fixedJson);
    } catch (err) {
      console.warn("AI returned invalid JSON:", rawText);
      return {
        error: "Model output not valid JSON",
        details: rawText.substring(0, 200),
      };
    }

    // 4. Normalize before validation (essential for handling AI variability)
    const normalizedData = normalizePatientHistory(parsed);

    const validation = PatientHistorySchema.safeParse(normalizedData);
    
    if (!validation.success) {
      console.error("Schema validation error:", validation.error.format());
      return {
        error: "Invalid data shape returned by AI",
        details: JSON.stringify(validation.error.format(), null, 2),
      };
    }

    // 5. Final normalization and return
    const finalData = normalizePatientHistory(validation.data) as PatientHistory;
    
    return { data: finalData };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Server action error:", error);
    return { error: "Action failed", details: error.message };
  }
}
