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
import type { Session } from "~/server/db/schema";
import { ArrowLeft, PlusCircle, FileText, User } from "lucide-react";

interface SessionHistoryListProps {
  patientId: number;
  patientName: string;
  sessions: Session[]; // Array of sessions fetched by the Server Component
}

export default function SessionHistoryList({
  patientId,
  patientName,
  sessions,
}: SessionHistoryListProps) {
  const router = useRouter();

  // Function to determine the chief complaint summary for the card title
  const getSessionSummary = (session: Session): string => {
    // structuredData is type-safe due to Drizzle $type and Zod validation
    const complaint = session.structuredData?.chiefComplaint?.complaint;
    const date = new Date(session.createdAt).toLocaleDateString();
    return complaint
      ? `${complaint} (${date})`
      : `Session ${session.id} (${date})`;
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-16">
      <nav className="fixed top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 hidden h-4 w-4 md:block" /> Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/patient/${patientId}`)}
          >
            <User className="mr-2 hidden h-5 w-5 text-blue-600 md:block" />
            Profile
          </Button>

          <Button
            onClick={() => router.push(`/patient/${patientId}/new-session`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 hidden h-4 w-4 md:block" /> New Session
          </Button>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold text-gray-800">
          History for {patientName}
        </h2>

        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer transition hover:border-blue-400 hover:shadow-lg"
                onClick={() =>
                  router.push(`/patient/${patientId}/sessions/${session.id}`)
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="mr-3 h-5 w-5 text-gray-600" />
                    {getSessionSummary(session)}
                  </CardTitle>
                  <CardDescription>
                    {session.structuredData?.historyOfPresentIllness?.chronologicalNarrative?.substring(
                      0,
                      150,
                    ) ?? session.transcript.substring(0, 150)}
                    ...
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card className="py-12 text-center text-gray-500">
              <p>No sessions recorded for this patient yet.</p>
              <Button
                variant="link"
                className="mt-2 text-blue-600"
                onClick={() => router.push(`/patient/${patientId}/new-session`)}
              >
                Start the first session.
              </Button>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
