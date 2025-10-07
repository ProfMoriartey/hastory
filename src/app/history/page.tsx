"use client";

import { useState, useRef, forwardRef, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { PatientHistory } from "~/lib/patientHistorySchema";

interface ApiResponse {
  error?: string;
  details?: string;
  data?: PatientHistory;
}

export default function HistoryPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // ✅ PDF Export Handler
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("Patient_History_Report.pdf");
  };

  // ✅ Analyze Handler
  const handleAnalyze = async (): Promise<void> => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        // ✅ Safely parse and type the error JSON
        const errJson = (await res.json().catch(() => ({}))) as unknown;
        const err = errJson as { error?: string };
        throw new Error(err?.error ?? "Request failed");
      }

      // ✅ Parse and narrow the success response safely
      const json = (await res.json().catch(() => ({}))) as unknown;

      if (typeof json !== "object" || json === null) {
        throw new Error("Invalid response format");
      }

      const data = json as ApiResponse;
      setResponse(data);
    } catch (err: unknown) {
      const error = err as Error;
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* ✅ Top Navigation */}
      <nav className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>
              🔙 Back
            </Button>
            <Button onClick={() => router.push("/transcribe")}>
              🎙️ Transcribe
            </Button>
            {response?.data && (
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                📄 Download PDF
              </Button>
            )}
          </div>
          <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
            🩺 Medical Analyzer
          </h1>
        </div>
      </nav>

      {/* ✅ Main Content */}
      <div className="flex flex-grow flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800 sm:text-left">
            Analyze Doctor–Patient Conversation
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
              className="w-full sm:w-40"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>

          {response?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
              <h3 className="mb-1 font-medium">Error:</h3>
              <p>{response.error}</p>
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

/* -------------------------------------------------------------------------- */
/*                                Report Template                             */
/* -------------------------------------------------------------------------- */

interface ReportTemplateProps {
  data: PatientHistory;
}

type FieldValue = string | number | boolean | null | undefined;

const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ data }, ref) => {
    // ✅ Safe formatter for all field types
    const field = (label: string, value?: FieldValue): JSX.Element | null => {
      if (value === undefined || value === null || value === "") return null;

      const stringValue =
        typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

      return (
        <p>
          <span className="font-medium">{label}:</span> {stringValue}
        </p>
      );
    };

    // ✅ Robust list renderer — handles strings, arrays, numbers, booleans
    const list = (
      items?: string | string[] | number | boolean | null,
    ): JSX.Element => {
      const normalized: string[] = Array.isArray(items)
        ? items.map((i) => String(i))
        : items !== undefined && items !== null
          ? [String(items)]
          : [];

      return normalized.length > 0 ? (
        <ul className="list-inside list-disc text-gray-700">
          {normalized.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">No data</p>
      );
    };

    const section = (title: string, content?: JSX.Element | null) =>
      content ? (
        <div className="mb-6">
          <h2 className="mb-2 border-b border-gray-200 pb-1 text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <div className="space-y-1 text-gray-700">{content}</div>
        </div>
      ) : null;

    return (
      <div
        ref={ref}
        className="mt-6 w-full rounded-md border border-gray-200 bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-center text-xl font-bold text-blue-700 sm:text-left">
          🧾 Structured Patient History
        </h2>

        {section(
          "Patient Info",
          <>
            {field("Full Name", data.patient?.fullName)}
            {field("Age", data.patient?.age)}
            {field("Gender", data.patient?.gender)}
            {field("Occupation", data.patient?.occupation)}
            {field("Marital Status", data.patient?.maritalStatus)}
            {field("Date of Visit", data.patient?.dateOfVisit)}
          </>,
        )}

        {section(
          "Chief Complaint",
          <>
            {field("Complaint", data.chiefComplaint?.complaint)}
            {field("Duration", data.chiefComplaint?.duration)}
          </>,
        )}

        {section(
          "History of Present Illness",
          <>
            {field("Onset", data.historyOfPresentIllness?.onset)}
            {field("Character", data.historyOfPresentIllness?.character)}
            {field("Site", data.historyOfPresentIllness?.site)}
            {field("Radiation", data.historyOfPresentIllness?.radiation)}
            {field("Timing", data.historyOfPresentIllness?.timing)}
            {field("Severity", data.historyOfPresentIllness?.severity)}
            {field(
              "Narrative",
              data.historyOfPresentIllness?.chronologicalNarrative,
            )}
          </>,
        )}

        {section("Review of Systems", list(data.reviewOfSystems?.general))}
        {section(
          "Past Medical History",
          list(data.pastMedicalHistory?.chronicDiseases),
        )}
        {section(
          "Medications",
          list(
            data.medications?.current?.map(
              (m) => `${m.name} (${m.dose ?? ""}, ${m.frequency ?? ""})`,
            ),
          ),
        )}
        {section("Family History", list(data.familyHistory?.diseases))}

        {section(
          "Social History",
          <>
            {field("Smoking", data.socialHistory?.smoking)}
            {field("Alcohol", data.socialHistory?.alcohol)}
            {field("Drugs", data.socialHistory?.drugs)}
            {field("Diet", data.socialHistory?.diet)}
            {field("Exercise", data.socialHistory?.exercise)}
            {field("Occupation Hazards", data.socialHistory?.occupationHazards)}
            {field("Living Conditions", data.socialHistory?.livingConditions)}
            {field("Sexual History", data.socialHistory?.sexualHistory)}
          </>,
        )}

        {section(
          "Assessment",
          <>
            {field("Summary", data.assessment?.summary)}
            {list(data.assessment?.differentialDiagnoses)}
          </>,
        )}

        {section(
          "Plan",
          <>
            {list(data.plan?.investigations)}
            {list(data.plan?.treatment)}
            {field("Follow Up", data.plan?.followUp)}
          </>,
        )}
      </div>
    );
  },
);

ReportTemplate.displayName = "ReportTemplate";
