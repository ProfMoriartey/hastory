// "use client";

// import { useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "~/components/ui/button";
// import { Textarea } from "~/components/ui/textarea";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import type { PatientHistory } from "~/lib/patientHistorySchema";

// // 🎯 Import the new Server Action
// import { analyzeMedicalTextAction } from "./actions";
// import ReportTemplate from "./\_components/ReportTemplate";

// // Match the Server Action's return type
// interface AnalysisResponse {
// data?: PatientHistory;
// error?: string;
// details?: string;
// }

// export default function HistoryPage() {
// const [prompt, setPrompt] = useState("");
// const [response, setResponse] = useState<AnalysisResponse | null>(null);
// const [loading, setLoading] = useState(false);

// // ✅ FIX: Initialize useRef with null, specifying the HTMLDivElement type
// const reportRef = useRef<HTMLDivElement | null>(null);

// const router = useRouter();

// // ✅ PDF Export Handler (Unchanged)
// const handleDownloadPDF = async () => {
// if (!reportRef.current) return;
// const element = reportRef.current;
// const canvas = await html2canvas(element, { scale: 2 });
// const imgData = canvas.toDataURL("image/png");

// const pdf = new jsPDF("p", "mm", "a4");
// const pdfWidth = pdf.internal.pageSize.getWidth();
// const pdfHeight = (canvas.height \* pdfWidth) / canvas.width;

// pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
// pdf.save("Patient_History_Report.pdf");
// };

// // 🎯 Revised: Use Server Action instead of client-side fetch
// const handleAnalyze = async (): Promise<void> => {
// if (!prompt.trim()) return;
// setLoading(true);
// setResponse(null);

// try {
// // 1. Call the Server Action directly
// const result = await analyzeMedicalTextAction(prompt);

// // 2. Handle the structured result (data or error)
// if (result.error) {
// setResponse({
// error: result.error,
// details: result.details,
// });
// } else {
// setResponse({ data: result.data });
// }
// } catch (err: unknown) {
// const error = err as Error;
// setResponse({
// error: error.message,
// details: "Client-side execution error",
// });
// } finally {
// setLoading(false);
// }
// };

// return (
// <main className="flex min-h-screen flex-col bg-gray-50">
// {/_ ✅ Top Navigation _/}
// <nav className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
// <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
// <div className="flex flex-wrap gap-2">
// <Button variant="secondary" onClick={() => router.push("/")}>
// 🔙 Back
// </Button>
// <Button onClick={() => router.push("/transcribe")}>
// 🎙️ Transcribe
// </Button>
// {response?.data && (
// <Button
// onClick={handleDownloadPDF}
// className="bg-green-600 hover:bg-green-700"
// >
// 📄 Download PDF
// </Button>
// )}
// </div>
// <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
// 🩺 Medical Analyzer
// </h1>
// </div>
// </nav>

// {/_ ✅ Main Content _/}
// <div className="flex flex-grow flex-col items-center justify-start px-4 py-8">
// <div className="w-full max-w-3xl">
// <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800 sm:text-left">
// Analyze Doctor–Patient Conversation
// </h2>

// <Textarea
// value={prompt}
// onChange={(e) => setPrompt(e.target.value)}
// placeholder="Paste or type a doctor–patient conversation..."
// className="mb-4 h-40 w-full resize-none"
// />

// <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
// <Button
// onClick={handleAnalyze}
// disabled={loading}
// className="w-full sm:w-40"
// >
// {loading ? "Analyzing..." : "Analyze"}
// </Button>
// </div>

// {response?.error && (
// <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
// <h3 className="mb-1 font-medium">Error:</h3>
// <p>{response.error}</p>
// {response.details && (
// <pre className="mt-2 rounded-md bg-red-100 p-2 text-xs whitespace-pre-wrap text-red-700">
// Details: {response.details}
// </pre>
// )}
// </div>
// )}

// {response?.data && (
// <ReportTemplate ref={reportRef} data={response.data} />
// )}
// </div>
// </div>
// </main>
// );
// }
