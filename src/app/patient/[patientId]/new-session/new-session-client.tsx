"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import type { PatientHistory } from "~/lib/patientHistorySchema";

// Assuming analyzeMedicalTextAction is accessible here (e.g., "~/actions/history").
// You must adjust this path if your actions file is located elsewhere.
import { analyzeMedicalTextAction } from "~/app/history/actions";

import ReportTemplate from "~/app/history/_components/ReportTemplate";

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
  const [prompt, setPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const handleAnalyze = async (): Promise<void> => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      // 🎯 Call the Server Action with the prompt AND the required patientId
      const result = await analyzeMedicalTextAction(prompt, patientId);

      if (result.error) {
        setResponse({
          error: result.error,
          details: result.details,
        });
      } else {
        // Data is successfully saved to Drizzle ORM 'sessions' table here.
        setResponse({ data: result.data });

        // 🎯 Redirect to the patient's full session history view upon successful save.
        router.push(`/patient/${patientId}/sessions`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setResponse({
        error: error.message,
        details: "Client-side execution error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push(`/patient/${patientId}/sessions`)}
          >
            🔙 Cancel & View History
          </Button>
          <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
            {patientName}: New Session
          </h1>
        </div>
      </nav>

      <div className="flex flex-grow flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800 sm:text-left">
            Analyze Conversation for {patientName}
          </h2>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste or type a doctor–patient conversation..."
            className="mb-4 h-40 w-full resize-none"
          />

          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 sm:w-48"
            >
              {loading ? "Analyzing & Saving..." : "Analyze & Save Session"}
            </Button>
          </div>

          {response?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
              <h3 className="mb-1 font-medium">Error:</h3>
              <p>{response.error}</p>
              {response.details && (
                <p className="mt-2 text-sm">
                  Details: {response.details.substring(0, 150)}
                </p>
              )}
            </div>
          )}

          {/* Report template is now hidden on success since the user is redirected */}
          {/* Leaving this here for initial testing purposes, but it can be removed */}
          {response?.data && (
            <ReportTemplate ref={reportRef} data={response.data} />
          )}
        </div>
      </div>
    </main>
  );
}
