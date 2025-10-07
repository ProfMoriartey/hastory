import { NextResponse } from "next/server";
import { PATIENT_HISTORY_SCHEMA_STRING, PatientHistorySchema } from "~/lib/patientHistorySchema";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = body?.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const systemPrompt = `
You are a medical documentation assistant.
Extract and organize all relevant medical information from the following doctor–patient conversation
into a structured JSON object following this schema:

${PATIENT_HISTORY_SCHEMA_STRING}

Guidelines:
- Output valid JSON only (no markdown or explanations).
- Use concise clinical language.
- Leave missing data as null or empty.
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
          { role: "user", content: `Doctor–patient conversation:\n${prompt}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: "API request failed", details: errorText }, { status: 500 });
    }

    const data = (await response.json()) as OpenRouterResponse;

    const rawText =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.error?.message ??
      "";

    // 🧠 Validate the AI output safely
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn("AI returned invalid JSON:", rawText);
      return NextResponse.json({ error: "Model output not valid JSON", rawText }, { status: 422 });
    }

    const validation = PatientHistorySchema.safeParse(parsed);

    if (!validation.success) {
      console.error("Schema validation error:", validation.error.format());
      return NextResponse.json(
        { error: "Invalid data shape", issues: validation.error.format(), rawText },
        { status: 422 }
      );
    }

    const validData = validation.data;

    return NextResponse.json({ text: "Success", data: validData });
  } catch (err) {
    const error = err as Error;
    console.error("Server error:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}
