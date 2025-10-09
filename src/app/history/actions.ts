"use server";

import {
  PATIENT_HISTORY_SCHEMA_STRING,
  PatientHistorySchema,
  type PatientHistory,
} from "~/lib/patientHistorySchema";
import { cleanTranscriptionText } from "~/lib/cleanText";
import { db } from "~/server/db/index"; 
import { sessions, patients } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";



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

/** Recursively normalizes primitive values for cleanup (null, age, booleans)
 * but AVOIDS complex structural changes like splitting strings into arrays.
 */
function normalizePatientHistory(data: unknown): unknown {
  const normalizeValue = (val: unknown): unknown => {
    if (Array.isArray(val)) return val.map(normalizeValue);

    if (typeof val === "string") {
      const trimmed = val.trim();

      // 🛑 REMOVED: Logic to convert comma-separated strings to arrays
      // We rely on the AI model to output JSON arrays correctly.

      // 🧠 Convert "45 years old" → 45 (or string if it fails)
      const ageRegex = /^(\d{1,3})\s*(years?)?\s*(old)?$/i;
      const match = ageRegex.exec(trimmed);
      if (match) {
        const ageString = match[1];
        const num = ageString ? parseInt(ageString, 10) : NaN;
        // Keep as number if successful, otherwise keep original trimmed string
        return isNaN(num) ? trimmed : num; 
      }

      // 🧠 Convert "none" / "n/a" / "no" → null
      if (["none", "n/a", "no", "nil", "n/a"].includes(trimmed.toLowerCase())) {
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

  // 🧩 POST-RECURSION CLEANUP: Force string fields that should be arrays into arrays.
  
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
      // Convert string values to array of strings if a single string was returned
      if (typeof val === "string") {
         // If a single string with commas is returned (e.g., "headache, fever"), split it here.
         pmh[key] = val.split(",").map(s => s.trim()).filter(Boolean);
      }
      if (val === null || val === undefined) pmh[key] = [];
    }
  }

  // Medications cleanup
  const meds = normalized.medications as Record<string, unknown> | undefined;
  if (meds) {
      if (typeof meds.supplements === "string") {
        // If supplements is a string, convert it to an array of strings
        meds.supplements = [meds.supplements];
      }
      // Ensure 'current' is an array if present
      if (meds.current && !Array.isArray(meds.current)) {
          meds.current = [meds.current];
      }
  }

  return normalized;
}

/**
 * Server Action to analyze a medical transcript and structure it as PatientHistory JSON.
 * @param prompt The doctor-patient conversation text.
 * @returns Structured PatientHistory data or an error.
 */
export async function analyzeMedicalTextAction(prompt: string, patientId: number): Promise<AnalysisResponse> {
  if (!prompt.trim()) {
    return { error: "Missing prompt" };
  }

const { userId } = await auth();
  if (!userId) {
    return { error: "Authentication required." };
  }

  try {
    // 1. SECURITY CHECK: Verify the user owns this patient ID
    const patientRecord = await db.query.patients.findFirst({
      where: and(
        eq(patients.id, patientId),
        eq(patients.userId, userId)
      ),
    });

    if (!patientRecord) {
      return { error: "Authorization failed: Patient not found or access denied." };
    }

    const cleanedPrompt = cleanTranscriptionText(prompt);

    // 1. Build the System Prompt with the exact JSON schema
    const systemPrompt = `
You are a professional **medical documentation assistant and language model**. Your task is to analyze raw doctor–patient conversation transcripts, even if they include typos, incorrect spelling, speech recognition errors, or informal expressions.
YOUR RESPONSE MUST STRICTLY BE A JSON OBJECT THAT CONFORMS TO THE FOLLOWING SCHEMA. DO NOT INCLUDE ANY MARKDOWN, COMMENTS, OR EXTRA TEXT OUTSIDE OF THE JSON BLOCK.

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
- **STRICTLY** begin your response with '{' and end with '}'.
- Every key must be enclosed in double quotes.
- If a value is missing or uncertain, set it to **null** (if required) or **""**.
- Arrays must be present even if empty.
- Do NOT include markdown formatting like \`\`\`json.
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
    // The normalization helper now avoids converting string narratives into arrays.
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
       const finalData = validation.data;
    
    // 🎯 Drizzle Insert Call: Returns an array of inserted records
    const insertedSessions = await db.insert(sessions).values({
      patientId: patientId,
      transcript: prompt,
      structuredData: finalData,
    }).returning({ id: sessions.id });

    // ✅ FIX: Check the array result for a valid record
    const newSession = insertedSessions[0]; 

    if (!newSession) {
        // Handle the database failure if no session record was returned
        console.error("Drizzle insert failed: Returned empty result.");
        return { error: "Failed to secure session ID.", details: "Database insert returned empty result." };
    }
    
    // The code is now safe because we confirmed newSession exists
    console.log(`✅ Session successfully saved. New Session ID: ${newSession.id}`);

    // 6. Revalidate the list page
    revalidatePath(`/patient/${patientId}/sessions`); 

    // Return the structured data to the client
    return { data: finalData };

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Server action error:", error);
    return { error: "Action failed", details: error.message };
  }
}

