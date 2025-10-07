import { NextResponse } from "next/server";

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-30b-a3b:free",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
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

    const text =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.error?.message ??
      "No response from model";

    return NextResponse.json({ text });
  } catch (err) {
    const error = err as Error;
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
