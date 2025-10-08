"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
// 🎯 Import the Server Action from the new file
import { transcribeAudioAction } from "./actions";

export default function TranscribePage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // 🎯 Store the Blob directly, ready for the Server Action
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const router = useRouter();

  const handleStartRecording = async () => {
    setTranscription("");
    setCopied(false);
    setAudioUrl(null); // Clear previous URL
    setAudioBlob(null); // Clear previous Blob

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choose the best supported audio type dynamically
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm" // OpenAI supports 'webm'
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg" // OpenAI supports 'ogg'
          : MediaRecorder.isTypeSupported("audio/wav")
            ? "audio/wav" // OpenAI supports 'wav'
            : ""; // Let the browser choose its best default if none of the above

      if (!mimeType) {
        // If we can't determine a type, use the default and hope for the best
        console.warn(
          "Could not determine supported mimeType. Falling back to default.",
        );
      }

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunks.current, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setAudioBlob(finalBlob); // 🎯 Save the Blob for the action
        console.log("✅ Recording saved:", url);
      };

      mediaRecorder.start();
      setRecording(true);
      console.log("🎙️ Recording started with type:", mimeType);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access denied or not supported on this browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // MediaRecorder.onstop handles setting state/ref
      mediaRecorderRef.current = null;
    }
    setRecording(false);
    console.log("🛑 Recording stopped");
  };

  // 🎯 Revised: Use Server Action instead of client-side fetch
  const handleSendAudio = async () => {
    if (!audioBlob) return; // Use the stored Blob
    setLoading(true);
    setTranscription("");

    // 1. Create FormData from the Blob
    const formData = new FormData();

    // Append the Blob as 'audio' with its original type/name
    formData.append(
      "audio",
      audioBlob,
      `recording.${audioBlob.type.split("/")[1] ?? "webm"}`,
    );

    // 2. Call the Server Action
    const data = await transcribeAudioAction(formData);

    // 3. Handle the response (text or error)
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
              disabled={!audioBlob || loading} // Use audioBlob check
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
