import { notFound } from "next/navigation";
import { db } from "~/server/db/index"; // Adjust path if needed
import { sessions } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { asc } from "drizzle-orm";
import PatientProfileClient from "./patient-profile-client";

interface PatientProfilePageProps {
  params: Promise<{
    patientId: string;
  }>;
}

// 🎯 Server Component to fetch patient data and all sessions
export default async function PatientProfilePage({
  params,
}: PatientProfilePageProps) {
  const { userId } = await auth();
  const { patientId: rawPatientId } = await params;
  const patientId = parseInt(rawPatientId);

  // Initial validation and authentication guard
  if (!userId || isNaN(patientId)) {
    notFound();
  }

  // 1. Fetch patient data and all related sessions in a single query
  const patientData = await db.query.patients.findFirst({
    where: (p, { eq, and }) =>
      and(
        eq(p.id, patientId),
        eq(p.userId, userId), // Security check: Ensure user owns this patient
      ),
    // Eager load all sessions, ordered chronologically (newest first for easier display)
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

  // 2. Pass the fetched, validated data to the Client Component
  return (
    <PatientProfileClient
      patient={patientData}
      sessions={patientData.sessions}
    />
  );
}
