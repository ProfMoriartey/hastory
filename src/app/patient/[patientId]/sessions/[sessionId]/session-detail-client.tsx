"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { ArrowLeft, FileDown, Trash2, Loader2 } from "lucide-react";
import type { Patient, Session } from "~/server/db/schema";
// Assuming ReportTemplate is located here (adjust path if needed)
import ReportTemplate from "~/app/history/_components/ReportTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

import { deleteSessionAction } from "~/actions/session-actions";

interface SessionDetailClientProps {
  session: Session;
  patient: Patient;
}

export default function SessionDetailClient({
  session,
  patient,
}: SessionDetailClientProps) {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    // Call the Server Action
    const result = await deleteSessionAction(patient.id, session.id);

    if (result.success) {
      // Navigate back to the session history list on success
      router.push(`/patient/${patient.id}/sessions`);
    } else {
      // Handle the error (e.g., show a toast or alert)
      alert(`Deletion Failed: ${result.error}`);
      setIsDeleting(false);
    }
  };

  // Function to derive a quick title for the report based on its content
  const getTitle = () => {
    const complaint = session.structuredData?.chiefComplaint?.complaint;
    const date = new Date(session.createdAt).toLocaleDateString();
    return `Report for ${patient.name}: ${complaint ?? "Session"} (${date})`;
  };

  // ✅ PDF Export Handler (Re-integrated from your original page.tsx)
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    // Add a temporary class to ensure the PDF rendering is clean (e.g., hiding scrollbars)
    element.classList.add("pdf-rendering");

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // Remove the temporary class
    element.classList.remove("pdf-rendering");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Patient_Report_${patient.name}_${session.id}.pdf`);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/patient/${patient.id}/sessions`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
          <h1 className="hidden text-lg font-semibold text-gray-800 sm:block">
            {getTitle()}
          </h1>
          {/* <Button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Download PDF
          </Button> */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Session
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  session record from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Deleting...
                    </>
                  ) : (
                    "Confirm Deletion"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-800 sm:text-left">
          {getTitle()}
        </h2>

        {/* 🎯 Structured Report Template */}
        <ReportTemplate ref={reportRef} data={session.structuredData} />

        {/* Original Transcript for context */}
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Original Transcript</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-gray-700">
            {session.transcript}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
