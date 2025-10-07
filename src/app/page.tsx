"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <div className="text-center">
        <h1 className="mb-6 text-3xl font-bold text-gray-800 md:text-4xl">
          🩺 Medical Transcription Assistant
        </h1>
        <p className="mx-auto mb-12 max-w-md text-gray-600">
          Record doctor–patient conversations, transcribe them with AI, and
          structure the data for medical documentation.
        </p>

        <div className="flex flex-col justify-center gap-6 md:flex-row">
          <Button
            onClick={() => router.push("/transcribe")}
            className="h-16 w-64 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
          >
            🎙️ Transcribe Audio
          </Button>

          <Button
            onClick={() => router.push("/history")}
            variant="secondary"
            className="h-16 w-64 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
          >
            🧾 View History
          </Button>
        </div>
      </div>
    </main>
  );
}
