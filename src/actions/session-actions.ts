"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db/index";
import { sessions, patients } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface DeletionResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes a specific session record while enforcing user ownership and patient context.
 */
export async function deleteSessionAction(patientId: number, sessionId: number): Promise<DeletionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Authentication required." };
  }

  try {
    // 1. Perform a joint query to security-check the session and patient ownership.
    // This query verifies that the session belongs to a patient owned by the current user.
    const securityCheck = await db.select()
        .from(sessions)
        .innerJoin(patients, eq(sessions.patientId, patients.id))
        .where(and(
            eq(sessions.id, sessionId),
            eq(patients.userId, userId), // User owns the patient
            eq(sessions.patientId, patientId) // Session belongs to the correct patient
        ))
        .limit(1);

    if (securityCheck.length === 0) {
        return { success: false, error: "Session not found or user unauthorized." };
    }
    
    // 2. Perform the deletion
    await db.delete(sessions)
      .where(eq(sessions.id, sessionId));
      
    // 3. Revalidate the session list path to immediately update the UI
    revalidatePath(`/patient/${patientId}/sessions`);
    
    return { success: true };

  } catch (err) {
    console.error("Session deletion failed:", err);
    return { success: false, error: "Database error during deletion." };
  }
}