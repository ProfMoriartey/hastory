import { notFound } from "next/navigation";
import NewSessionClient from "./new-session-client"; // Client wrapper
import { db } from "~/server/db/index";
import { auth } from "@clerk/nextjs/server";

interface NewSessionPageProps {
  params: Promise<{
    patientId: string; // The dynamic segment is always a string
  }>;
}

// 🎯 Server Component to fetch patient details and verify ownership
export default async function NewSessionPage({ params }: NewSessionPageProps) {
  const { userId } = await auth();

  // Await the params object
  const { patientId: rawPatientId } = await params;
  const patientId = parseInt(rawPatientId);

  if (!userId || isNaN(patientId)) {
    // Redirect unauthenticated users or users with invalid ID format
    notFound();
  }

  // 1. Fetch patient data and verify ownership
  const patient = await db.query.patients.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, patientId), eq(p.userId, userId)),
  });

  if (!patient) {
    // Patient not found or user does not own this patient
    notFound();
  }

  // 2. Pass the required ID and data to the Client Component
  return (
    <NewSessionClient
      patientId={patientId}
      patientName={patient.name}
      initialPrompt={""}
    />
  );
}
