// src/app/dashboard/actions.ts
"use server";

import { db } from "~/server/db/index"; // Assuming your Drizzle client instance
import { patients, users, type NewPatient, type Patient } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function syncUser(userId: string): Promise<void> {
  // Drizzle's insert operation handles conflict resolution for upsert logic.
  await db.insert(users)
    .values({ id: userId })
    // If a conflict occurs on the primary key (id), do nothing.
    // This is the efficient way to check and insert in one atomic step.
    .onConflictDoNothing({ target: users.id }); 
}

// --- Schemas for Server Action Input Validation (Zod) ---

const CreatePatientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

// --- Read Action: Fetch Patients ---

/** Fetches all patients belonging to the logged-in user. */
export async function getPatientsAction(): Promise<Patient[]> {
  const { userId } = await auth();
  if (!userId) {
    // In a protected route, this case should ideally not happen.
    // Throwing an error ensures security.
    throw new Error("Unauthorized: User ID not available.");
  }

  // Fetch patients where the userId matches the current user
  const patientList = await db.query.patients.findMany({
    where: eq(patients.userId, userId),
    orderBy: [patients.name],
  });

  return patientList;
}

// --- Create Action: Create New Patient ---

/** Creates a new patient linked to the logged-in user. */
export async function createPatientAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Authentication required to create a patient." };
  }

  // 🎯 STEP 1: JIT SYNC
  try {
    await syncUser(userId); 
  } catch (syncError) {
    console.error("JIT User Sync Failed:", syncError);
    return { error: "Failed to verify user identity." };
  }
  
  // 2. Validate Form Data using Zod (UNCHANGED)
  const validationResult = CreatePatientSchema.safeParse({
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message ?? "Invalid form data.";
    return { error: `Invalid input: ${errorMessage}` };
  }

  const newPatientData: NewPatient = {
    userId: userId,
    name: validationResult.data.name,
    dateOfBirth: validationResult.data.dateOfBirth,
    gender: validationResult.data.gender,
  };

  try {
    // 3. Insert into 'patients' (now guaranteed to pass foreign key check)
    await db.insert(patients).values(newPatientData);

    // 4. Revalidate the dashboard page
    revalidatePath("/dashboard");

    return { success: true };
  } catch (e) {
    console.error("Database error creating patient:", e);
    return { error: "Database error. Could not create patient." };
  }
}