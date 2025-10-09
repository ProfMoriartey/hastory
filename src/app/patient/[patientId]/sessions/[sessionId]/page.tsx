import { notFound } from "next/navigation";
import { db } from "~/server/db/index";
import {
  sessions,
  patients,
  type Patient,
  type Session,
} from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import SessionDetailClient from "./session-detail-client"; // Client wrapper

interface SessionDetailPageProps {
  params: Promise<{
    patientId: string;
    sessionId: string;
  }>;
}

// 🎯 Server Component to fetch the specific session and patient data
export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { userId } = await auth();
  const { patientId: rawPatientId } = await params;
  const { patientId: rawSessionId } = await params;

  const patientId = parseInt(rawPatientId);
  const sessionId = parseInt(rawSessionId);

  // Initial validation and authentication guard
  if (!userId || isNaN(patientId) || isNaN(sessionId)) {
    notFound();
  }

  // 1. Fetch Session Data with Patient relationship
  // We join/nest the patient data to verify ownership in a single query.
  const sessionRecord = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      patient: true, // Eager load the parent patient record
    },
  });

  // 2. Security Check: Session must exist AND the patient must be owned by the current user
  if (!sessionRecord || sessionRecord.patient.userId !== userId) {
    notFound();
  }

  // 3. Destructure the data for clarity
  const sessionData: Session = sessionRecord;
  const patientData: Patient = sessionRecord.patient;

  // 4. Pass the fetched, validated data to the Client Component
  return <SessionDetailClient session={sessionData} patient={patientData} />;
}
