"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Mic, MicOff, Send, FileDown, Loader2, User } from "lucide-react";
import type { PatientHistory } from "~/lib/patientHistorySchema";
import { UploadDropzone, uploadFiles } from "~/utils/uploadthing";
import { AudioUploader } from "~/components/shared/AudioUploader";

// 🎯 Import both Server Actions
import { analyzeMedicalTextAction } from "~/actions/analyze";
import { transcribeAudioAction } from "~/actions/transcribe"; // Assuming this path

import ReportTemplate from "~/app/history/_components/ReportTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface NewSessionClientProps {
  patientId: number;
  patientName: string;
  initialPrompt: string;
}

interface AnalysisResponse {
  data?: PatientHistory;
  error?: string;
  details?: string;
}

export default function NewSessionClient({
  patientId,
  patientName,
  initialPrompt,
}: NewSessionClientProps) {
  // State for Analysis Flow
  const [prompt, setPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State for Transcription Flow
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // ✅ NEW: Track upload status

  const reportRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const router = useRouter();

  // --- TRANSCRIPTION HANDLERS ---
  const handleUploadComplete = (res: { url: string }[]) => {
    const uploadedFileUrl = res[0]?.url ?? null;

    if (uploadedFileUrl) {
      setAudioUrl(uploadedFileUrl);
      setUploadFeedback(
        "✅ Audio file saved to Uploadthing. Ready to transcribe.",
      );
    } else {
      setUploadFeedback("❌ Upload failed to return a URL.");
    }
    setIsUploading(false);
    setIsRecording(false); // Ensure recording state is reset
  };

  const handleUploadError = (error: Error) => {
    setUploadFeedback(`❌ Upload error: ${error.message}`);
    setIsUploading(false);
    setIsRecording(false);
    console.error("Uploadthing Error:", error);
  };

  const handleStartRecording = async () => {
    setAudioUrl(null);
    setUploadFeedback(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choose the best supported audio type dynamically
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      mediaRecorderRef.current?.stop();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      // 🎯 NEW: On stop, trigger the Uploadthing transfer
      mediaRecorder.onstop = async () => {
        const finalBlob = new Blob(audioChunks.current, { type: mimeType });

        // ✅ FIX: Convert the Blob to a File object, providing a temporary name
        const audioFile = new File(
          [finalBlob],
          `recording_${Date.now()}.${mimeType.split("/")[1] ?? "webm"}`, // Provide a name
          { type: mimeType },
        );

        setUploadFeedback("💾 Processing and uploading recorded audio...");

        try {
          // Pass the File object instead of the Blob
          const res = await uploadFiles("patientAudio", { files: [audioFile] });

          if (res && res.length > 0) {
            handleUploadComplete(res as { url: string }[]);
          } else {
            handleUploadError(new Error("Uploadthing returned no file data."));
          }
        } catch (err) {
          handleUploadError(err as Error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access denied or not supported on this browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    console.log("🛑 Recording stopped");
    setIsUploading(true);
  };

  // --- TRANSCRIBE HANDLER ---

  const handleTranscribe = async () => {
    if (!audioUrl) return;
    setIsTranscribing(true);
    setResponse(null); // Clear analysis response
    setUploadFeedback("🎙️ Transcribing audio...");

    // Call the Transcription Server Action
    const result = await transcribeAudioAction(audioUrl);

    if (result.error) {
      setResponse({ error: "Transcription failed.", details: result.error });
      setPrompt("");
    } else if (result.text) {
      setPrompt(result.text);
    }

    setIsTranscribing(false);
    setUploadFeedback(null);
  };

  // --- ANALYSIS HANDLER ---

  const handleAnalyze = async (): Promise<void> => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    setResponse(null);

    try {
      // Call the Server Action with the prompt and the required patientId
      const result = await analyzeMedicalTextAction(prompt, patientId);

      if ("error" in result) {
        setResponse({
          error: result.error,
          details: result.details,
        });
      } else {
        setResponse({ data: result.data });
        // Redirect to the session history list after successful save
        router.push(`/patient/${patientId}/sessions`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setResponse({
        error: error.message,
        details: "Client-side execution error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- PDF HANDLER (Re-integrated) ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    element.classList.add("pdf-rendering"); // Temporary class for rendering cleanup

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    element.classList.remove("pdf-rendering");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Patient_Report_${patientName}_${patientId}.pdf`);
  };

  // --- RENDER ---
  const isLoading = isAnalyzing || isTranscribing || isUploading; // ✅ Include isUploading

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      {/* Header/Navigation */}
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            🔙 Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/patient/${patientId}`)}
          >
            <User className="mr-2 hidden h-5 w-5 text-blue-600 md:block" />
            Profile
          </Button>

          <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
            {patientName}: New Session
          </h1>
          {response?.data && (
            <Button
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
        </div>
      </nav>

      <div className="flex flex-grow flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800 sm:text-left">
            Analyze Conversation for {patientName}
          </h2>

          {/* Input Area */}
          <div className="relative mb-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste or type conversation transcript, or record audio below..."
              className="h-40 w-full resize-none pr-10"
              disabled={isLoading}
            />
            {isTranscribing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-blue-600">Transcribing...</span>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-4 flex w-full items-center justify-center gap-4">
              <audio
                controls
                src={audioUrl}
                className="w-full rounded-md border border-gray-200"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* Controls */}
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Recording Buttons */}
            <div className="flex w-full gap-3 sm:w-auto">
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  disabled={isLoading}
                  variant="outline"
                  className="w-1/2 border-red-300 text-red-600 hover:bg-red-50 sm:w-auto"
                >
                  <Mic className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="w-1/2 animate-pulse sm:w-auto"
                >
                  <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )}

              <Button
                onClick={handleTranscribe}
                disabled={!audioUrl || isAnalyzing || isTranscribing}
                variant="secondary"
                className="w-1/2 sm:w-auto"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Transcribe
                  </>
                )}
              </Button>
            </div>

            <div className="mb-8 border-t pt-4">
              {/* Use the imported UploadDropzone or your custom component */}
              <AudioUploader
                onClientUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
              {uploadFeedback && (
                <p
                  className={`mt-2 text-sm ${uploadFeedback.startsWith("❌") ? "text-red-500" : "text-green-600"}`}
                >
                  {uploadFeedback}
                </p>
              )}
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 sm:w-40"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                "Analyze & Save"
              )}
            </Button>
          </div>

          {/* Error/Report Output */}
          {response?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
              <h3 className="mb-1 font-medium">Error: {response.error}</h3>
              {response.details && (
                <p className="mt-1 text-sm">
                  Details: {response.details.substring(0, 100)}...
                </p>
              )}
            </div>
          )}

          {response?.data && (
            <ReportTemplate ref={reportRef} data={response.data} />
          )}
        </div>
      </div>
    </main>
  );
}
