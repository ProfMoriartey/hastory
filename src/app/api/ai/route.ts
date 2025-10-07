import { NextResponse } from "next/server";
import {
  PATIENT_HISTORY_SCHEMA_STRING,
  PatientHistorySchema,
  type PatientHistory,
} from "~/lib/patientHistorySchema";
import { cleanTranscriptionText } from "~/lib/cleanText";

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

/** Recursively normalizes values for consistent JSON structure. */
function normalizePatientHistory(
  data: unknown
): Record<string, unknown> | unknown[] | string | null {
  if (Array.isArray(data)) {
    return data.map((val) => normalizePatientHistory(val));
  }
  if (data === null || data === undefined) return null;

  switch (typeof data) {
    case "boolean":
      return data ? "yes" : "no";
    case "number":
      return String(data);
    case "string":
      // If comma-separated, convert to array of trimmed values
      if (data.includes(",")) {
        return data
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return data;
    case "object": {
      const obj = data as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, normalizePatientHistory(v)])
      );
    }
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // 🧼 Clean the text before sending to the model
    const cleanedPrompt = cleanTranscriptionText(prompt);

    const systemPrompt = `
    You are a professional **medical documentation assistant and language model**.
Your task is to analyze raw doctor–patient conversation transcripts, even if they include typos,
incorrect spelling, speech recognition errors, or informal expressions.

Your goal:
1. **Correct spelling and grammar** where needed.
2. **Interpret the intended meaning** of phrases using context.
3. **Extract and organize all medically relevant information** into a JSON object that follows this schema exactly:

${PATIENT_HISTORY_SCHEMA_STRING}

Rules:
- Always return a valid JSON object (no markdown, no commentary).
- If any value is missing or uncertain, set it to null.
- If a value is not explicitly stated but can be reasonably inferred, provide your best guess.
- If the input text contains errors, infer the correct medical term when possible (e.g., "diaebtes" → "diabetes").
- Use concise, formal clinical language (e.g., "shortness of breath" instead of "hard to breathe").
- Dates must be ISO strings (e.g., "2025-10-07"), not numbers.
- Arrays should be present even if empty.
- Use English medical terminology.
- Do NOT include explanations, reasoning, or comments — JSON only.
- Ensure all string fields are enclosed in quotes.
- Do not write explanations, only the JSON.
- Booleans should not appear; use strings or null instead.
- Keep arrays even if empty (e.g., "associatedSymptoms": []).
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-30b-a3b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Doctor–patient conversation:\n${cleanedPrompt}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json(
        { error: "API request failed", details: errorText },
        { status: 500 }
      );
    }

    const data = (await response.json()) as OpenRouterResponse;

    const rawText =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.error?.message ??
      "";

    // 🧠 Parse AI JSON safely
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn("AI returned invalid JSON:", rawText);
      return NextResponse.json(
        { error: "Model output not valid JSON", rawText },
        { status: 422 }
      );
    }

    const validation = PatientHistorySchema.safeParse(parsed);

    if (!validation.success) {
      console.error("Schema validation error:", validation.error.format());
      return NextResponse.json(
        { error: "Invalid data shape", issues: validation.error.format(), rawText },
        { status: 422 }
      );
    }

    const normalized = normalizePatientHistory(validation.data) as PatientHistory;

    // ✅ Return validated structured data to frontend
    return NextResponse.json(normalized, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

