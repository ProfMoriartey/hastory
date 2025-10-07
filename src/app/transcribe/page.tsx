"use client";

import { useState, useRef } from "react";
import { Button } from "~/components/ui/button";

export default function TranscribePage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        🎙️ Audio Transcriber
      </h1>

      <div className="mb-6 flex gap-4">
        {!recording ? (
          <Button onClick={handleStartRecording}>Start Recording</Button>
        ) : (
          <Button onClick={handleStopRecording} variant="destructive">
            Stop Recording
          </Button>
        )}
        <Button onClick={handleSendAudio} disabled={!audioUrl || loading}>
          {loading ? "Processing..." : "Transcribe"}
        </Button>
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="mb-6 w-80">
          Your browser does not support audio playback.
        </audio>
      )}

      {transcription && (
        <div className="relative w-full max-w-2xl rounded-md bg-white p-4 whitespace-pre-wrap text-gray-800 shadow md:w-[600px]">
          <h2 className="mb-2 font-medium">Transcription:</h2>
          <p className="mb-4">{transcription}</p>

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
    </main>
  );
}
