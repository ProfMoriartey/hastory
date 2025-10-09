"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  ArrowLeft,
  PlusCircle,
  FileText,
  Calendar,
  User,
  Baby,
} from "lucide-react";
import type { Patient, Session } from "~/server/db/schema";

interface PatientProfileClientProps {
  patient: Patient;
  sessions: Session[]; // Sessions are already fetched and ordered
}

export default function PatientProfileClient({
  patient,
  sessions,
}: PatientProfileClientProps) {
  const router = useRouter();

  // Helper to determine last visit date
  const lastSession =
    sessions.length > 0 ? sessions[sessions.length - 1] : undefined;

  // Helper to determine last visit date
  const lastVisit = lastSession
    ? new Date(lastSession.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      {/* Header/Navigation */}
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            {patient.name}&apos;s Profile
          </h1>
          <Button
            onClick={() => router.push(`/patient/${patient.id}/new-session`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Start New Session
          </Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Section 1: Patient Demographics Card */}
        <Card className="mb-8 border-t-4 border-blue-500 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{patient.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-gray-700 sm:grid-cols-2">
            <div>
              <p className="flex items-center font-medium">
                <Baby className="mr-2 h-4 w-4" /> Gender:
              </p>
              <p className="ml-6">{patient.gender ?? "Not Recorded"}</p>
            </div>
            <div>
              <p className="flex items-center font-medium">
                <Calendar className="mr-2 h-4 w-4" /> D.O.B:
              </p>
              <p className="ml-6">{patient.dateOfBirth ?? "Not Recorded"}</p>
            </div>
            <div>
              <p className="flex items-center font-medium">
                <FileText className="mr-2 h-4 w-4" /> Total Sessions:
              </p>
              <p className="ml-6">{sessions.length}</p>
            </div>
            <div>
              <p className="flex items-center font-medium">
                <Calendar className="mr-2 h-4 w-4" /> Last Visit:
              </p>
              <p className="ml-6">{lastVisit}</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Sessions History Link */}
        <Card className="shadow-md transition hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              Past Session Records
              <Button
                variant="link"
                onClick={() => router.push(`/patient/${patient.id}/sessions`)}
              >
                View All <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <p className="text-gray-600">
                Showing {sessions.length} recorded sessions. Click above to view
                the chronological history.
              </p>
            ) : (
              <p className="text-gray-500 italic">
                No session history available yet. Start a new session to begin
                the record.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Future Section: Longitudinal Summary (Placeholder for later features) */}
      </div>
    </main>
  );
}
