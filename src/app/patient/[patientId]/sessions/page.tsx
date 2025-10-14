import { notFound } from "next/navigation";
import { db } from "~/server/db/index";
import { sessions } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { asc } from "drizzle-orm";
import SessionHistoryList from "./session-history-list"; // Client component for presentation

interface SessionsPageProps {
  params: Promise<{
    patientId: string; // The ID from the URL
  }>;
}

export default async function SessionsPage({ params }: SessionsPageProps) {
  const { userId } = await auth();
  const { patientId: rawPatientId } = await params;
  const patientId = parseInt(rawPatientId);

  if (!userId || isNaN(patientId)) {
    notFound();
  }

  // 1. SECURITY CHECK: Verify user ownership and fetch patient name
  // This is a joined query to ensure the sessions belong to a patient owned by this user.
  const patientData = await db.query.patients.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, patientId), eq(p.userId, userId)),
    // 2. Fetch all sessions related to this patient, ordered chronologically
    with: {
      sessions: {
        orderBy: [asc(sessions.createdAt)],
      },
    },
  });

  if (!patientData) {
    // Patient not found or ownership failed
    notFound();
  }

  // Pass the data down to the Client Component for rendering
  return (
    <SessionHistoryList
      patientId={patientId}
      patientName={patientData.name}
      sessions={patientData.sessions}
    />
  );
}
