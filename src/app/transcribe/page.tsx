"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function TranscribePage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const router = useRouter();

  const handleStartRecording = async () => {
    setTranscription("");
    setCopied(false);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/ogg; codecs=opus",
    });
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/ogg" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const handleSendAudio = async () => {
    if (!audioUrl) return;
    setLoading(true);
    setTranscription("");

    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append("audio", blob, "recording.ogg");

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as { text?: string; error?: string };
    setTranscription(data.text ?? data.error ?? "No transcription available.");
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* ✅ Top Navigation Bar */}
      <nav className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>
              🔙 Back
            </Button>
            <Button onClick={() => router.push("/history")}>📜 History</Button>
          </div>
          <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
            🎙️ Audio Transcriber
          </h1>
        </div>
      </nav>

      {/* ✅ Main Content */}
      <div className="flex flex-grow flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800 sm:text-left">
            Record and Transcribe
          </h2>

          {/* 🎤 Recording Controls */}
          <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
            {!recording ? (
              <Button
                onClick={handleStartRecording}
                className="w-full sm:w-auto"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Stop Recording
              </Button>
            )}

            <Button
              onClick={handleSendAudio}
              disabled={!audioUrl || loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Processing..." : "Transcribe"}
            </Button>
          </div>

          {/* 🔊 Audio Player */}
          {audioUrl && (
            <div className="mb-6 flex w-full justify-center">
              <audio
                controls
                src={audioUrl}
                className="w-full rounded-md border border-gray-200 sm:w-80"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* 📝 Transcription Output */}
          {transcription && (
            <div className="relative w-full rounded-md border border-gray-200 bg-white p-4 whitespace-pre-wrap text-gray-800 shadow">
              <h3 className="mb-2 font-medium text-gray-700">Transcription:</h3>
              <p className="mb-4 text-sm leading-relaxed sm:text-base">
                {transcription}
              </p>

              <div className="absolute top-3 right-3">
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant={copied ? "secondary" : "outline"}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
