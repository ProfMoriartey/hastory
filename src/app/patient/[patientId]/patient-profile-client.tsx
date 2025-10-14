"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  ArrowLeft,
  PlusCircle,
  FileText,
  Calendar,
  User,
  History,
  ListChecks,
} from "lucide-react";
import type { Patient, Session } from "~/server/db/schema";
// We only need the type here, not the value, but let's assume it's imported this way

interface PatientProfileClientProps {
  patient: Patient;
  sessions: Session[];
}

// ------------------------------------
// Longitudinal Data Aggregation Helpers
// ------------------------------------

interface AggregatedSummary {
  totalSessions: number;
  chronologicalComplaints: {
    date: string;
    complaint: string;
    sessionId: number;
  }[];
  runningChronicDiseases: Set<string>;
  runningMedications: Set<string>;
}

/** Processes all sessions to create a running summary of key clinical data. */
const aggregateData = (sessions: Session[]): AggregatedSummary => {
  const summary: AggregatedSummary = {
    totalSessions: sessions.length,
    chronologicalComplaints: [],
    runningChronicDiseases: new Set(),
    runningMedications: new Set(),
  };

  for (const session of sessions) {
    // ✅ FIX: Removed "as PatientHistory"
    const data = session.structuredData;

    // 1. Complaints
    if (data?.chiefComplaint?.complaint) {
      summary.chronologicalComplaints.push({
        date: new Date(session.createdAt).toLocaleDateString(),
        complaint: data.chiefComplaint.complaint,
        sessionId: session.id,
      });
    }

    // 2. Chronic Diseases (Merging arrays from all sessions)
    const diseases = data?.pastMedicalHistory?.chronicDiseases;
    if (diseases && Array.isArray(diseases)) {
      diseases.forEach((d) => {
        if (d && d.trim().toLowerCase() !== "none")
          summary.runningChronicDiseases.add(d.trim());
      });
    }

    // 3. Medications (Merging current medication lists)
    const currentMeds = data?.medications?.current;
    if (currentMeds && Array.isArray(currentMeds)) {
      currentMeds.forEach((m) => {
        const medString = `${m.name} (${m.dose ?? "N/A"}, ${m.frequency ?? "N/A"})`;
        summary.runningMedications.add(medString);
      });
    }
  }

  return summary;
};

export default function PatientProfileClient({
  patient,
  sessions,
}: PatientProfileClientProps) {
  const router = useRouter();
  const summary = aggregateData(sessions);

  // Last 5 sessions, sorted by date (newest first)
  const lastFiveSessions = sessions
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Find the last session securely
  const lastSession =
    sessions.length > 0 ? sessions[sessions.length - 1] : undefined;

  const lastVisit = lastSession
    ? new Date(lastSession.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      {/* Header/Navigation */}
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-800">{patient.name}</h1>
          <Button
            onClick={() => router.push(`/patient/${patient.id}/new-session`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Patient Demographics Card (Fixed Header) */}
        <Card className="mb-8 border-t-4 border-blue-500 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{patient.name}</CardTitle>
            <CardDescription className="grid gap-2 pt-2 text-gray-600 sm:grid-cols-3">
              <span className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Gender:{" "}
                {patient.gender ?? "N/A"}
              </span>
              <span className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> D.O.B:{" "}
                {patient.dateOfBirth ?? "N/A"}
              </span>
              <span className="flex items-center">
                <History className="mr-2 h-4 w-4" /> Last Visit: {lastVisit}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabs for Summary and Recent Sessions */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">
              <ListChecks className="mr-2 h-4 w-4" /> Summary
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <FileText className="mr-2 h-4 w-4" /> Recent Sessions (
              {sessions.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Longitudinal Summary (Content Unchanged) */}
          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Running Chronic Diseases */}
              <Card>
                <CardHeader>
                  <CardTitle>Running Medical History</CardTitle>
                  <CardDescription>
                    Aggregated chronic conditions from all visits.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.runningChronicDiseases.size > 0 ? (
                    <ul className="ml-5 list-disc space-y-1 text-gray-700">
                      {Array.from(summary.runningChronicDiseases).map(
                        (disease, i) => (
                          <li key={i}>{disease}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No chronic conditions recorded.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Running Medications */}
              <Card>
                <CardHeader>
                  <CardTitle>Current/Past Medications</CardTitle>
                  <CardDescription>
                    Aggregated medications and supplements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.runningMedications.size > 0 ? (
                    <ul className="ml-5 list-disc space-y-1 text-gray-700">
                      {Array.from(summary.runningMedications).map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No active medications recorded.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Chronological Chief Complaints */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Chronological Visit History</CardTitle>
                  <CardDescription>
                    Primary complaint recorded at each appointment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.chronologicalComplaints.length > 0 ? (
                    <div className="space-y-3">
                      {/* Reverse the order to show newest visits first */}
                      {summary.chronologicalComplaints
                        .slice()
                        .reverse()
                        .map((complaint) => (
                          <div
                            key={complaint.sessionId}
                            className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition hover:bg-gray-50"
                            onClick={() =>
                              router.push(
                                `/patient/${patient.id}/sessions/${complaint.sessionId}`,
                              )
                            }
                          >
                            <p className="font-medium text-gray-800">
                              {complaint.complaint ?? "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {complaint.date}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No chief complaints recorded.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Recent Sessions List (Last 5) */}
          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">
                  Last {lastFiveSessions.length} Sessions
                </CardTitle>
                <Button
                  onClick={() => router.push(`/patient/${patient.id}/sessions`)}
                  variant="secondary"
                >
                  View All Sessions
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lastFiveSessions.map((session) => (
                    <div
                      key={session.id}
                      className="cursor-pointer rounded-lg border p-3 transition hover:bg-blue-50"
                      onClick={() =>
                        router.push(
                          `/patient/${patient.id}/sessions/${session.id}`,
                        )
                      }
                    >
                      {/* ✅ FIX: Removed "as PatientHistory" assertion */}
                      <p className="font-medium">
                        {session.structuredData?.chiefComplaint?.complaint ??
                          `Session ${session.id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                {sessions.length === 0 && (
                  <p className="text-gray-500 italic">No sessions available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
