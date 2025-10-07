import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-30b-a3b:free",// or try "mistralai/mixtral-8x7b"
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    // If OpenRouter returns an error (like invalid key or quota)
    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: "API request failed", details: errorText }, { status: 500 });
    }

    const data = await res.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    const text =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.error?.message ||
      "No response from model";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
