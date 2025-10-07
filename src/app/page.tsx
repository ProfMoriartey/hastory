"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setResponse(data.text);
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        OpenRouter AI Analyzer
      </h1>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your question or text to analyze..."
        className="mb-4 w-full max-w-xl"
      />

      <Button onClick={handleAnalyze} disabled={loading} className="mb-6 w-32">
        {loading ? "Analyzing..." : "Analyze"}
      </Button>

      {response && (
        <div className="w-full max-w-xl rounded-md bg-white p-4 shadow">
          <h2 className="mb-2 font-medium text-gray-700">Response:</h2>
          <p className="whitespace-pre-wrap text-gray-800">{response}</p>
        </div>
      )}
    </main>
  );
}
